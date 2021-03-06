const Article = require('../models/article')
const Comment = require('../models/comment')
const logger = require('../logger')
const USER_ROLE = 'user'

let middlewareObj = {}

middlewareObj.checkArticleOwnership = async (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.flash('error', 'Please login to do that!')
        return res.redirect('/login')
    }

    if(!req.params.link) return res.render('error', {code: 404, msg: 'Invalid Article Link'})
    try {
        const foundArticle = await Article.findOne({link: req.params.link}).populate('author').exec()
        if(!foundArticle) return res.render('error', {code: 404, msg:'Middleware'})
        if(!req?.user?._id) return res.render('error', {code: 404, msg: 'Invalid User'})
        if(foundArticle.author._id.equals(req.user._id) || req.user.isAdmin) return next()
    } catch(err) {
        logger.info(`checkArticleOwnership Error: ${err}`)
        req.flash('error', 'You don\'t have permission to do that!')
        return res.redirect('back')
    }
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