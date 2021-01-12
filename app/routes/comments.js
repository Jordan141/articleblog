const express = require('express')
const router = express.Router({mergeParams: true})
const Article = require('../models/article')
const Comment = require('../models/comment')
const {isLoggedIn, checkCommentOwnership} = require('../middleware')

router.get('/new', isLoggedIn, async (req, res) => {
    if(req.params.title === undefined) return res.sendStatus(500)

    try {
        const article = await Article.findOne({title: req.params.title}).populate('author').exec()
        return res.render('comments/new', {article})
    } catch(err) {
        req.log('Comment New:', err)
        req.flash('error', 'Oops! Something went wrong!')
        res.redirect('/')
    }
})

//CREATE COMMENT
router.post('/', isLoggedIn, async (req,res) => {
    if(req.params.title === undefined || req.body.comment === undefined) return res.sendStatus(500)

    try {
        const article = await Article.findOne({title: req.params.title}).exec()
        const comment = await Comment.create(req.body.comment)
        comment.author.id = req.user._id
        comment.author.username = req.user.username
        await comment.save()

        article.comments.push(comment)
        await article.save()

        req.flash('success', 'Created a comment!');
        return res.redirect(`/articles/${article._id}`)
    } catch(err) {
        req.flash('error', 'Oops! Something went wrong, please contact your web admin')
        return res.redirect('/')
    }
})
//COMMENTS - EDIT ROUTE
router.get('/:comment_id/edit', checkCommentOwnership, async (req,res) => {
    if(req.params.comment_id === undefined) return res.sendStatus(500)

    try {
        const comment = await Comment.findById(req.params.comment_id).exec()
        return res.render('comments/edit', {article_id: req.params.id, comment})
    } catch(err) {
        req.log(`Comments EDIT Error: ${err}`)
        return res.redirect('back')
    }
})
//COMMENT UPDATE ROUTE
router.put('/:comment_id', checkCommentOwnership, async (req, res) => {
    if(req.params.comment_id === undefined || req.body.comment === undefined || req.params.id === undefined) return res.sendStatus(500)

    try {
        await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment).exec()
        return res.redirect(`/articles/${req.params.id}`)
    } catch(err) {
        return res.redirect('back')
    }
})

//COMMENT DELETE ROUTE
router.delete('/:comment_id', checkCommentOwnership, async (req,res) => {
    if(req.params.comment_id === undefined || req.params.id === undefined) return res.sendStatus(500)

    try {
        await Comment.deleteOne({_id: req.params.comment_id}).exec()
        req.flash('error', 'Comment deleted')
        return res.redirect(`/articles/${req.params.id}`)
    } catch(err) {
        req.log('COMMENT DELETE:', err)
        return res.redirect('back')
    }
})

module.exports = router