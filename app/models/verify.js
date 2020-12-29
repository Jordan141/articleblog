const mongoose = require('mongoose')


const verifySchema = new mongoose.Schema({
    token: {type: String, required: true, unique: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    expiresAt: {type: Date, default: Date(Date.now() + 1000*60*60*24*2)}
})

module.exports = mongoose.model('Verify', verifySchema)