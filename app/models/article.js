const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    createdAt: {type: Number, default: +Date.now(), required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    body: {type: String, required: true},
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
    const categories = require('../staticdata/categories.json')
    return categories.find(category => category.key === val)
}

module.exports = mongoose.model('Article', articleSchema)