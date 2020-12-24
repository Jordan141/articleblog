const mongoose = require('mongoose')
const CATEGORIES_LIST = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../staticdata/categories.json'), 'utf-8'))
const {
    BODY_MAX_LENGTH,
    BODY_MIN_LENGTH,
    DESC_MAX_LENGTH,
    DESC_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH
} = require('../staticdata/minmax.json').ARTICLES

const articleSchema = new mongoose.Schema({
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    createdAt: {type: Number, default: +Date.now(), required: true},
    title: {type: String, required: true, minlength: TITLE_MIN_LENGTH, maxlength: TITLE_MAX_LENGTH},
    description: {type: String, required: true, minlength: DESC_MIN_LENGTH, maxlength: DESC_MAX_LENGTH},
    body: {type: String, required: true, minlength: BODY_MIN_LENGTH, maxlength: BODY_MAX_LENGTH},
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