const mongoose = require('mongoose')
const {COMMENT_BODY_MIN_LENGTH, COMMENT_BODY_MAX_LENGTH} = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../staticdata/minmax.json'), 'utf-8'))

const commentSchema = mongoose.Schema({
    text: {type: String, minLength: COMMENT_BODY_MIN_LENGTH, maxLength: COMMENT_BODY_MAX_LENGTH},
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