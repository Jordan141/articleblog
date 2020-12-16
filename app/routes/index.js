const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/user')
const Article = require('../models/article')
const {isLoggedIn, checkCaptcha} = require('../middleware')
const validator = require('validator')
const svgCaptcha = require('svg-captcha')
const csrf = require('csurf')
const rateLimiter = require('express-rate-limit')
const path = require('path')
const fs = require('fs')

const csrfProtection = csrf({ cookie: true })

const authLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10, //Start blocking after 10 requests
    message: 'Too many attempts from this IP, please try again in an hour.'
})

router.get('/', (req, res) => {
    res.render("landing")
})

router.get('/register', csrfProtection, (req, res) => {
    res.render('register', {page: 'register', csrfToken: req.csrfToken() })
})

router.post('/register', authLimit, csrfProtection, checkCaptcha, (req, res, next) => {
    const usernameCheck = validator.isAlphanumeric(req.body.username)
    const emailCheck = validator.isEmail(req.body.email)
    if(!__nullCheck(req.body) || !usernameCheck || !emailCheck) return res.sendStatus(500)

    let newUser = new User({
        username: req.body.username,
        email: req.body.email
    })

    User.register(newUser, req.body.password, (err) => {
        if(err || req.body.password === undefined){
            if(err.name === 'UserExistsError' || err.code === 11000) {
                req.flash('error', 'That username or email is already taken.')
                return res.redirect('/register')
            }

            console.log('Register:', JSON.parse(err))
            req.flash('error', 'Oops! Something went wrong!')
            return res.redirect('register')
        }

        const handler = passport.authenticate('local', {
            successRedirect: '/articles',
            successFlash: 'Successfully registered',
            failureRedirect: '/register'})
        
        handler(req, res, next)
    })

})

function __nullCheck(body) {
    switch(body) {
        case body.username === undefined:
        case body.firstName === undefined:
        case body.lastName === undefined:
        case body.email === undefined:
        case body.avatar === undefined:
        case body.bio === undefined:
            return false
        default:
            return true
    }
}


router.get('/login', csrfProtection, (req, res) => {
    res.render('login', {page: 'login', csrfToken: req.csrfToken()})
})

router.post('/login', authLimit, csrfProtection, checkCaptcha, passport.authenticate('local',
    {
        successRedirect: '/articles',
        failureRedirect: '/login',
        failureFlash: true,
        successFlash: 'Welcome to Testblog!'
    }
))

router.get('/logout', (req, res) => {
    req.logout()
    req.flash("success", "See you later!");
    res.redirect('/articles')
})

//User profiles route
router.get('/users/:id', (req, res) => {
    if(req.params.id === undefined) return res.sendStatus(500)
    if(!validator.isAlphanumeric(req.params.id)) return res.sendStatus(500)

    User.findById(req.params.id, (err, foundUser) => {
        if(err){
            req.flash("error", "Oops! Something went wrong!")
            console.log(err)
            return res.redirect('/')
        }
        Article.find().where('author.id').equals(foundUser._id).exec((err, articles) => {
            if(err){
                req.flash('error', 'Oops! Something went wrong!')
                res.redirect('/')
            }
            res.render('users/show', {user: foundUser, articles})
        })
    })
})

//user - EDIT ROUTE
router.get("/users/:id/edit", isLoggedIn, (req, res) => {
    if(req.params.id === undefined) return res.send(500)
    if(!validator.isAlphanumeric(req.params.id)) return res.sendStatus(500)

    User.findById(req.params.id, (err, foundUser) => { 
        if(err){
            req.flash("error", "Oops! Something went wrong!")
            console.log(err)
            return res.redirect('/')
        } else {
        res.render("users/edit", {user: foundUser})
        }
    })
})

//Update ROUTE
router.put("/users/:id", isLoggedIn, (req, res) => {
    const email = req.body?.email ?? null
    let avatar = req.files?.avatar ?? null
    const bio = req.body?.bio ?? null
    let avatarPath = null
    let newUserData = {}

    if(avatar) {
        const extension = avatar.name.split('.')[1]
        avatarPath = `avatar.${extension}`
        const filePath = path.join(getDirectory(req.user.username), avatarPath)
        fs.writeFileSync(filePath, avatar.data, {encoding: 'hex'})
        newUserData['avatar'] = avatarPath
    }
    
    if(email) newUserData['email'] = email
    if(bio) newUserData['bio'] = bio

    if(!newUserData) return res.redirect('/users/' + user._id)

    User.findByIdAndUpdate(req.params.id, {$set: newUserData}, (err, user) => {
        if(err){
            req.flash("error", "Oops! Something went wrong!")
            console.log('User Update:', err)
            return res.redirect('/')
        }
        req.flash("success", "Profile Updated!")
        res.redirect("/users/" + user._id)
  })
})

//Captcha route
router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create()
    req.session.captcha = captcha.text

    res.type('svg')
    res.status(200).send(captcha.data)
})

//Get profile picture
router.get('/image/:username', (req, res) => {
    const username = req.params?.username ?? null
    if(!username) return res.sendStatus(400)

    User.findOne({username}).exec((err, user) => {
        if(err || !user || !user._doc.avatar) return res.sendStatus(400)
        const filePath = path.join(__dirname, '../content', 'images', user._doc.username, user._doc.avatar)
        return res.sendFile(filePath)
    })
})


function getDirectory(username) {
    const URL = path.join(__dirname + '../../content', 'images', username)
    if(!fs.existsSync(URL)) {
        fs.mkdirSync(URL, {recursive: true})
    }
    return URL
}

module.exports = router