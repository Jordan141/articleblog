const Article = require('../models/article')
const Comment = require('../models/comment')
const USER_ROLE = 'user'

let middlewareObj = {}

middlewareObj.checkArticleOwnership = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.flash('error', 'Please login to do that!')
        res.redirect('/')
    }

    if(!req?.params?.id) return res.render('error', {code: 404, msg: 'Invalid Article ID'})
    Article.findById(req.params.id, (err, foundArticle) => {
        if(err) {
            req.flash('error', 'Article not found :(')
            return res.redirect('back')
        }
        if(!req?.user?._id) return res.render('error', {code: 404, msg: 'Invalid Article ID'})
        if(foundArticle.author.id.equals(req.user._id) || req.user.isAdmin) return next()
        
        req.flash('error', 'You don\'t have permission to do that!')
        return res.redirect
    })
}

middlewareObj.hasAuthorRole = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.flash('error', 'You need to be logged in to do that!')
        return res.redirect('back')
    }

    if(req.user.role === USER_ROLE) {
        req.flash('error', 'You don\'t have permission to do that!')
        return res.redirect('back')
    }

    return next()
}

middlewareObj.checkCommentOwnership = (req, res, next) => {
    if(!req.isAuthenticated()){
        req.flash('error', 'You need to be logged in to do that!')
        return res.redirect('back')
    }

    Comment.findById(req.params.comment_id, (err, comment) => {
        if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
            return next()   
        }
        
        req.flash('error', 'You don\'t have permission to do that')
        return res.redirect("/articles/" + req.params.id)
    })
}

middlewareObj.isLoggedIn = (req,res,next) => {
    if(req.isAuthenticated()){
        return next()
    }
    req.flash('error','You need to be logged in to do that')
    return res.redirect('/login')
}

middlewareObj.checkCaptcha = (req, res, next) => {
    if(!req.session.captcha) return next()
    if(req.body.captcha !== req.session.captcha) {
        req.flash('error', 'The Captcha was wrong, please ensure case sensitivity.')
        return res.redirect('back')
    }

    req.session.captcha = null //Remove old captcha data
    next()
}

module.exports = middlewareObj