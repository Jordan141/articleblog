const express = require('express')
let router = express.Router()
const Article = require('../models/article')
const User = require('../models/user')
const Counter = require('../models/routeCounter')
const {isLoggedIn, checkArticleOwnership, hasAuthorRole} = require('../middleware')
const TITLE = 'title', CATEGORY = 'category', AUTHOR = 'author', ALL = 'all'
const {ARTICLES: ARTICLE_LIMITS} = require('../staticdata/minmax.json')
const rateLimiter = require('express-rate-limit')
const CATEGORIES_LIST = require('../staticdata/categories.json')
const validation = require('../validation')
const entities = require('he')

const {
    getArticleImage,
    setArticleContentImage,
    setArticleHeaderImage,
    sendNewsletters
} = require('../utils')

const {
    createArticle,
    updateArticle,
} = require('../validation/schemas/articles')
const logger = require('../logger')

const SPACES = /\s/g, DASH = '-', RECOMMENDED_ARTICLES_LIMIT = 3, BODY = 'body'

const listingsLimit = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many attempts from this IP, please try again in an hour.'
})

//CREATE ROUTE
router.post('/', isLoggedIn, hasAuthorRole, validation(createArticle, BODY), async (req, res) => {

    const link = entities.decode(req.body.title.replace(SPACES, DASH))
    const title = req.body.title
    const description = req.body.description
    const body = req.body.body

    const author = req.user._id
    const header = req?.files?.header ?? null
    
    const categories =  Array.isArray(req.body.categories) ? req.body.categories : [req.body.categories]
    const isValidCategories = categories.filter(category => CATEGORIES_LIST.find(cat => cat.key === category))
    if(isValidCategories.length !== categories.length) return res.sendStatus(400)
    if(!header) return res.render('error', {code: 400, msg: 'Invalid Header Image'})
   
    try {
        const article =  await Article.create({author, title, description, link, body, categories})
        const wasSaved = await setArticleHeaderImage(header, article.link)
        if(!wasSaved) return res.render('error', {code: 500, msg: 'Could not save article header image.'})
        req.flash('success', 'Article created!')
        return res.redirect('/')

    } catch(err) {
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
})

//NEW - Show form to create new article
router.get('/new', isLoggedIn, hasAuthorRole, (req, res) => {
    res.render('pages/article-edit.ejs', {title: 'Edit Article', categories: CATEGORIES_LIST, article: {}, method: 'POST', type: 'new', limits: ARTICLE_LIMITS})
})

router
//APPROVE List Article Route
router.get('/approve', isLoggedIn, async (req, res) => {
    if(!req.user.isAdmin) {
        req.flash('Oops! Something went wrong!')
        return res.redirect('/')
    }
  const listingPageNumber = parseInt(req.query?.page) || 1
    try {
        const articles = await articleListingPromise(ALL, {}, req.user.isAdmin)
        return res.render('pages/approve', {title: 'Approve Articles', articles, currentUser: req.user, categories: CATEGORIES_LIST, listingPageNumber, isReviewing: true})
    } catch(err) {
        return res.render('error', {code: 500, msg: err})
    }
})

//APPROVE Show Article Route
router.get('/approve/:link', isLoggedIn, async (req, res) => {         
    if(!req.user.isAdmin || !req.params.link) {
        return res.render('error', {code: 'Oops!', msg: 'That article doesn\'t exist!'})
    }
    const encodedLink = req.params.link.replace(SPACES, DASH)
    try {
        const article = await Article.findOne({link: encodedLink}).populate('author').exec()
        if(!article) return res.render('error', {code: 404, msg: 'That article does not exist!'})
        const author = await User.findById(article.author).exec()
        return res.render('pages/article', {title: `Approve ${article.title}`, article, author, currentUser: req.user, isReviewing: true}) 

    } catch(err) {
        req.log('Article SHOW Route:', err)
        return res.render('error', {code: 404, msg: 'This page does not exist!'})
    }
})

//APPROVE Approve Article Route
router.post('/approve/:link', isLoggedIn, async (req, res) => {
    if(!req.user.isAdmin || !req.params.link) {
        req.flash('error', 'Oops! Something went wrong!')
        return res.redirect('/')
    }

    try {
        const article = await Article.findOne({link: req.params.link}).populate('author').exec()
        article.isApproved = true
        await article.save()
        await sendNewsletters(article)

        req.flash('success', 'Article approved!')
        return res.redirect('/articles/approve')
    } catch(err) {
        req.log('Article APPROVE POST Error:', err)
        if(err) return res.render('error', {code: 500, msg: 'Oops! Something went wrong!'})
        
    }
})

router.get('/image/:link', async (req, res) => {
    if(!req.params.link) return res.sendStatus(404)
    const {width, height} = req.query
    const article = await Article.findOne({link: req.params.link}).exec()
    return getArticleImage(res, article?.headerUrl || req.params.link, width, height)
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

//SHOW - Author drafts
router.get('/drafts', isLoggedIn, async (req, res) => {
    try {
        const articles = await Article.find({isApproved: false, author: req.user._id}).populate('author').exec()
        return res.render('pages/draft-listing', {articles, author: req.user})
    } catch(err) {
        req.log(`Author Drafts Error: ${err}`)
    }
})

//SHOW - Show more info about one article
router.get('/:link', async (req, res) => {
    if(req.params.link === undefined) {
        return res.render('error', {code: 'Oops!', msg: 'That article doesn\'t exist!'})
    }
    try {
        const article = await Article.findOne({link: req.params.link}).populate('comments').populate('author').exec()
        if(!article) return res.render('error', {code: 404, msg: 'That article does not exist!'})
        if(!article.isApproved && (!article.author._id.equals(req.user?._id) || !req.user?.isAdmin)) {
            req.flash('error', 'That article is currently under construction')
            return res.redirect('/')
        }
        const author = await User.findById(article.author).exec()
        const recommendedArticles = []
        for(let category of article.categories) {
            if(recommendedArticles.length >= RECOMMENDED_ARTICLES_LIMIT) break
            recommendedArticles.push(...await getRecommendedArticles(category))
        }

        return res.render('pages/article', {title: article.title, article, author, req, recommendedArticles, isReviewing: false})
    } catch(err) {
        req.flash('error', 'Oops! Something went wrong!')
        req.log('Article SHOW Route:', err)
        return res.render('error', {code: 404, msg: 'This page does not exist!'})
    }
})

async function getRecommendedArticles(category) {
    return await Article.find({isApproved: true, categories: category}).limit(RECOMMENDED_ARTICLES_LIMIT).exec() 
}

//EDIT Route
router.get('/:link/edit', checkArticleOwnership, async (req, res) => {
    if(!req.params.link) return res.redirect('/articles')

    try {
        const article = await Article.findOne({link: req.params.link}).populate('author').exec()
        if(!article) {
            req.flash('error', 'That article does not exist')
            return res.redirect('/')
        }

        return res.render('pages/article-edit', {title: 'Edit Article', categories: CATEGORIES_LIST, article, method: 'PUT', type: 'edit', limits: ARTICLE_LIMITS})
    } catch(err) {
        req.flash('error', 'Oops! Something went wrong!')
        req.log('Article EDIT Route:', err)
        return res.redirect('/')
    }
})

//UPDATE Route
router.put('/:link', checkArticleOwnership, validation(updateArticle, BODY), async (req, res) => {
    if(req.params.link === undefined) {
        req.flash('error', 'Oops! Something went wrong!')
        req.log('Article UPDATE Route:', req.body)
        return res.redirect('/')
    }
    try {
        const article = await Article.findOneAndUpdate({link: req.params.link}, {$set: req.body}, {runValidators: true}).populate('author').exec()
        if(article.title !== req.body.title) article.link = encodeURIComponent(req.body.title.replace(SPACES, DASH))
        req.flash('success', 'Successfully updated your article!')
        return res.redirect('/articles/' + req.params.link)
    } catch(err) {
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
})

//DELETE Article Route
router.delete('/:link', checkArticleOwnership, async (req, res) => {
    if(!req.params.link) return res.render('error', {code: '404', msg: 'Invalid Article Link'})
    
    try {
        await Article.deleteOne({link: req.params.link}).exec()
        await Counter.deleteOne({articleLink: req.params.link}).exec()
        req.flash('success', 'Deleted your article!')
        res.redirect('/')
    } catch(err) {
        return res.render('error', {code: '500', msg: 'Internal Database Error'})
    }
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
    return Article.find(query).populate('author').exec()
}

module.exports = router