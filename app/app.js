require('dotenv').config()// Get environment file

const express           = require('express'),
      app               = express(),
      PORT              = process.env.PORT || 8000,
      IP                = process.env.IP || "0.0.0.0",
      bodyParser        = require('body-parser'),
      mongoose          = require('mongoose'),
      cookieParser      = require("cookie-parser"),
      flash             = require('connect-flash'),
      passport          = require('passport'),
      LocalStrategy     = require('passport-local'),
      methodOverride    = require('method-override'),
      tooBusy           = require('toobusy-js'),
      User              = require('./models/user'),
      helmet            = require('helmet'),
      rateLimit         = require('express-rate-limit'),
      fileUpload        = require('express-fileupload'),
      childProcess      = require('child_process'),
      logger            = require('./logger'),
      morgan            = require('morgan'),
      utils             = require('./utils')

const db = {
    name: process.env.MONGO_INITDB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
}

const commentRoutes     = require('./routes/comments'),
      articleRoutes     = require('./routes/articles'),
      analyticRoutes    = require('./routes/analytics'),
      authRoutes        = require('./routes/index')


const TEN_MEGABYTE_LIMIT = '10mb'
const DEFAULT_MAX_FILE_COUNT = 5
const DEFAULT_MAX_FILE_SIZE = 8 * 1024 * 1024// 8 MB
const DEV_MODE = utils.convertToBoolean(process.env.DEV_MODE)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) ?? DEFAULT_MAX_FILE_SIZE
const MAX_FILE_COUNT = parseInt(process.env.MAX_FILE_COUNT) ?? DEFAULT_MAX_FILE_COUNT

//MongoDB Setup
if(db.username === undefined || db.password === undefined) throw new Error('Database variables undefined, check environmental variables.')
mongoose.connect(`mongodb://mongo_db:27017/${db.name}`, 
    {
        auth: { "authSource": db.name },
        user: db.username,
        pass: db.password,
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
    }
).catch(err => {
    logger.info(db)
    logger.info('MongoDB Error:' + err)
})

mongoose.connection.on('connected', async () => await require('./seed')({clear_db: utils.convertToBoolean(process.env.CLEAR_DB)}))

app.set('view engine', 'ejs')

//DDoS prevention
app.use((req, res, next) => {
    if(tooBusy()) {
        return res.sendStatus(503)
    }
    next()
})

//Logger
app.use(morgan('combined', {stream: logger.stream}))
app.use((req, res, next) => {
    req.log = (...str) => {
        logger.info(`[${new Date().toLocaleString()}]: `.concat(str.join(' ')))
    }
    next()
})
//Bruteforce prevention
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100
})

app.use('/articles/', apiLimiter)

//Express setup
app.use(bodyParser.urlencoded({extended: true, limit: TEN_MEGABYTE_LIMIT}))
app.use(bodyParser.json({limit: TEN_MEGABYTE_LIMIT}))
app.use(fileUpload({
    limits: {fileSize: MAX_FILE_SIZE},
    files: MAX_FILE_COUNT,
    abortOnLimit: true
}))

app.use(express.static(__dirname + '/public/'))

//PASSPORT CONFIGURATION
app.use(require('express-session')({
    //Change this key for your project
    secret: DEV_MODE ? 'denmarkisbetterthanswedenandfinland' : process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: !DEV_MODE, httpOnly: true, sameSite: true}
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(cookieParser('secret'))
app.use(flash())

//Set up HTTP Parameter Pollution
app.use(require('hpp')())

//Set up Helmet
//app.use(helmet.hsts()) //HTTP Strict-Transport-Security enable once ssl
app.use(helmet.frameguard())
app.use(helmet.noSniff())
app.use(helmet.ieNoOpen())
app.use(helmet.hidePoweredBy({setTo: 'Whisky Powered.'}))
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [ "'self'"],  // default value for all directives that are absent
        scriptSrc: [ "'self'", "https://code.jquery.com/", "https://cdnjs.cloudflare.com"],   // helps prevent XSS attacks
        frameAncestors: ["'none'"],  // helps prevent Clickjacking attacks
        styleSrc: ["'self'",  "https://cdnjs.cloudflare.com", 'https://fonts.googleapis.com'],
        imgSrc: [ "'self'", "http://i.imgur.com" ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"]
    }
}))

//Disable XSS Auditor
app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '0')
    next()
})


//Passport setup
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

//Set local variables
app.use(async (req, res, next) => {
        res.locals.currentUser = req.user;
        res.locals.error = req.flash('error')
        res.locals.success = req.flash('success')
        res.locals.currentCategory = ""
        res.locals.searchTerm = ""
        res.locals.commonCategories = await utils.findCommonCategories()
        res.locals.websiteUrl = req.hostname
        res.locals.commitHash = process.env.GIT_COMMIT_HASH || null
        res.locals.commitDate = process.env.GIT_COMMIT_DATE || null
        next()
    }
)

process.on('uncaughtException', (err) => {
    logger.info('uncaughtException:' + err) //Log what happened TODO: Future PR
    process.exit() //Exit process to avoid unknown state
})

app.use('/', authRoutes)
app.use('/articles', articleRoutes)
app.use('/analytics', analyticRoutes)
app.use('/articles/:id/comments', commentRoutes)
app.get('*', (req, res) => {
    res.render('error', {code: 404, msg: 'That directory does not exist!'})
})
app.locals.moment = require('moment')

app.listen(PORT, IP, () => logger.info(`Server is listening on ${IP}:${PORT}`))