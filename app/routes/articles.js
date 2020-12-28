const express = require('express')
let router = express.Router()
const Article = require('../models/article')
const User = require('../models/user')
const Counter = require('../models/routeCounter')
const {isLoggedIn, checkArticleOwnership, hasAuthorRole} = require('../middleware')
const {getArticleImage, setArticleContentImage, setArticleHeaderImage, encodeString} = require('../utils')
const TITLE = 'title', CATEGORY = 'category', AUTHOR = 'author', ALL = 'all'
const {ARTICLES: ARTICLE_LIMITS} = require('../staticdata/minmax.json')
const rateLimiter = require('express-rate-limit')
const CATEGORIES_LIST = require('../staticdata/categories.json')
const SPACES = /\s/g, DASH = '-'

const listingsLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 500,
    message: 'Too many attempts from this IP, please try again in an hour.'
})

//CREATE ROUTE
router.post('/', isLoggedIn, hasAuthorRole, (req, res) => {
    if(!__verifyParams(req.body)) {
        req.flash('Oops! Something went wrong!')
        req.log('bad params, Article - CREATE ROUTE')
        return res.redirect('/')
    }

    const link = encodeURIComponent(req.body.title.replace(SPACES, DASH))
    const title = encodeString(req.body.title)
    const description = encodeString(req.body.description)
    const body = encodeString(req.body.body)

    const author = {id: req.user._id, username: encodeString(req.user.username)}
    const header = req?.files?.header ?? null
    
    const category =  req.body.category
    const isValidCategory = CATEGORIES_LIST.find(cat => cat.key === category)
    if(!isValidCategory) return res.sendStatus(400)
    if(!header) return res.render('error', {code: 400, msg: 'Invalid Header Image'})
   
    
    Article.create({author, title, description, link, body, category}, (err, article) => {
        if(err) {
            if(err?.errors?.properties?.type === 'minlength' || err?.errors?.properties?.type === 'maxlength') {
                return res.render('error', {code: '401', msg: 'Invalid input length.'})
            }
            if(err._message === 'Article validation failed') {
                req.log('Article Create:', err)
                req.flash('error', 'Invalid input lengths, please try again.')
                return res.redirect('/articles/new')
            }

            req.log('Article CREATE:', err)
            req.flash('error', 'Oops! Something went wrong!')
            return res.redirect('/')
        }
        const imageName = article.link + '.jpeg'
        setArticleHeaderImage(header, imageName)
            .then(() => {
                req.flash('success', 'Article created!')
                return res.redirect('/')
            })
    })
})

//NEW - Show form to create new article
router.get('/new', isLoggedIn, hasAuthorRole, (req, res) => {
    res.render('pages/article-edit.ejs', {title: 'Edit Article', categories: CATEGORIES_LIST, article: {}, method: 'POST', type: 'new', limits: ARTICLE_LIMITS})
})

router
//APPROVE List Article Route
router.get('/approve', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin) {
        req.flash('Oops! Something went wrong!')
        return res.redirect('/')
    }

    return articleListingPromise(ALL, {}, req.user.isAdmin).
        then(articles => res.render('pages/approve', {title: 'Approve Articles', articles, currentUser: req.user, categories: CATEGORIES_LIST, isReviewing: true})).
        catch(err => res.render('error', {code: 500, msg: err}))
})

//APPROVE Show Article Route
router.get('/approve/:link', isLoggedIn, async (req, res) => {         
    if(!req.user.isAdmin || !req.params.link) {
        return res.render('error', {code: 'Oops!', msg: 'That article doesn\'t exist!'})
    }
    const encodedLink = req.params.link.replace(SPACES, DASH)
    try {
        const article = await Article.findOne({link: encodedLink}).exec()
        if(!article) return res.render('error', {code: 404, msg: 'That article does not exist!'})
        const author = await User.findById(article.author.id).exec()
        return res.render('pages/article', {title: `Approve ${article.title}`, article, author, currentUser: req.user, isReviewing: true}) 

    } catch(err) {
        req.log('Article SHOW Route:', err)
        return res.render('error', {code: 404, msg: 'This page does not exist!'})
    }
})

//APPROVE Approve Article Route
router.post('/approve/:link', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin || !req.params.link) {
        req.flash('error', 'Oops! Something went wrong!')
        return res.redirect('/')
    }

    Article.findOne({link: req.params.link}, (err, article) => {
        if(err) return res.sendStatus(500)
        article.isApproved = true
        article.save()
        
        req.flash('success', 'Article approved!')
        return res.redirect('/articles/approve')
    })
})

//LIST Articles
router.post('/listings', listingsLimit, (req, res) => {
    const key = encodeString(req.body.key)
    const identifier = encodeString(req.body.identifier)

    return articleListingPromise(key, identifier).
        then(articles => res.send(articles)).
        catch(err => req.log('articleListingPromise:', err))
})

