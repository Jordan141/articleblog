const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/user')
const Comment = require('../models/comment')
const Article = require('../models/article')
const {isLoggedIn, checkCaptcha} = require('../middleware')
const validator = require('validator')
const svgCaptcha = require('svg-captcha')
const csrf = require('csurf')
const rateLimiter = require('express-rate-limit')
const {getProfileImage, setProfileImage} = require('../utils')
const CATEGORIES_LIST = require('../staticdata/categories.json')
const {USER: USER_LIMITS} = require('../staticdata/minmax.json')
const {findTopStories} = require('../utils')
const csrfProtection = csrf({ cookie: true })

const authLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10, //Start blocking after 10 requests
    message: 'Too many attempts from this IP, please try again in an hour.'
})

router.get('/', async (req, res) => {
    const query = {isApproved: true}
    let currentCategory = null
    if(req.query.category) {
        const isValidCategory = CATEGORIES_LIST.find(category => category.key === req.query.category)
        if(isValidCategory) {
            query.category = req.query.category
            currentCategory = CATEGORIES_LIST.filter(category => category.key === req.query.category)[0]
        }
    }
    try {
        const latestArticles = await Article.find(query).sort('-createdAt').exec()
        const topStories = await findTopStories()
        return res.render('index', {title: 'Pinch of Code', articles: latestArticles, topStories, currentUser: req.user, page: 'articles', isReviewing: false, currentCategory})
    } catch(err) {
        req.log('Index Route', err)
        req.flash('error', 'Oops! Something went wrong!')
        return res.render('/')
    }
})

router.get('/register', csrfProtection, (req, res) => {
    res.render('pages/register', {title: 'Register', page: 'register', csrfToken: req.csrfToken(), limits: USER_LIMITS})
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

            req.log('Register:' + JSON.parse(err))
            if(err?.errors?.properties?.type === 'minlength' || err?.errors?.properties?.type === 'maxlength') {
                return res.render('error', {code: '401', msg: 'Invalid input length.'})
            }
            req.flash('error', 'Oops! Something went wrong!')
            return res.render('error', {code: '500', msg: 'Something went wrong. Please try again later.'})
        }

        const handler = passport.authenticate('local', {
            successRedirect: '/',
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
    res.render('pages/login', {title: 'Login', page: 'login', csrfToken: req.csrfToken(), limits: USER_LIMITS})
})

router.post('/login', authLimit, csrfProtection, checkCaptcha, passport.authenticate('local',
    {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
        successFlash: 'Welcome to Testblog!'
    }
))

router.get('/logout', (req, res) => {
    req.logout()
    req.flash("success", "See you later!");
    res.redirect('/')
})

//CATEGORIES - Show page for article categories
router.get('/categories', async (req, res) => {
    try {
        const topStories = await findTopStories()
        return res.render('pages/categories', {title: 'Categories', topStories, categories: CATEGORIES_LIST})
    } catch(err) {
        console.log('Categories GET:', err)
        return res.redirect('/')
    }
})

//Authors INDEX 
router.get('/authors', async (req, res) => {
    try {
        const authors = await User.find({role: 'author',}).exec()
        if(!authors) res.render('error', {code: '500', msg: 'Someone forgot to load their database.'})

        const sanitisedAuthors = authors.map(author => {
            return Object.assign({
                id: author.id,
                bio: author.bio,
                fullname: author.fullname,
                username: author.username,
                motto: author.motto,
                socials: author.socials
            })
        })
        const topStories = await findTopStories()
        return res.render('pages/authors', {title: 'Authors', authors: sanitisedAuthors, topStories})
    } catch(err) {
        req.log('GET Authors: ', err)
        return res.render('error', {code: 500, msg: 'Oops! Something went wrong!'})
    }
})

//User profiles route
router.get('/authors/:id', (req, res) => {
    if(req.params.id === undefined) return res.sendStatus(500)
    if(!validator.isAlphanumeric(req.params.id)) return res.sendStatus(500)

    User.findById(req.params.id, (err, foundUser) => {
        if(err){
            req.flash("error", "Oops! Something went wrong!")
            req.log('GET Author Profile ID:', req.params.id, err)
            return res.redirect('/')
        }
        Article.find().where('author.id').equals(foundUser._id).exec((err, articles) => {
            if(err){
                req.flash('error', 'Oops! Something went wrong!')
                res.redirect('/')
            }
            res.render('pages/author-profile', {title: `${foundUser.fullname || foundUser.username}'s profile`, user: foundUser, articles, isReviewing: false})
        })
    })
})

//user - EDIT ROUTE
router.get("/authors/:id/edit", isLoggedIn, async (req, res) => {
    if(req.params.id === undefined) return res.send(500)
    if(!validator.isAlphanumeric(req.params.id)) return res.sendStatus(500)

    try {
        const user = await User.findById(req.params.id).exec()
        const comments = await Comment.find({author: {id: user.id}})
        res.render("pages/edit-profile", {title: `Edit ${user.fullname || user.username}'s profile`,user, comments, limits: USER_LIMITS})

    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('Author EDIT:', err)
        return res.redirect('/')
    }
})

//Update ROUTE
router.put("/authors/:id", isLoggedIn, async (req, res) => {
    const email = req.body?.email ?? null
    let profileImage = req.files?.avatar ?? null
    const bio = req.body?.bio ?? null
    const fullname = req.body?.fullname ?? null
    const motto = req.body?.motto ?? null
    let newUserData = {}

    if(email) newUserData.email = email
    if(bio) newUserData.bio = bio
    if(fullname) newUserData.fullname = fullname
    if(motto) newUserData.motto = motto
    
    try {
    if(profileImage) await setProfileImage(req.user.username, profileImage)
    if(!newUserData) return res.redirect('/authors')

    const user = await User.findByIdAndUpdate(req.params.id, {$set: newUserData})
    req.flash("success", "Profile Updated!")
    return res.redirect("/authors/" + user._id)
    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('User Update:', err)
        return res.redirect('/')
    }
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
    const {width, height} = req.query
    if(!username) return res.sendStatus(400)
    if(width && height) return getProfileImage(res, username, width, height)
    return getProfileImage(res, username)
})



module.exports = router