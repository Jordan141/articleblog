const express           = require('express'),
      app               = express(),
      PORT              = process.env.PORT || 8000,
      IP                = process.env.IP || "127.0.0.1",
      bodyParser        = require('body-parser'),
      mongoose          = require('mongoose'),
      cookieParser      = require("cookie-parser"),
      flash             = require('connect-flash'),
      passport          = require('passport'),
      LocalStrategy     = require('passport-local'),
      methodOverride    = require('method-override'),
      User              = require('./models/user'),
      {db}              = require('./config.json')

const commentRoutes     = require('./routes/comments'),
      campgroundRoutes  = require('./routes/campgrounds'),
      authRoutes        = require('./routes/index')

mongoose.connect(`mongodb://${db.username}:${db.password}@ds143774.mlab.com:43774/jmoss-yelpcamp`)
app.set('view engine', 'ejs')

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
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/comments', commentRoutes)
app.locals.moment = require('moment')

app.listen(PORT, IP)