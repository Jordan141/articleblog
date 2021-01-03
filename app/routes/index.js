const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/user')
const Comment = require('../models/comment')
const Article = require('../models/article')
const Verify = require('../models/verify')
const Newsletter = require('../models/newsletter')
const {isLoggedIn, checkCaptcha} = require('../middleware')
const validator = require('validator')
const svgCaptcha = require('svg-captcha')
const csrf = require('csurf')
const rateLimiter = require('express-rate-limit')
const {getProfileImage, setProfileImage} = require('../utils')
const CATEGORIES_LIST = require('../staticdata/categories.json')
const {USER: USER_LIMITS} = require('../staticdata/minmax.json')
const {findTopStories, findCommonCategories, buildArticleSearchQuery} = require('../utils')
const csrfProtection = csrf({ cookie: true })
const crypto = require("crypto")
const mailer = require('../mailer')
const DUPLICATE_MONGO_ERROR_CODE = 11000

const authLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10, //Start blocking after 10 requests
    message: 'Too many attempts from this IP, please try again in an hour.'
})

router.get('/', async (req, res) => {
    if(req.query.category) res.locals.currentCategory = CATEGORIES_LIST.filter(category => category.key === req.query.category)[0]
    if(req.query.query) res.locals.searchTerm = req.query.query
    const articleQuery = buildArticleSearchQuery(req.query)

    try {
        const articles = await articleQuery.exec()
        const topStories = await findTopStories()
        const commonCategories = await findCommonCategories()
        return res.render('index', {title: 'Pinch of Code', articles, topStories, currentUser: req.user, page: 'articles', isReviewing: false, commonCategories})
    } catch(err) {
        req.log('Index Route', err)
        req.flash('error', 'Oops! Something went wrong!')
        return res.render('/')
    }
})

router.get('/register', csrfProtection, (req, res) => {
    res.render('pages/register', {title: 'Register', page: 'register', csrfToken: req.csrfToken(), limits: USER_LIMITS})
})

