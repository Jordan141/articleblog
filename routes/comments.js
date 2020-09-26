const express = require('express')
const router = express.Router({mergeParams: true})
const Campground = require('../models/campground')
const Comment = require('../models/comment')
const {isLoggedIn, checkCommentOwnership} = require('../middleware')


router.get('/new', isLoggedIn, (req, res) => {
    if(req.params.id === undefined) return res.sendStatus(500)

    Campground.findById(req.params.id, (err, campground) => {
        if(err){
            console.log(err)
            return err
        }
        res.render('comments/new', {campground})
    })
})
//CREATE COMMENT
router.post('/', isLoggedIn, (req,res) => {
    if(req.params.id === undefined || req.body.comment === undefined) return res.sendStatus(500)

    Campground.findById(req.params.id, (err, campground) => {
        if(err) return res.redirect('/campgrounds')

        Comment.create(req.body.comment, (err, comment) => {
            if(err){
                req.flash('error', 'Oops! Something went wrong, please contact your web admin')
                return res.sendStatus(500)
            }
            comment.author.id = req.user._id
            comment.author.username = req.user.username
            comment.save()
            campground.comments.push(comment)
            campground.save()
            req.flash('success', 'Created a comment!');
            res.redirect(`/campgrounds/${campground._id}`)
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
        res.render('comments/edit', {campground_id: req.params.id, comment})
    })
})
//COMMENT UPDATE ROUTE
router.put('/:comment_id', checkCommentOwnership, (req, res) => {
    if(req.params.comment_id === undefined || req.body.comment === undefined || req.params.id === undefined) return res.send(500)

    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, err => {
        if(err){
            res.redirect('back')
        }
        res.redirect(`/campgrounds/${req.params.id}`)
    })
})

//COMMENT DELETE ROUTE
router.delete('/:comment_id', checkCommentOwnership, (req,res) => {
    if(req.params.comment_id === undefined || req.params.id === undefined) return res.send(500)
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if(err){
            res.redirect('back')
        }
        req.flash('error', 'Comment deleted')
        res.redirect(`/campgrounds/${req.params.id}`)
    })
})

module.exports = router