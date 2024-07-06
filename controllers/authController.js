import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { createSuccess } from '../middleware/createSuccess.js';

const createToken = (id) => {
  return jwt.sign({ _id: id }, process.env.SECRET, { expiresIn: '3d' });
};

// register user
const signUpUser = async (req, res) => {
  const data = req.body;

  try {
    const user = await userModel.signup(data);

    // create a token
    const token = createToken(user?._id);

    const res_data = {
      accessToken: token,
      user: {
        userId: user?.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
      },
    };

    res.status(201).json(createSuccess('Registration successful', res_data));
  } catch (error) {
    const status = error.status;
    const statusCode = error.statusCode;
    res.status(error.statusCode).json({
      status,
      message: error.message,
      statusCode,
    });
  }
};

// login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.login({ email, password });

    // create a token
    const token = createToken(user?._id);

    const res_data = {
      accessToken: token,
      user: {
        userId: user?.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        phone: user?.phone,
      },
    };

    res.status(200).json(createSuccess('Login successful', res_data));
  } catch (error) {
    const status = error.status;
    const statusCode = error.statusCode;
    res.status(error.statusCode).json({
      status,
      message: error.message,
      statusCode,
    });
  }
};

export { signUpUser, loginUser };
