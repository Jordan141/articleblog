const express = require('express')
const router = express.Router()
const passport = require('passport')
const User = require('../models/user')
const Comment = require('../models/comment')
const Article = require('../models/article')
const Verify = require('../models/verify')
const Newsletter = require('../models/newsletter')
const Links = require('../models/links')
const {isLoggedIn, checkCaptcha} = require('../middleware')
const validator = require('validator')
const svgCaptcha = require('svg-captcha')
const csrf = require('csurf')
const rateLimiter = require('express-rate-limit')
const {getProfileImage, setProfileImage} = require('../utils')
const CATEGORIES_LIST = require('../staticdata/categories.json')
const {USER: USER_LIMITS} = require('../staticdata/minmax.json')
const {findTopStories, findCommonCategories, buildArticleSearchQuery, convertToBoolean} = require('../utils')
const csrfProtection = csrf({ cookie: true })
const logger = require('../logger')
const crypto = require("crypto")
const mailer = require('../mailer')
const DUPLICATE_MONGO_ERROR_CODE = 11000
const validation = require('../validation')
const slugify = require('slugify')
const {editAuthor, index, login, register, subscribe, unsubscribe, verifyEmail} = require('../validation/schemas/index/index')
const SLUGIFY_OPTIONS = require('../staticdata/slugify_options.json')
const QUERY = 'query', BODY = 'body'
const authLimit = rateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 10, //Start blocking after 10 requests
    message: 'Too many attempts from this IP, please try again in an hour.'
})

router.get('/', validation(index, QUERY), async (req, res) => {
    if(req.query.category) res.locals.currentCategory = CATEGORIES_LIST.filter(category => category.key === req.query.category)[0]
    if(req.query.query) res.locals.searchTerm = req.query.query
    const listingPageNumber = parseInt(req.query?.page) || 1
    const articleQuery = buildArticleSearchQuery(req.query, listingPageNumber)

    try {
        const articles = await articleQuery.populate('author').exec()
        const topStories = await findTopStories()
        const commonCategories = await findCommonCategories()
        return res.render('index', {title: 'Pinch of Code', articles, topStories, currentUser: req.user, page: 'articles', isReviewing: false, commonCategories, listingPageNumber})
    } catch(err) {
        req.log('Index Route', err)
        req.flash('error', 'Oops! Something went wrong!')
        return res.render('/')
    }
})

router.get('/register', csrfProtection, (req, res) => {
    res.render('pages/register', {title: 'Register', page: 'register', csrfToken: req.csrfToken(), limits: USER_LIMITS})
})