router.post('/register', authLimit, csrfProtection, checkCaptcha, async (req, res) => {
    const usernameCheck = validator.isAlphanumeric(req.body.username)
    const emailCheck = validator.isEmail(req.body.email)
    if(!__nullCheck(req.body) || !usernameCheck || !emailCheck) return res.render('error', {code: 500, msg: 'Invalid inputs'})

    const tempUserLinkForUserWithoutFullname = crypto.randomBytes(14).toString('hex')
    const verificationToken = crypto.randomBytes(42).toString('hex')
    let newUser = new User({
        username: req.body.username,
        email: req.body.email,
        link: tempUserLinkForUserWithoutFullname
    })

    try {
        const user = await User.register(newUser, req.body.password)
        Verify.create({token: verificationToken, userId: user._id})
        const mailInfo = await sendVerificationMail(user.email, verificationToken)
        if(process.env.DEV_MODE) req.log(mailInfo)

        req.flash('success', 'Please verify your account via email sent to - ' + user.email)
        return res.redirect('/login')
    } catch(err) {
        if(err.name === 'UserExistsError' || err.code === 11000) {
            req.log(err)
            req.flash('error', 'That username or email is already taken.')
            return res.redirect('/register')
        }

        req.log('Register:', err)
        if(err?.errors?.properties?.type === 'minlength' || err?.errors?.properties?.type === 'maxlength') {
            return res.render('error', {code: '401', msg: 'Invalid input length.'})
        }

        req.flash('error', 'Oops! Something went wrong!')
        return res.render('error', {code: '500', msg: 'Something went wrong. Please try again later.'})
    }
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
        req.log('Categories GET:', err)
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
                link: author.link,
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
router.get('/authors/:link', async (req, res) => {
    if(!req.params.link) return res.sendStatus(500)
    try{
        const user = await User.findOne({link: req.params.link}).exec()
        if(!user) {
            req.flash('error', 'That author does not exist!')
            return res.redirect('/authors')
        }
        const articles = await Article.find().where('author.id').equals(user._id).exec()
        return res.render('pages/author-profile', {title: `${user.fullname || 'This author is lazy'}'s profile`, user, articles, isReviewing: false})
    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('GET Author Profile ID:', req.params.link, err)
        return res.redirect('/')
    }
})

//user - EDIT ROUTE
router.get("/authors/:link/edit", isLoggedIn, async (req, res) => {
    if(!req.params.link) return res.sendStatus(500)

    try {
        const user = await User.findOne({link: req.params.link}).exec()
        const comments = await Comment.find({author: {id: user.id}}).exec()
        return res.render("pages/edit-profile", {title: `Edit ${user.fullname || user.username}'s profile`, user, comments, limits: USER_LIMITS})

    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('Author EDIT:', err)
        return res.redirect('/')
    }
})

//Update ROUTE
router.put("/authors/:link", isLoggedIn, async (req, res) => {
    if(!req.params.link) return res.redirect('/authors')
    //Generic User Data
    const email = req.body?.email ?? null
    let profileImage = req.files?.avatar ?? null
    const bio = req.body?.bio ?? null
    const fullname = req.body?.fullname ?? null
    const motto = req.body?.motto ?? null

    //Socials 
    const {github, linkedin, codepen} = req.body

    let newUserData = {}

    if(email) newUserData.email = email
    if(bio) newUserData.bio = bio
    
    if(motto) newUserData.motto = motto
    if(fullname) {
        newUserData.fullname = fullname
        newUserData.link = encodeURIComponent(fullname.replace(/\s/g, '-'))
    }
    if(github || linkedin || codepen) {
        newUserData.socials = { github, linkedin, codepen }
    }
    
    try {
    if(profileImage) await setProfileImage(newUserData.link || req.params.link, profileImage)
    if(!newUserData) return res.redirect('/authors')
    
    const user = await User.findOneAndUpdate({link: req.params.link}, {$set: newUserData}, {new: true, runValidators: true}).exec()
    req.flash("success", "Profile Updated!")
    return res.redirect("/authors/" + user.link)
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
router.get('/image/:link', (req, res) => {
    const link = req.params.link ?? null
    const {width, height} = req.query
    if(!link) return res.sendStatus(400)
    if(width && height) return getProfileImage(res, link, width, height)
    return getProfileImage(res, link)
})

router.get('/verify', async (req, res) => {
    if(!req.query.token) return res.render('error', {code: 401, msg: 'Invalid Token.'})
    try {
        const userToken = await Verify.findOne({token: req.query.token}).exec()
        if(!userToken) return res.render('error', {code: 401, msg: 'Invalid Token.'})
        const user = await User.findById(userToken.userId).exec()
        if(!user) return res.render('error', {code: 401, msg: 'User not found.'})
        user.verified = true
        await user.save()
        await userToken.remove()

        req.flash('success', 'Successfully verified!')
        return res.redirect('/login')
    } catch(err) {
        req.log('Verification Error:', err)
        return res.sendStatus(500)
    }
})

router.post('/subscribe', (req, res) => {
    if(!validator.isEmail(req.body.email)) return res.sendStatus(401)
    Newsletter.create({email: req.body.email})
    .then(() => {
        req.flash('success', 'Successfully subscribed!')
        return res.redirect('back')
    })
    .catch(err => {
        req.log('Subscribe Route:', err)
        if(err.code === DUPLICATE_MONGO_ERROR_CODE) {
            req.flash('error', 'Oops! That email is already subscribed.')
            return res.redirect('back')
        }
        return res.render('error', {code: 500, msg: 'Oops! Something went wrong, please try again later!'})
    })
})

router.get('/unsubscribe', (req, res) => {
    return res.render('pages/unsubscribe')
})
router.post('/unsubscribe', async (req, res) => {
    if(!validator.isEmail(req.body.email)) return res.sendStatus(401)
    try {
        const deleteCount = await Newsletter.deleteOne({email: req.body.email})
        req.log('Unsubscribed:', deleteCount)
        req.flash('success', 'Successfully unsubscribed!')
        return res.redirect('/')
    } catch(err) {
        req.log('Unsubscribe:', err)
        return res.render('error', {code: 500, msg: err})
    }
})

async function sendVerificationMail(email, token) {
    if(!email || !validator.isEmail(email)) throw new Error('Invalid Email')
    const body = `Hello ${email}, please verify your email at mybeautifuldomain.com/verify?token=${token}`
    try {
        const transporter = await mailer.init()
        const mailInfo = await mailer.sendMail(transporter, email, "Please Verify Your Email", body)
        return mailInfo
    } catch(err) {
        logger.info('sendVerificationMail', err)
    }
}

module.exports = router