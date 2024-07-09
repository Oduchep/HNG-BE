import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { createSuccess } from '../utils/createSuccess.js';

const createToken = (id) => {
  return jwt.sign({ userId: id }, process.env.SECRET, { expiresIn: '3d' });
};

// Register user
const signUpUser = async (req, res, next) => {
  const data = req.body;

  try {
    const user = await userModel.signup(data);

    const token = createToken(user.userId);

    const res_data = {
      accessToken: token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    };

    res.status(201).json(createSuccess('Registration successful', res_data));
  } catch (error) {
    const status = error.status || 500;
    const statusCode = error.statusCode || 500;

    if (status === 422) {
      res.status(422).json(error.errors);
    } else {
      res.status(statusCode).json({
        status,
        message: error.message,
        statusCode,
      });
    }
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.login({ email, password });

    const token = createToken(user.userId);

    const res_data = {
      accessToken: token,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
      },
    };

    res.status(200).json(createSuccess('Login successful', res_data));
  } catch (error) {
    const status = error.status || 500;
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      status,
      message: error.message,
      statusCode,
    });
  }
};

export { signUpUser, loginUser, createToken };
