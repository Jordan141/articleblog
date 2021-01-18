const logger = require('../logger')

module.exports = (routeSchema, property) => {
    return (req, res, next) => {
        const validationResult = routeSchema.validate(req[property])
        if(!validationResult) return res.render('error', {code :500, msg: 'Oops! Something went wrong!'})
        const {error} = validationResult
        if(!error) return next()
        logger.info(`Validation Middleware Error: ${error} via RouteSchema: ${routeSchema}`)
        req.flash('error', 'Invalid inputs')
        return res.redirect('back')
    }   
}