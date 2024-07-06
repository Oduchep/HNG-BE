import Joi from 'joi';

const organisationValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
});

export { organisationValidation };
