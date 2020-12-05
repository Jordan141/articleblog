const express = require('express')
let router = express.Router()
const Article = require('../models/article')
const {isLoggedIn, checkArticleOwnership, isUserAuthor} = require('../middleware')

//INDEX ROUTE -- Show all articles
router.get('/', (req, res) => {
    Article.find({}, (err, articles) => {
        res.render('articles/index', {articles, currentUser: req.user, page: 'articles'})
    })
})

//CREATE ROUTE
router.post('/', isLoggedIn, isUserAuthor, (req, res) => {
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
router.get('/new', isLoggedIn, isUserAuthor, (req, res) => {
    res.render('articles/new.ejs')
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

        res.render('articles/show', {article, req})
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

module.exports = router