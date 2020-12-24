const mongoose = require('mongoose')
const {COMMENT_BODY_MIN_LENGTH, COMMENT_BODY_MAX_LENGTH} = require('../staticdata/minmax.json')

const commentSchema = mongoose.Schema({
    text: {type: String, minlength: COMMENT_BODY_MIN_LENGTH, maxlength: COMMENT_BODY_MAX_LENGTH},
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