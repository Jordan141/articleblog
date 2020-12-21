const mongoose = require('mongoose')

const commentSchema = mongoose.Schema({
    text: String,
    createdAt: {type: Number, default: +Date.now(), required: true},
    author: {
     id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User'
     },
     username: String
    }
})

module.exports = mongoose.model('Comment', commentSchema)