const Joi = require('joi')
const JOI_OBJECTID_PATTERN = new RegExp(/^[0-9a-fA-F]{24}$/)
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

module.exports = Joi.object().keys({
    id: Joi.string().regex(JOI_OBJECTID_PATTERN),
    header: Joi.any(),
    image: Joi.any(),
    title: Joi.string().trim().min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH).required(),
    description: Joi.string().trim().min(DESC_MIN_LENGTH).max(DESC_MAX_LENGTH).required(),
    body: Joi.string().trim().min(BODY_MIN_LENGTH).max(BODY_MAX_LENGTH).required(),
    categories: Joi.alternatives(Joi.array().items(Joi.string().valid(...validCategories)), Joi.string().valid(...validCategories))
})