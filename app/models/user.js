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
    username: {type: String, required: true, unique: true, minLength: USERNAME_MIN_LENGTH, maxLength: USERNAME_MAX_LENGTH},
    avatar: {type: String, default: ''},
    email: {type: String, required: true, unique: true, minLength: EMAIL_MIN_LENGTH, maxmaxLengthength: EMAIL_MAX_LENGTH},
    role: {type: String, default: 'user', required: true},
    motto: {type: String, minLength: MOTTO_MIN_LENGTH, maxLength: MOTTO_MAX_LENGTH},
    fullname: {type: String, minLength: FULLNAME_MIN_LENGTH, maxLength: FULLNAME_MAX_LENGTH},
    bio: {type: String, minLength: BIO_MIN_LENGTH, maxLength: BIO_MAX_LENGTH},
    isAdmin: {type: Boolean, default: false},
    socials: [
        {type: String, default: ''}
    ]
})

userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', userSchema)