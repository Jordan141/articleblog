const mongoose = require('mongoose')

const linkSchema = new mongoose.Schema({
    links: [String],
    author: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    article: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Article'
    }
})

module.exports = mongoose.model('Link', linkSchema)