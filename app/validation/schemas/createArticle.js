const Joi = require('joi')
const ALPHANUM_DASH_SPACES = new RegExp(/^[\w\-\s]+$/)
const {
    BODY_MAX_LENGTH,
    BODY_MIN_LENGTH,
    DESC_MAX_LENGTH,
    DESC_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH
} = require('../staticdata/minmax.json').ARTICLES

module.exports = Joi.object().keys({
    id: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    title: Joi.string().regex(ALPHANUM_DASH_SPACES).min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH).required(),
    description: Joi.string().min(DESC_MIN_LENGTH).max(DESC_MAX_LENGTH).required(),
    body: Joi.string().min(BODY_MIN_LENGTH).max(BODY_MAX_LENGTH).required()
})