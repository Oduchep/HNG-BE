import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { userValidation } from '../validation/userValidation.js';
import organisationModel from './organisationModel.js';
import { createError } from '../errors/customError.js';

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, default: uuidv4 },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    organisations: [{ type: Schema.Types.ObjectId, ref: 'Organisation' }],
  },
  { timestamps: true },
);

// Static sign-up method
userSchema.statics.signup = async function (data) {
  // Validate request body
  const { error } = userValidation.validate(data);

  if (error) {
    throw createError(error.details[0].message, 400);
  }

  // Check for existing email or phone
  const emailExists = await this.findOne({ email: data.email });
  if (emailExists) {
    throw createError('Registration unsuccessful', 400);
  }

  const phoneExists = await this.findOne({ phone: data.phone });
  if (phoneExists) {
    throw createError('Phone number already in use!', 400);
  }

  // Generate a unique userId
  let userId;
  let userIdExists;

  do {
    userId = uuidv4();
    userIdExists = await this.findOne({ userId });
  } while (userIdExists);

  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(data.password, salt);

  // Create the user
  const user = await this.create({ ...data, userId, password: hash });

  // Create an organisation for the user
  const orgName = `${data.firstName}'s Organisation`;
  const organisation = await organisationModel.create({
    name: orgName,
    users: [user._id],
  });

  // Add the organisation to the user's organisations list
  user.organisations.push(organisation._id);
  await user.save();

  return user;
};

// static login method
userSchema.statics.login = async function ({ email, password }) {
  // valiadtion

  if (!email || !password) {
    throw createError('All fields are required!', 400);
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw createError('Authentication failed!', 401);
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw createError('Authentication failed!', 401);
  }

  return user;
};

export default mongoose.model('User', userSchema);
