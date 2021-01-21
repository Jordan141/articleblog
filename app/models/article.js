const mongoose = require('mongoose')
const mongooseFuzzySearching = require('mongoose-fuzzy-searching')
const CATEGORIES_LIST = require('../staticdata/categories.json')
const slugify = require('slugify')
const SLUGIFY_OPTIONS = require('../staticdata/slugify_options.json')
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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    headerUrl: {type: String},
    createdAt: {type: Number, default: +Date.now(), required: true},
    link: {type: String, required: true, minlength: TITLE_MIN_LENGTH, maxlength: TITLE_MAX_LENGTH, unique: true},
    oldLinks: {
        type: [{type: String, minlength: TITLE_MIN_LENGTH}],
        default : []
    },
    title: {type: String, required: true, minlength: TITLE_MIN_LENGTH, maxlength: TITLE_MAX_LENGTH},
    description: {type: String, required: true, minlength: DESC_MIN_LENGTH, maxlength: DESC_MAX_LENGTH},
    body: {type: String, required: true, minlength: BODY_MIN_LENGTH, maxlength: BODY_MAX_LENGTH},
    isApproved: {type: Boolean, default: false, required: true},
    categories: [{
        type: String,
        default: "",
        validate: [categoryValidation, `{PATH} failed category validation`],
        required: true
    }],
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
articleSchema.pre('validate', function(next) {
    if(!this.isModified('title')) return next()
    if(this.link) this.oldLinks.push(this.link)
    this.link = slugify(this.title, SLUGIFY_OPTIONS)
    return next()
})

articleSchema.plugin(mongooseFuzzySearching, {fields: ['title']})
module.exports = mongoose.model('Article', articleSchema)