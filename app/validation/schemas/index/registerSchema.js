const joi = require('joi')
const {
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    EMAIL_MIN_LENGTH,
    EMAIL_MAX_LENGTH
} = require('../../../staticdata/minmax.json').USER
module.exports = joi.object().keys({
    username: joi.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH).alphanum().required(),
    password: joi.string().trim().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
    email: joi.string().trim().email().min(EMAIL_MIN_LENGTH).max(EMAIL_MAX_LENGTH).required(),
    _csrf: joi.string().required(),
    captcha: joi.string().min(4).max(4).required()
})