const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const {
    USERNAME_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    EMAIL_MIN_LENGTH,
    EMAIL_MAX_LENGTH,
    MOTTO_MIN_LENGTH,
    MOTTO_MAX_LENGTH,
    BIO_MIN_LENGTH,
    BIO_MAX_LENGTH,
    FULLNAME_MIN_LENGTH,
    FULLNAME_MAX_LENGTH
} = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '../staticdata/minmax.json'), 'utf-8'))

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true, minlength: USERNAME_MIN_LENGTH, maxlength: USERNAME_MAX_LENGTH},
    avatar: {type: String, default: ''},
    email: {type: String, required: true, unique: true, minlength: EMAIL_MIN_LENGTH, maxlength: EMAIL_MAX_LENGTH},
    role: {type: String, default: 'user', required: true},
    motto: {type: String, minlength: MOTTO_MIN_LENGTH, maxlength: MOTTO_MAX_LENGTH},
    fullname: {type: String, minlength: FULLNAME_MIN_LENGTH, maxlength: FULLNAME_MAX_LENGTH},
    bio: {type: String, minlength: BIO_MIN_LENGTH, maxlength: BIO_MAX_LENGTH},
    isAdmin: {type: Boolean, default: false},
    socials: [
        {type: String, default: ''}
    ]
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)