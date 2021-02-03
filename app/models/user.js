const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')
const slugify = require('slugify')
const SLUGIFY_OPTIONS = require('../staticdata/slugify_options.json')
const {getLink} = require('../modelUtils')
const logger = require('../logger')
const USER_TYPE = 'user'
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
} = require('../staticdata/minmax.json').USER

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true, minlength: USERNAME_MIN_LENGTH, maxlength : USERNAME_MAX_LENGTH},
    avatar: {type: String, default: ''},
    lastChanged: {type: String, default: Date.now().toString()},
    email: {type: String, required: true, unique: true, minlength: EMAIL_MIN_LENGTH, maxlength : EMAIL_MAX_LENGTH},
    role: {type: String, default: 'user', required: true},
    motto: {type: String, minlength: MOTTO_MIN_LENGTH, maxlength : MOTTO_MAX_LENGTH},
    link: {type: String, minlength: FULLNAME_MIN_LENGTH, maxlength: FULLNAME_MAX_LENGTH, unique: true},
    fullname: {type: String, minlength: FULLNAME_MIN_LENGTH, maxlength: FULLNAME_MAX_LENGTH},
    bio: {type: String, minlength: BIO_MIN_LENGTH, maxlength: BIO_MAX_LENGTH},
    isAdmin: {type: Boolean, default: false},
    socials: {
        github: {type: String, default: ''},
        linkedin: {type: String, default: ''},
        codepen: {type: String, default: ''}
    },
    verified: {type: Boolean, default: false, require: true}
})

userSchema.index({createdAt: 1}, {expireAfterSeconds: 259200, partialFilterExpression : {verified: false}})
userSchema.plugin(passportLocalMongoose, {
    findByUsername: function(model, queryParameters) {
        queryParameters.verified = true
        return model.findOne(queryParameters)
    }
})

userSchema.pre('validate', async function(next) {
    try {
        if(!this.isModified('fullname')) return next()
        const sluggedLink = slugify(this.fullname, SLUGIFY_OPTIONS)
        this.link = await getLink(sluggedLink, USER_TYPE, this._id)

        if(this.isModified('avatar')) {
            this.lastChanged = Date.now().toString()
        }
        return next()
    } catch(err) {
        logger.info(`Pre User Validate Error: ${err}`)
        return next(err)
    }
})

module.exports = mongoose.model('User', userSchema)