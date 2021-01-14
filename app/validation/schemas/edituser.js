const Joi = require('joi')
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
    FULLNAME_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH
} = require('../../staticdata/minmax.json').USER

module.exports = Joi.object.keys({
    username: Joi.string().required().alphanum().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH),
    password: Joi.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    email: Joi.string().email().min(EMAIL_MIN_LENGTH).max(EMAIL_MAX_LENGTH),
    motto: Joi.string().min(MOTTO_MIN_LENGTH).max(MOTTO_MAX_LENGTH),
    fullname: Joi.string().alphanum().min(FULLNAME_MIN_LENGTH).max(FULLNAME_MAX_LENGTH),
    bio: Joi.string().alphanum().min(BIO_MIN_LENGTH).max(BIO_MAX_LENGTH),
    socials: Joi.object.keys({
        github: Joi.string().uri(),
        linkedin: Joi.string().uri(),
        codepen: Joi.string().uri()
    })
})