const mongoose = require('mongoose')


const verifySchema = new mongoose.Schema({
    token: {type: String, required: true, unique: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    expiresAt: {type: Date, default: Date.now, expires: '3d'}
})

module.exports = mongoose.model('Verify', verifySchema)