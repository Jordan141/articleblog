const Article = require('../models/article')
const Comment = require('../models/comment')
//all the middleware goes here
let middlewareObj = {}

middlewareObj.checkArticleOwnership = (req, res, next) => {
    if(req.isAuthenticated()) {
        Article.findById(req.params.id, (err, foundArticle) => {
            if(err) {
                req.flash('error', 'Article not found :(')
                return res.redirect('back')
            }

            if(foundArticle.author.id.equals(req.user._id) || req.user.isAdmin)
                return next()
            
            req.flash('error', 'You don\'t have permission to do that!')
            return res.redirect
        })
    }
}

middlewareObj.checkCommentOwnership = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash('error', 'You need to be logged in to do that!')
        return res.redirect('back')
    }

    Comment.findById(req.params.comment_id, (err, comment) => {
        if(!comment.author.id.equals(req.user._id) || !req.user.isAdmin){
            req.flash('error', 'You don\'t have permission to do that')
            return res.redirect("/articles/" + req.params.id)
        }
        return next()
    })
}

middlewareObj.isLoggedIn = (req,res,next) => {
    if(req.isAuthenticated()){
        return next()
    }
    req.flash('error','You need to be logged in to do that')
    return res.redirect('/login')
}

module.exports = middlewareObj