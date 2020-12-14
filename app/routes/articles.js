const express = require('express')
let router = express.Router()
const Article = require('../models/article')
const {isLoggedIn, checkArticleOwnership, hasAuthorRole} = require('../middleware')
const TITLE = 'title', CATEGORY = 'category', AUTHOR = 'author', ALL = 'all'
const rateLimiter = require('express-rate-limit')

const listingsLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 500,
    message: 'Too many attempts from this IP, please try again in an hour.'
})

//INDEX ROUTE -- Show all articles
router.get('/', (req, res) => {
    promiseArticleListings(ALL, {})
    .then(articles => {
        return res.render('articles/index', {articles, currentUser: req.user, page: 'articles'})
    })
    .catch(err => {
        console.log('Articles Index Route', err)
        req.flash('error', 'Oops! Something went wrong!')
        return res.render('/')
    })
})

//CREATE ROUTE
router.post('/', isLoggedIn, hasAuthorRole, (req, res) => {
    if(!__verifyParams(req.body)) {
        req.flash('Oops! Something went wrong!')
        console.log('bad params, Article - CREATE ROUTE')
        return res.redirect('/articles')
    }

    const {title, description, body} = req.body
    const author = {id: req.user._id, username: req.user.username}

    Article.create({author, title, description, body}, err => {
        if(err) throw err

        req.flash('success', 'Article created!')
        res.redirect('/articles')
    })
})

//NEW - Show form to create new article
router.get('/new', isLoggedIn, hasAuthorRole, (req, res) => {
    res.render('articles/new.ejs')
})

//APPROVE List Article Route
router.get('/approve', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin) {
        req.flash('Oops! Something went wrong!')
        return res.redirect('/articles')
    }

    return promiseArticleListings(ALL, {}, req.user.isAdmin)
        .then(articles => res.render('articles/approve', {articles, currentUser: req.user}))
        .catch(err => res.sendStatus(500))
})

//APPROVE Show Article Route
router.get('/approve/:id', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin || !req.params.id) {
        req.flash('error', 'Oops! Something went wrong!')
        return res.redirect('/articles')
    }

    Article.findById(req.params.id, (err, article) => {
        if(err) return res.sendStatus(500)
        return res.render('articles/show', {article, currentUser: req.user, isReviewing: true})        
    })
})

//APPROVE Approve Article Route
router.post('/approve/:id', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin || !req.params.id) {
        req.flash('error', 'Oops! Something went wrong!')
        return res.redirect('/articles')
    }

    Article.findOne({_id: req.params.id}, (err, article) => {
        if(err) return res.sendStatus(500)
        article.isApproved = true
        article.save()
        
        req.flash('success', 'Article approved!')
        return res.redirect('/articles/approve')
    })
})

//LIST Articles
router.post('/listings', listingsLimit, (req, res) => {
    const key = req.body.key, identifier = req.body.identifier
    
    return promiseArticleListings(key, identifier)
        .then(articles => res.send(JSON.parse(articles)))
        .catch(err => console.log('promiseArticleListings:', err))
})

//SHOW - Show more info about one article
router.get('/:id', (req, res) => {
    if(req.params.id === undefined) {
        req.flash('error', 'Oops! Something went wrong!')
        return res.redirect('/articles')
    }

    Article.findById(req.params.id).populate('comments').exec((err, article) => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            console.log('Article SHOW Route:', err)
            return res.redirect('/articles')
        }

        res.render('articles/show', {article, req, isReviewing: false})
    })
})

//EDIT Route
router.get('/:id/edit', checkArticleOwnership, (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            console.log('Article EDIT Route:', err)
            return res.redirect('/articles')
        }
        res.render('articles/edit', {article})
    })
})

//UPDATE Route
router.put('/:id', checkArticleOwnership, (req, res) => {
    if(req.body.title === undefined) {
        req.flash('error', 'Oops! Something went wrong!')
        console.log('Article UPDATE Route:', req.body)
        return res.redirect('/articles')
    }
    console.log(req.params.id, req.body)
    Article.findByIdAndUpdate(req.params.id, {$set: req.body}, err => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            console.log('Article UPDATE Route:', err)
            return res.redirect('/articles')
        }

        req.flash('success', 'Successfully updated your article!')
        res.redirect('/articles/' + req.params.id)
    })
})

//DELETE Article Route
router.delete('/:id', checkArticleOwnership, (req, res) => {
    Article.findByIdAndRemove(req.params.id, err => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            console.log('Article DELETE Route:', err)
            return res.redirect('/articles')
        }

        req.flash('success', 'Successfully deleted your article!')
        res.redirect('/articles')
    })
})

function __verifyParams(body) {
    switch(body) {
        case body.author === undefined:
        case body.title === undefined:
        case body.description === undefined:
        case body.body === undefined:
            return false
        default:
            return true
    }
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

function promiseArticleListings(key, identifier, isReviewing = false) {
    const category = __validCategory(key)

    if(!category) return res.send({})
    if(category !== ALL && !identifier) return res.send({})

    const query = isReviewing ? {isApproved: false} : {isApproved: true}

    if(category !== ALL) query[category] = identifier ?? {}
    return Article.find(query).exec()
}

module.exports = router