//GET Article Images
router.get('/image/:link', async (req, res) => {
    if(!req.params.link) return res.sendStatus(404)
    const {width, height} = req.query
    if(width && height) return getArticleImage(res, req.params.link, width, height).catch(err => req.log(err))
    return getArticleImage(res, req.params.link).catch(err => req.log(err))
})

//POST Upload Article Content Images
router.post('/images', isLoggedIn, async (req, res) => {
    try {
        if(req?.user?.role !== 'author') return res.render('error', {code: 400, msg: 'You are not authorized to do this'})
        const image = req.files?.image
        if(!image) return res.render('error', {code: 500, msg:'Invalid Image'})
        const fileName = await setArticleContentImage(image)
        if(fileName) return res.send({url: `/articles/image/${fileName}`})
        return res.send({url: 'Error Uploading Image...'})
    } catch(err) {
        if(err) req.log(err)
        return res.sendStatus(500)
    }
})

//SHOW - Show more info about one article
router.get('/:link', async (req, res) => {
    if(req.params.link === undefined) {
        return res.render('error', {code: 'Oops!', msg: 'That article doesn\'t exist!'})
    }
    try {
        const article = await Article.findOne({link: req.params.link}).populate('comments').exec()
        if(!article) return res.render('error', {code: 404, msg: 'That article does not exist!'})
        const author = await User.findById(article.author.id).exec()
        res.render('pages/article', {title: article.title, article, author, req, isReviewing: false})

    } catch(err) {
        req.flash('error', 'Oops! Something went wrong!')
        req.log('Article SHOW Route:', err)
        return res.render('error', {code: 404, msg: 'This page does not exist!'})
    }
})

//EDIT Route
router.get('/:link/edit', checkArticleOwnership, (req, res) => {
    if(!req.params.link) return res.redirect('/articles')
    Article.findOne({link: req.params.link}, (err, article) => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            req.log('Article EDIT Route:', err)
            return res.redirect('/')
        }
        if(!article) {
            req.flash('error', 'That article does not exist')
            return res.redirect('/')
        }
        res.render('pages/article-edit', {title: 'Edit Article', categories: CATEGORIES_LIST, article, method: 'PUT', type: 'edit', limits: ARTICLE_LIMITS})
    })
})

//UPDATE Route
router.put('/:link', checkArticleOwnership, (req, res) => {
    if(req.params.link === undefined) {
        req.flash('error', 'Oops! Something went wrong!')
        req.log('Article UPDATE Route:', req.body)
        return res.redirect('/')
    }

    Article.findOneAndUpdate({link: req.params.link}, {$set: req.body}, {runValidators: true}, (err, article) => {
        if(err) {
            if(err?.errors?.properties?.type === 'minlength' || err?.errors?.properties?.type === 'maxlength') {
                return res.render('error', {code: '401', msg: 'Invalid input length.'})
            }

            if(err._message === 'Article validation failed') {
                req.flash('error', 'Invalid input lengths, please try again.')
                return res.redirect(`back`)
            }
            
            req.flash('error', 'Oops! Something went wrong!')
            req.log('Article UPDATE Route:', err)
            return res.redirect('/')
        }
        if(article.title !== req.body.title) article.link = encodeURIComponent(req.body.title.replace(SPACES, DASH))
        req.flash('success', 'Successfully updated your article!')
        res.redirect('/articles/' + req.params.link)
    })
})

//DELETE Article Route
router.delete('/:link', checkArticleOwnership, (req, res) => {
    if(!req.params.link) return res.render('error', {code: '404', msg: 'Invalid Article Link'})
   
    Article.deleteOne({link: req.params.link}, err => {
        if(err) return res.render('error', {code: '500', msg: 'Internal Database Error'})

        Counter.deleteOne({articleLink: req.params.link}).exec()
        req.flash('success', 'Deleted your article!')
        res.redirect('/')
    })
})

function __verifyParams(body) {
    if(!body.title) return false
    if(!body.description) return false
    if(!body.body) return false
    return true
}

function __validCategory(key) {
    switch(key) {
        case TITLE:
            return TITLE
        case CATEGORY:
            return CATEGORY
        case AUTHOR:
            return AUTHOR
        case ALL:
            return ALL
        default:
            return false
    }
}

function articleListingPromise(key, identifier, isReviewing = false) {
    const category = __validCategory(key)

    if(!category) throw new Error(`Invalid Category: ${category}`)
    if(category !== ALL && !identifier) throw new Error(`Invalid Query of ${identifier} for Category: ${category}`)
    const query = isReviewing ? {isApproved: false} : {isApproved: true}

    if(category !== ALL) query[category] = identifier ?? {}
    return Article.find(query).exec()
}

module.exports = router