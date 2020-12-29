const mongoose = require('mongoose')


const verifySchema = new mongoose.Schema({
    token: {type: String, required: true, unique: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    expiresAt: {type: Date, default: new Date(new Date().setDate(new Date().getDate() + 3))}
})

module.exports = mongoose.model('Verify', verifySchema)