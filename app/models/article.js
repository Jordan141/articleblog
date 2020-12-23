const mongoose = require('mongoose')
const CATEGORIES_LIST = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../staticdata/categories.json'), 'utf-8'))
const {
    ARTICLE_BODY_MAX_LENGTH,
    ARTICLE_BODY_MIN_LENGTH,
    ARTICLE_DESC_MAX_LENGTH,
    ARTICLE_DESC_MIN_LENGTH,
    ARTICLE_TITLE_MAX_LENGTH,
    ARTICLE_TITLE_MIN_LENGTH
} = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../staticdata/minmax.json'), 'utf-8'))

const articleSchema = new mongoose.Schema({
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    createdAt: {type: Number, default: +Date.now(), required: true},
    title: {type: String, required: true, minLength: ARTICLE_TITLE_MIN_LENGTH, maxLength: ARTICLE_TITLE_MAX_LENGTH},
    description: {type: String, required: true, minLength: ARTICLE_DESC_MIN_LENGTH, maxLength: ARTICLE_DESC_MAX_LENGTH},
    body: {type: String, required: true, minLength: ARTICLE_BODY_MIN_LENGTH, maxLength: ARTICLE_BODY_MAX_LENGTH},
    isApproved: {type: Boolean, default: false, required: true},
    categories: {
        type: [String],
        default: [],
        validate: [categoryValidation, `{PATH} failed category validation`],
        required: true
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
})

function categoryValidation(val) {
    return CATEGORIES_LIST.find(category => category.key === val)
}

module.exports = mongoose.model('Article', articleSchema)