const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    avatar: {type: String, default: ''},
    email: {type: String, required: true, unique: true},
    role: {type: String, default: 'user', required: true},
    motto: {type: String, default: ''},
    fullname: {type: String, default: ''},
    bio: String,
    isAdmin: {type: Boolean, default: false},
    socials: [
        {type: String, default: ''}
    ]
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)