const mongoose = require('mongoose')
const ARTICLE_BODY_MIN_LENGTH = 30,
ARTICLE_BODY_MAX_LENGTH = 10000,
ARTICLE_TITLE_MIN_LENGTH = 10,
ARTICLE_TITLE_MAX_LENGTH = 60,
ARTICLE_DESC_MIN_LENGTH = 30,
ARTICLE_DESC_MAX_LENGTH = 2000


const articleSchema = new mongoose.Schema({
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    createdAt: {type: Number, default: +Date.now(), required: true},
    title: {type: String, required: true, minlength: ARTICLE_TITLE_MIN_LENGTH, maxlength: ARTICLE_TITLE_MAX_LENGTH},
    description: {type: String, required: true, minlength: ARTICLE_DESC_MIN_LENGTH, maxlength: ARTICLE_DESC_MAX_LENGTH},
    body: {type: String, required: true, minlength: ARTICLE_BODY_MIN_LENGTH, maxlength: ARTICLE_BODY_MAX_LENGTH},
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
    const categories = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../staticdata/categories.json'), 'utf-8'))
    return categories.find(category => category.key === val)
}

module.exports = mongoose.model('Article', articleSchema)