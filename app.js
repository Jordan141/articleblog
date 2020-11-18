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
      User              = require('./models/user'),
      redis             = require('redis')

const db = {
    name: process.env.MONGO_INITDB_DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
}

const commentRoutes     = require('./routes/comments'),
      articleRoutes     = require('./routes/articles'),
      authRoutes        = require('./routes/index')

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


//Redis setup
const redisClient = redis.createClient({host: 'redis'}) //Uses default PORT: 6379

//Pass Redis connection to middleware for easy access 
app.use((req, res, next) => {
    req.redis = redisClient
    next()
})

//Express setup
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static(__dirname + '/public'))

//PASSPORT CONFIGURATION
app.use(require('express-session')({
    //Change this key for your project
    secret:'denmarkisbetterthanswedenandfinland',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(cookieParser('secret'))
app.use(flash())

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

app.use('/', authRoutes)
app.use('/articles', articleRoutes)
app.use('/articles/:id/comments', commentRoutes)
app.locals.moment = require('moment')

app.listen(PORT, IP, () => console.log(`Server is listening on ${IP}:${PORT}`))