const mongoose = require('mongoose')

const linkSchema = new mongoose.Schema({
    link: {type: String, unique: true, required: true},
    docType: {type: String, required: true, enum:['user', 'article']},
    doc_id: {type: mongoose.Schema.Types.ObjectId}
})

module.exports = mongoose.model('Link', linkSchema)