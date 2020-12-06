const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    title: {type: String, required: true},
    description: {type: String, required: true},
    body: {type: String, required: true},
    isApproved: {type: Boolean, default: false, required: true},
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
})

module.exports = mongoose.model('Article', articleSchema)