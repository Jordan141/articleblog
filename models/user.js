const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    avatar: {type: String, default: ''},
    email: {type: String, required: true},
    bio: String,
    isAdmin: {type: Boolean, default: false}
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)