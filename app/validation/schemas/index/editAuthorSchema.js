const Joi = require('joi')
const {
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    BIO_MIN_LENGTH,
    BIO_MAX_LENGTH,
    FULLNAME_MIN_LENGTH,
    FULLNAME_MAX_LENGTH,
    MOTTO_MIN_LENGTH,
    MOTTO_MAX_LENGTH,
    
} = require('../../../staticdata/minmax.json').USER

module.exports = Joi.object().keys({
    password: Joi.string().trim().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
    repeat_password: Joi.string().valid(Joi.ref('password')).label('Repeat Password').options({ messages: { 'any.only': '{{#label}} must be the same as password.'} }),
    bio: Joi.string().trim().min(BIO_MIN_LENGTH).max(BIO_MAX_LENGTH),
    motto: Joi.string().trim().min(MOTTO_MIN_LENGTH).max(MOTTO_MAX_LENGTH),
    fullname: Joi.string().trim().min(FULLNAME_MIN_LENGTH).max(FULLNAME_MAX_LENGTH),
    github: Joi.string().uri(),
    linkedin: Joi.string().uri(),
    codepen: Joi.string().uri(),
    _csrf: Joi.string().required()
})