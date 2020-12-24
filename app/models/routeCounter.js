const mongoose = require('mongoose')

const routeCounter = new mongoose.Schema({
    url: {type: String, require},
    viewCount: {type: Number, default: 0, require},
    visitedUsers: [String]
})

module.exports = mongoose.model('counter', routeCounter)