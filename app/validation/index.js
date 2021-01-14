const schemas = require('./schemas')

module.exports = (req, res, next) => {
    const __path = req.path
    const __method = req.method
    console.log(`Delete me later Path: ${__path}\nMethod: ${__method}`)


    next()
}