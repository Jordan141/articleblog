const ARTICLE_ROUTES = {
    'GET': {
        '/image/': require('./articles/imageLinkSchema'),
        '/approve/': require('./articles/showArticleSchema'),

    },
    'POST': {
        '/': require('./createArticle'),
        '/approve/': require('./articles/showArticleSchema'),

    },
    'PUT': {
        '/': require('./articles/updateArticleSchema')
    },
    'DELETE': {
        '/': require('./articles/deleteArticleSchema.js')
    }
}

const ANALYTIC_ROUTES = {
    'POST': {
        '/fingerprint': require('./analytics/fingerprintSchema')
    }
}

const COMMENT_ROUTES = {
    'POST': {
        '/': require('./comments/createCommentSchema')
    },
    'PUT': {
        '/': require('./comments/updateCommentSchema')
    },
    'DELETE': {
        '/': require('./comments/deleteCommentSchema')
    }
}

const INDEX_ROUTES = {

}



module.exports = {
    ANALYTIC_ROUTES,
    ARTICLE_ROUTES,
}