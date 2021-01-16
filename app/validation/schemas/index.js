module.exports = {
    'GET': { },
    'POST': {
        '/articles/new': require('./createArticle'),
        '/fingerprint': require('./fingerprint')
    },
    'PUT': {
        '/articles/' : require('./updateArticle')
    }
}