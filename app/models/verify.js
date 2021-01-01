const mongoose = require('mongoose')
const moment = require('moment')


const verifySchema = new mongoose.Schema({
    token: {type: String, required: true, unique: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    expiresAt: {type: Date, default: moment().add(3, 'days').valueOf()}
})

module.exports = mongoose.model('Verify', verifySchema)