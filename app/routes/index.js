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
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')

const csrfProtection = csrf({ cookie: true })
sharp.cache({files: 0})
const authLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10, //Start blocking after 10 requests
    message: 'Too many attempts from this IP, please try again in an hour.'
})

const DEFAULT_IMAGE_WIDTH = 256, DEFAULT_IMAGE_HEIGHT = 256
const JPEG = 'jpeg', JPEG_OPTIONS = {force: true, chromaSubsampling: '4:4:4'}

router.get('/', (req, res) => {
    Article.find({}).exec().
    then(articles => res.render('index', {title: 'Pinch of Code', articles, currentUser: req.user, page: 'articles', isReviewing: false})).
    catch(err => {
        console.log('Index Route', err)
        req.flash('error', 'Oops! Something went wrong!')
        return res.render('/')
    })
})

router.get('/register', csrfProtection, (req, res) => {
    res.render('pages/register', {title: 'Register', page: 'register', csrfToken: req.csrfToken() })
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
    res.render('pages/login', {title: 'Login', page: 'login', csrfToken: req.csrfToken()})
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

        return res.render('pages/authors', {title: 'Authors', authors: sanitisedAuthors})
    } catch(err) {
        console.log('Authors: GET', err)
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
            console.log(err)
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
        res.render("pages/edit-profile", {title: `Edit ${user.fullname || user.username}'s profile`,user, comments})

    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        console.log(err)
        return res.redirect('/')
    }
})

//Update ROUTE
router.put("/authors/:id", isLoggedIn, async (req, res) => {
    const email = req.body?.email ?? null
    let avatar = req.files?.avatar ?? null
    const bio = req.body?.bio ?? null
    const fullname = req.body?.fullname ?? null
    const motto = req.body?.motto ?? null
    let newUserData = {}

    if(email) newUserData.email = email
    if(bio) newUserData.bio = bio
    if(fullname) newUserData.fullname = fullname
    if(motto) newUserData.motto = motto
    try {
        if(avatar) {
            const avatarPath = 'avatar.jpeg'
            const filePath = path.join(getDirectory(req.user.username), avatarPath)
            const imageInfo = await sharp(avatar.data).toFormat(JPEG).jpeg(JPEG_OPTIONS).toFile(filePath)
            newUserData.avatar = avatarPath
        }

        if(!newUserData) return res.redirect('/authors/' + user._id)
        const user = await User.findByIdAndUpdate(req.params.id, {$set: newUserData})
        req.flash("success", "Profile Updated!")
        return res.redirect("/authors/" + user._id)
    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        console.log('User Update:', err)
        return res.redirect('/')
    }
})

router.post('/upload', isLoggedIn, async (req, res) => {
    if(req?.user?.role !== 'author') return res.render('error', {code: 400, msg: 'You are not authorized to do this'})

    const image = req.files?.image ?? null
    if(!image) return res.render('error', {code: 500, msg:'Invalid Image'})

    const dirPath = path.join(__dirname + '../../content', 'articles', 'images')
    console.log(dirPath)
    if(!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, {recursive: true})
    const fileName = `${Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 8)}.${JPEG}`
    const filePath = path.join(dirPath, fileName)
    console.log(filePath)
    sharp(image.data).toFormat(JPEG, JPEG_OPTIONS).toFile(filePath)
    .then(info => {
        console.log(info)
        res.send({url: '/articles/images/' +  fileName})
    })
    .catch(err => {
        console.log('Oh no', err)
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
router.get('/image/:username', async (req, res) => {
    const username = req.params?.username ?? null
    const width = parseInt(req.query?.width ?? DEFAULT_IMAGE_WIDTH)
    const height = parseInt(req.query?.height ?? DEFAULT_IMAGE_HEIGHT)
    if(!username) return res.sendStatus(400)

    try {
        const user = await User.findOne({username}).exec()
        if(!user) return res.sendStatus(400)
        const filePath = path.join(getDirectory(user.username), user.avatar)
        if(!fs.existsSync(filePath)) return res.sendStatus(404)
        res.type('image/jpeg')
        const imageBuffer = await fs.promises.readFile(filePath)
        sharp(imageBuffer).resize(width, height).toFormat(JPEG).jpeg(JPEG_OPTIONS).pipe(res)
    } catch(err) {
        console.log('Image Route:', err)
        return res.sendStatus(400)
    }
})

function getDirectory(username) {
    const URL = path.join(__dirname + '../../content', 'images', username)
    if(!fs.existsSync(URL)) {
        fs.mkdirSync(URL, {recursive: true})
    }
    return URL
}

module.exports = router