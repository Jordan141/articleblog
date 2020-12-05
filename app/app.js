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
      rateLimit         = require('express-rate-limit')

const db = {
    name: process.env.MONGO_INITDB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
}

const commentRoutes     = require('./routes/comments'),
      articleRoutes     = require('./routes/articles'),
      authRoutes        = require('./routes/index')


const ONE_KILOBYTE_LIMIT = '1kb'


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
    console.log(db)
    console.log('MongoDB Error:', err)
})


app.set('view engine', 'ejs')

//DDoS prevention
app.use((req, res, next) => {
    if(tooBusy()) {
        return res.sendStatus(503)
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
app.use(bodyParser.urlencoded({extended: true, limit: ONE_KILOBYTE_LIMIT}))
app.use(bodyParser.json({limit: ONE_KILOBYTE_LIMIT}))
app.use(express.static(__dirname + '/public'))

//PASSPORT CONFIGURATION
app.use(require('express-session')({
    //Change this key for your project
    secret: 'denmarkisbetterthanswedenandfinland',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: true} //Enable secure to true while on HTTPS
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
        defaultSrc: ["'self'", "https://stackpath.bootstrapcdn.com"],  // default value for all directives that are absent
        scriptSrc: ["'self'", "https://code.jquery.com/", "https://stackpath.bootstrapcdn.com"],   // helps prevent XSS attacks
        frameAncestors: ["'none'"],  // helps prevent Clickjacking attacks
        styleSrc: ["https://stackpath.bootstrapcdn.com", "'self'" ],
        imgSrc: ["'self'", "http://i.imgur.com"]
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
app.use((req, res, next) => {
        res.locals.currentUser = req.user;
        res.locals.error = req.flash('error')
        res.locals.success = req.flash('success')
        next()
    }
)

process.on('uncaughtException', (err) => {
    console.log(err) //Log what happened TODO: Future PR
    process.exit() //Exit process to avoid unknown state
})

app.use('/', authRoutes)
app.use('/articles', articleRoutes)
app.use('/articles/:id/comments', commentRoutes)
app.locals.moment = require('moment')

app.listen(PORT, IP, () => console.log(`Server is listening on ${IP}:${PORT}`))