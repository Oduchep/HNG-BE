import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sequelize } from '../db.config.js';
import OrganisationModel from './organisationModel.js'; // adjust the path as necessary
import { userValidation } from '../validation/userValidation.js';
import { createError, formatErrors } from '../utils/customError.js';

const UserModel = sequelize.define(
  'User',
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

// Define junction table for many-to-many relationship
const UserOrganisation = sequelize.define(
  'UserOrganisation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userId',
      },
    },
    orgId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Organisations',
        key: 'orgId',
      },
    },
  },
  {
    timestamps: true,
  },
);

// Define the association with Organisation
UserModel.belongsToMany(OrganisationModel, {
  through: UserOrganisation,
  foreignKey: 'userId',
  otherKey: 'orgId',
});
OrganisationModel.belongsToMany(UserModel, {
  through: UserOrganisation,
  foreignKey: 'orgId',
  otherKey: 'userId',
});

// Static signup method
UserModel.signup = async function (data) {
  const { error } = userValidation.validate(data, { abortEarly: false });
  if (error) {
    const formattedErrors = formatErrors(error.details);
    const validationError = new Error('Validation Error');
    validationError.status = 422;
    validationError.errors = formattedErrors;
    throw validationError;
  }

  const emailExists = await this.findOne({ where: { email: data.email } });
  if (emailExists) {
    const validationError = new Error('Email already exists');
    validationError.status = 422;
    validationError.errors = {
      errors: [{ field: 'email', message: 'Email already exists' }],
    };
    throw validationError;
  }

  const phoneExists = await this.findOne({ where: { phone: data.phone } });
  if (phoneExists) {
    throw createError('Phone number already in use!', 400);
  }

  let userId;
  let userIdExists;

  do {
    userId = uuidv4();
    userIdExists = await this.findOne({ where: { userId } });
  } while (userIdExists);

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(data.password, salt);

  const user = await this.create({ ...data, userId, password: hash });

  const orgName = `${data.firstName}'s Organisation`;
  const organisation = await OrganisationModel.create({
    name: orgName,
  });

  await user.addOrganisation(organisation.orgId);

  return user;
};

// Static login method
UserModel.login = async function ({ email, password }) {
  if (!email || !password) {
    throw createError('All fields are required!', 400);
  }

  const user = await this.findOne({ where: { email } });

  if (!user) {
    throw createError('Authentication failed!', 401);
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw createError('Authentication failed!', 401);
  }

  return user;
};

export default UserModel;
