const {
    ANALYTIC_ROUTES,
    ARTICLE_ROUTES,
    COMMENT_ROUTES,
    INDEX_ROUTES
} = require('./schemas')
const logger = require('../logger')
const GET = 'GET', PARAMS = 'params', QUERY = 'query', BODY = 'body'
const QUERY_ROUTES = {}

module.exports = (routeSchema, property) => {
    return (req, res, next) => {
        const validationResult = routeSchema.validate(req[property])
        if(!validationResult) return res.render('error', {code :500, msg: 'Oops! Something went wrong!'})
        const {error} = validationResult
        if(!error) return next()
        
        req.flash('error', 'Invalid inputs')
        return res.redirect('back')
    }   
}

const myfunc = (routeSchema, req, res, next) => {
    const path = req.path, method = req.method
    const property = method === GET ? getPropertyOfUrl(path) : BODY
    const {error, value} = validationSchemas[method]?.[path]?.validate(req[property]) ?? {error: null, value: null}
    logger.info(`Error: ${JSON.stringify(error)} \n Value: ${JSON.stringify(value)}`)
    console.log(`Delete me later Path: ${path}\nMethod: ${method}`)
    if(!error) return next()

    const {details} = error
    const message = details.map(i => i.message).join(',')
    logger.info('Error:', message)
    
    return res.render('error', {code: 422, msg: message})
}

function getPropertyOfUrl(path) {
    if(QUERY_ROUTES.hasOwnProperty(path)) return QUERY
    return PARAMS
}