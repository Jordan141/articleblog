const Campground = require('../models/campground')
const Comment = require('../models/comment')
//all the middleware goes here
let middlewareObj = {}

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err, foundCampground) => {
            if(err) {
                req.flash('error', 'Campground not found')
                return res.redirect('back')
            }
            if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin)
                return next()

            req.flash('error', 'You don\'t have permission to do that')
            return res.redirect('back')
        })   
    }
    req.flash("error", "You need to be signed in to do that!")
    return res.redirect("/login")
}

middlewareObj.checkCommentOwnership = (req, res, next) => {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, comment) => {
            if(comment.author.id.equals(req.user._id)|| req.user.isAdmin)
                return next()

            req.flash('error', 'You don\'t have permission to do that')
            return res.redirect("/campgrounds/" + req.params.id)
        })   
    }
    
    req.flash('error', 'You need to be logged in to do that!')
    res.redirect('back')
}

middlewareObj.isLoggedIn = (req,res,next) => {
    if(req.isAuthenticated()){
        return next()
    }
    req.flash('error','You need to be logged in to do that')
    return res.redirect('/login')
}

module.exports = middlewareObj