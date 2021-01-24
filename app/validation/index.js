const logger = require('../logger')

module.exports = (routeSchema, property) => {
    return (req, res, next) => {
        const validationResult = routeSchema.validate(req[property])
        if(!validationResult) return res.render('error', {code :500, msg: 'Oops! Something went wrong!'})
        const {error} = validationResult
        if(!error) return next()
        return errorHandler(req, res, error)
    }   
}


function errorHandler(req, res, error) {
    console.log(error.details)
    const errorMessage = `Invalid value: ${error.details[0].context.value}, ${error.details[0].message}`
    req.flash('error', errorMessage)
    return res.redirect('back')
}