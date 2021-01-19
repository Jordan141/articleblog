const Joi = require('joi')
const {
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    EMAIL_MIN_LENGTH,
    EMAIL_MAX_LENGTH
} = require('../../../staticdata/minmax.json').USER
module.exports = Joi.object().keys({
    username: Joi.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH).alphanum().required(),
    password: Joi.string().trim().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).required(),
    repeat_password: Joi.string().required().valid(Joi.ref('password')).label('Repeat Password').options({ messages: { 'any.only': '{{#label}} must be the same as password.'} }),
    email: Joi.string().trim().email().min(EMAIL_MIN_LENGTH).max(EMAIL_MAX_LENGTH).required(),
    _csrf: Joi.string().required(),
    captcha: Joi.string().min(4).max(4).required()
})