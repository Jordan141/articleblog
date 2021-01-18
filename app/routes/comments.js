const express = require('express')
const router = express.Router({mergeParams: true})
const Article = require('../models/article')
const Comment = require('../models/comment')
const {isLoggedIn, checkCommentOwnership} = require('../middleware')
const validation = require('../validation')

router.get('/new', isLoggedIn, (req, res) => {
    if(req.params.title === undefined) return res.sendStatus(500)
    Article.findOne({title: req.params.title}, (err, article) => {
        if(err){
            req.log('Comment New:', err)
            return err
        }
        res.render('comments/new', {article})
    })
})
//CREATE COMMENT
router.post('/', isLoggedIn, (req,res) => {
    if(req.params.title === undefined || req.body.comment === undefined) return res.sendStatus(500)

    Article.findOne(req.params.title, (err, article) => {
        if(err) return res.redirect('/articles')

        Comment.create(req.body.comment, (err, comment) => {
            if(err){
                req.flash('error', 'Oops! Something went wrong, please contact your web admin')
                return res.sendStatus(500)
            }
            comment.author.id = req.user._id
            comment.author.username = req.user.username
            comment.save()
            article.comments.push(comment)
            article.save()
            req.flash('success', 'Created a comment!');
            res.redirect(`/articles/${article._id}`)
        })
    })
})
//COMMENTS - EDIT ROUTE
router.get('/:comment_id/edit', checkCommentOwnership, (req,res) => {
    if(req.params.comment_id === undefined) return res.sendStatus(500)

    Comment.findById(req.params.comment_id, (err, comment) => {
        if(err){
            res.redirect('back')
        }
        res.render('comments/edit', {article_id: req.params.id, comment})
    })
})
//COMMENT UPDATE ROUTE
router.put('/:comment_id', checkCommentOwnership, (req, res) => {
    if(req.params.comment_id === undefined || req.body.comment === undefined || req.params.id === undefined) return res.sendStatus(500)

    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, err => {
        if(err){
            res.redirect('back')
        }
        res.redirect(`/articles/${req.params.id}`)
    })
})

//COMMENT DELETE ROUTE
router.delete('/:comment_id', checkCommentOwnership, (req,res) => {
    if(req.params.comment_id === undefined || req.params.id === undefined) return res.sendStatus(500)
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if(err){
            req.log('COMMENT DELETE:', err)
            return res.redirect('back')
        }
        req.flash('error', 'Comment deleted')
        return res.redirect(`/articles/${req.params.id}`)
    })
})

module.exports = router