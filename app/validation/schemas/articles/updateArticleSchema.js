const Joi = require('joi')
const ALPHANUM_DASH_SPACES = new RegExp(/^[\w\-\s]+$/)

const {
    BODY_MAX_LENGTH,
    BODY_MIN_LENGTH,
    DESC_MAX_LENGTH,
    DESC_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    TITLE_MIN_LENGTH
} = require('../../../staticdata/minmax.json').ARTICLES
const categoriesData = require('../../../staticdata/categories.json')
const validCategories = categoriesData.map(category => category.key)
const EMPTY_STRING = ""

module.exports = Joi.object().keys({
    title: Joi.string().regex(ALPHANUM_DASH_SPACES).min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH).required(),
    description: Joi.string().min(DESC_MIN_LENGTH).max(DESC_MAX_LENGTH).required(),
    body: Joi.string().min(BODY_MIN_LENGTH).max(BODY_MAX_LENGTH).required(),
    categories: Joi.alternatives(Joi.array().items(Joi.string().valid(...validCategories)), Joi.string().valid(...validCategories), Joi.string().valid(EMPTY_STRING))
})