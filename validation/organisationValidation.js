import Joi from 'joi';

const organisationValidation = Joi.object({
  title: Joi.string().min(3).required(),
  author: Joi.string().min(3).required(),
  pages: Joi.number().required(),
  genres: Joi.array().items(Joi.string()).required(),
  rating: Joi.number().required(),
  reviews: Joi.array(),
});

export { organisationValidation };