router.post('/register', authLimit, csrfProtection, checkCaptcha, validation(register, BODY), async (req, res) => {

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
        if(convertToBoolean(process.env.DEV_MODE)) req.log(mailInfo)

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

router.get('/login', csrfProtection, (req, res) => {
    res.render('pages/login', {title: 'Login', page: 'login', csrfToken: req.csrfToken(), limits: USER_LIMITS})
})

router.post('/login', authLimit, csrfProtection, checkCaptcha, validation(login, BODY),passport.authenticate('local',
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
    if(!req.params.link) return res.render('error', {code: 404, msg: 'That author does not exist!'})
    try{
        const user = await User.findOne({link: req.params.link}).exec()
        if(!user) {
            const user = await Links.findOne({links: req.param.link}).populate('author').exec()
            if(user && user.link) return res.redirect(`/authors/${user.link}`)

            req.flash('error', 'That author does not exist!')
            return res.redirect('/authors')
        }
        const articles = await Article.find().where('author').equals(user._id).populate('author').exec()
        return res.render('pages/author-profile', {title: `${user.fullname || 'This author is lazy'}'s profile`, user, articles, isReviewing: false})
    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('GET Author Profile ID:', req.params.link, err)
        return res.redirect('/')
    }
})

//user - EDIT ROUTE
router.get("/authors/:link/edit", isLoggedIn, csrfProtection, async (req, res) => {
    if(!req.params.link) return res.render('error', {code: 404, msg: 'That author does not exist!'})

    try {
        const user = await User.findOne({link: req.params.link}).exec()
        if(!user) {
            const user = await Links.findOne({links: req.param.link}).populate('author').exec()
            if(user && user.link) return res.redirect(`/authors/${user.link}/edit`)

            req.flash('error', 'That author does not exist!')
            return res.redirect('/authors')
        }

        const comments = await Comment.find({author: {id: user.id}}).exec()
        return res.render("pages/edit-profile", {title: `Edit ${user.fullname || user.username}'s profile`, user, comments, csrfToken: req.csrfToken(), limits: USER_LIMITS})

    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('Author EDIT:', err)
        return res.redirect('/')
    }
})

//Update ROUTE
router.put("/authors/:link", isLoggedIn, csrfProtection, validation(editAuthor, BODY), async (req, res) => {
    if(!req.params.link) return res.redirect('/authors')

    let profileImage = req.files?.avatar
    const {bio, fullname, motto} = req.body
    const {github, linkedin, codepen} = req.body.socials
    
    try {
        const user = await User.find({link: req.params.link}).exec()
        
        if(bio) user.bio = bio
        if(motto) user.motto = motto
        if(fullname) {
            user.fullname = fullname
            user.link = createSluggedUserLink(fullname, user)
            if(!user.oldLinks.includes(user.link)) user.oldLinks.push(user.link)
        }

        if(github) user.socials.github = github
        if(linkedin) user.socials.linkedin = linkedin
        if(codepen) user.socials.codepen = codepen
        console.log(req.params.link, user.link, user.oldLinks)
        if(profileImage) await setProfileImage(req.params.link, profileImage)
        await user.save()

        req.flash("success", "Profile Updated!")
        return res.redirect("/authors/" + user.link) 
    } catch(err) {
        req.flash("error", "Oops! Something went wrong!")
        req.log('User Update:', err)
        return res.redirect('/')
    }
})

function createSluggedUserLink(fullname, user) {
    const sluggedLink = slugify(fullname, SLUGIFY_OPTIONS)
    if(!user.oldLinks.includes(sluggedLink) || user.link === sluggedLink) return sluggedLink

    const newSluggedLink = `${sluggedLink}-${user.oldLinks.length + 1}`
    return newSluggedLink
}

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
    return getProfileImage(res, link, width, height)
})

router.get('/verify', validation(verifyEmail, QUERY), async (req, res) => {
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

router.post('/subscribe', validation(subscribe, BODY), async (req, res) => {
     try {
        await Newsletter.create({email: req.body.email})
        req.flash('success', 'Successfully subscribed!')
        return res.redirect('back')
    } catch(err) {
        req.log('Subscribe Route:', err)
        if(err.code === DUPLICATE_MONGO_ERROR_CODE) {
            req.flash('error', 'Oops! That email is already subscribed.')
            return res.redirect('back')
        }
        return res.render('error', {code: 500, msg: 'Oops! Something went wrong, please try again later!'})
    }
})

router.get('/unsubscribe', (req, res) => {
    return res.render('pages/unsubscribe')
})

router.post('/unsubscribe', validation(unsubscribe, BODY), async (req, res) => {
    try {
        const deleteCount = await Newsletter.deleteOne({email: req.body.email})
        if(deleteCount.deletedCount === 0) {
            req.flash('error', 'You are not subscribed to us.')
            return res.redirect('/')
        }

        req.flash('success', 'Successfully unsubscribed!')
        return res.redirect('/')
    } catch(err) {
        req.log('Unsubscribe:', err)
        return res.render('error', {code: 500, msg: err})
    }
})

router.get('/privacypolicy', (req, res) => {
    return res.render('pages/privacypolicy')
})

router.get('/gdprpolicy', (req, res) => {
    return res.render('pages/gdprpolicy')
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