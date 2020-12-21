const express = require('express')
let router = express.Router()
const Article = require('../models/article')
const User = require('../models/user')
const {isLoggedIn, checkArticleOwnership, hasAuthorRole} = require('../middleware')
const TITLE = 'title', 
CATEGORY = 'category', 
AUTHOR = 'author', 
ALL = 'all'
const rateLimiter = require('express-rate-limit')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const JPEG = 'jpeg', JPEG_OPTIONS = {force: true, chromaSubsampling: '4:4:4'}

const listingsLimit = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 500,
    message: 'Too many attempts from this IP, please try again in an hour.'
})

//CREATE ROUTE
router.post('/', isLoggedIn, hasAuthorRole, (req, res) => {
    if(!__verifyParams(req.body)) {
        req.flash('Oops! Something went wrong!')
        console.log('bad params, Article - CREATE ROUTE')
        return res.redirect('/')
    }

    const {title, description, body} = req.body
    const author = {id: req.user._id, username: req.user.username}
    const header = req?.files?.header ?? null
    if(!header) return res.render('error', {code: 400, msg: 'Invalid Header Image'})
   
    
    Article.create({author, title, description, body}, (err, article) => {
        if(err) throw err
        const filePath = path.join(__dirname + '../../content', 'articles', 'images', String(article._doc._id) + '.jpeg')
        sharp(header.data).toFormat(JPEG).jpeg(JPEG_OPTIONS).toFile(filePath).then(() => {
            req.flash('success', 'Article created!')
            res.redirect('/')
        })
    })
})

//GET ARTICLE HEADER IMAGE
router.get('/image/:id', (req, res) => {
    if(!req.params.id) res.sendStatus(404)
    const id = req.params.id.includes('.jpeg') ? req.params.id : req.params.id + '.jpeg'
    const filepath = path.join(__dirname + '../../content', 'articles', 'images', id)
    res.type('image/jpeg')
    sharp(filepath).toFormat(JPEG).jpeg(JPEG_OPTIONS).pipe(res)
})
//NEW - Show form to create new article
router.get('/new', isLoggedIn, hasAuthorRole, (req, res) => {
    res.render('pages/article-edit.ejs', {title: 'Edit Article', categories: [], article: {}, method: 'POST', type: 'new'})
})

//CATEGORIES - Show page for article categories
router.get('/categories', (req, res) => {
    return res.render('pages/categories', {title: 'Categories'})
})

router
//APPROVE List Article Route
router.get('/approve', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin) {
        req.flash('Oops! Something went wrong!')
        return res.redirect('/')
    }

    return articleListingPromise(ALL, {}, req.user.isAdmin).
        then(articles => res.render('pages/approve', {title: 'Approve Articles', articles, currentUser: req.user, isReviewing: true})).
        catch(err => res.render('error', {code: 500, msg: err}))
})

//APPROVE Show Article Route
router.get('/approve/:id', isLoggedIn, async (req, res) => {         
    if(!req.user.isAdmin || !req.params.id === undefined) {
        return res.render('error', {code: 'Oops!', msg: 'That article doesn\'t exist!'})
    }

    try {
        const article = await Article.findById(req.params.id).exec()
        if(!article) return res.render('error', {code: 404, msg: 'That article does not exist!'})
        const author = await User.findById(article.author.id).exec()
        return res.render('pages/article', {title: `Approve ${article.title}`, article, author, currentUser: req.user, isReviewing: true}) 

    } catch(err) {
        console.log('Article SHOW Route:', err)
        return res.render('error', {code: 404, msg: 'This page does not exist!'})
    }
})

//APPROVE Approve Article Route
router.post('/approve/:id', isLoggedIn, (req, res) => {
    if(!req.user.isAdmin || !req.params.id) {
        req.flash('error', 'Oops! Something went wrong!')
        return res.redirect('/')
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
    const {key, identifier} = req.body
    return articleListingPromise(key, identifier).
        then(articles => res.send(articles)).
        catch(err => console.log('articleListingPromise:', err))
})

router.get('/images/:id', async (req, res) => {
    if(!req?.params?.id || !req?.user?.username) res.sendStatus(404)
    const dirPath = path.join(__dirname + '../../content', 'articles', 'images')
    if(!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, {recursive: true})

    try {
        const file = await fs.promises.readFile(path.join(dirPath, req.params.id))
        if(!file) return res.sendStatus(404)
        return res.send(file)
    } catch(err) {
        console.log('Article Images Route', err)
        return res.sendStatus(500)
    }
   
    
})
//SHOW - Show more info about one article
router.get('/:id', async (req, res) => {
    if(!req.params.id === undefined) {
        return res.render('error', {code: 'Oops!', msg: 'That article doesn\'t exist!'})
    }

    try {
        const article = await Article.findById(req.params.id).populate('comments').exec()
        if(!article) return res.render('error', {code: 404, msg: 'That article does not exist!'})
        const author = await User.findById(article.author.id).exec()
        res.render('pages/article', {title: article.title, article, author, req, isReviewing: false})

    } catch(err) {
        req.flash('error', 'Oops! Something went wrong!')
        console.log('Article SHOW Route:', err)
        return res.render('error', {code: 404, msg: 'This page does not exist!'})
    }
})

//EDIT Route
router.get('/:id/edit', checkArticleOwnership, (req, res) => {
    Article.findById(req.params.id, (err, article) => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            console.log('Article EDIT Route:', err)
            return res.redirect('/')
        }
        res.render('pages/article-edit', {title: 'Edit Article', categories: [], article, method: 'PUT', type: 'edit'})
    })
})

//UPDATE Route
router.put('/:id', checkArticleOwnership, (req, res) => {
    if(req.body.title === undefined) {
        req.flash('error', 'Oops! Something went wrong!')
        console.log('Article UPDATE Route:', req.body)
        return res.redirect('/')
    }
    Article.findByIdAndUpdate(req.params.id, {$set: req.body}, err => {
        if(err) {
            req.flash('error', 'Oops! Something went wrong!')
            console.log('Article UPDATE Route:', err)
            return res.redirect('/')
        }

        req.flash('success', 'Successfully updated your article!')
        res.redirect('/articles/' + req.params.id)
    })
})

//DELETE Article Route
router.delete('/:id', checkArticleOwnership, (req, res) => {
    if(!req?.params?.id) return res.render('error', {code: '404', msg: 'Invalid Article ID'})
    Article.deleteOne({_id: req.params.id}, err => {
        if(err) return res.render('error', {code: '500', msg: 'Internal Database Error'})

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