import Joi from 'joi';

const passwordComplexity = Joi.string()
  .pattern(
    new RegExp(
      '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};\'\\":,.<>/?]).{8,}$',
    ),
  )
  .required()
  .messages({
    'string.pattern.base': `Password not strong enough.`,
  });

const userValidation = Joi.object({
  firstName: Joi.string().min(3).required(),
  lastName: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: passwordComplexity,
  phone: Joi.string().required(),
});

const addUserValidation = Joi.object({
  userId: Joi.string().required(),
});

export { userValidation, addUserValidation };
