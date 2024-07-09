import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../server';
import userModel from '../models/userModel';
import organisationModel from '../models/organisationModel';
import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';
import pg from 'pg';

dotenv.config();

const SECRET = process.env.SECRET;

const user_details = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'Qwerty@123',
  phone: '1234567890',
};

const dup_user_details = {
  firstName: 'Paul',
  lastName: 'Kennedy',
  email: 'john@example.com',
  password: 'Qwerty@123',
  phone: '1234567822',
};

const port = 6001;

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  protocol: 'postgres',
  logging: false, // Set to console.log to see the raw SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // If using a self-signed certificate
    },
  },
});

// BeforeAll and AfterAll hooks for database connection and cleanup
beforeAll(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to PostgreSQL has been established successfully.');

    await sequelize.sync(); // Sync all models
    console.log('Database synchronized.');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  }
}, 10000); // Increase timeout to 10 seconds (10000 ms)

afterAll(async () => {
  await sequelize.close();
}, 10000); // Increase timeout for cleanup as well

// Describe block for token generation tests
describe('Token Generation', () => {
  it('should generate a token that expires at the correct time and includes correct user details', () => {
    const userId = 'testuser1';
    const token = jwt.sign({ _id: userId }, SECRET, { expiresIn: '3d' });
    const decoded = jwt.verify(token, SECRET);

    expect(decoded._id).toBe(userId);
    const expectedExpiration = Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60;
    expect(decoded.exp).toBeCloseTo(expectedExpiration, -2); // Allow a small margin of error
  });
});

// Describe block for authentication endpoints
describe('Auth Endpoints', () => {
  // BeforeEach hook to clear users and organisations before each test
  beforeEach(async () => {
    await userModel.destroy({ truncate: true, cascade: true });
    await organisationModel.destroy({ truncate: true, cascade: true });
  });

  // Test case for successful user registration with default organisation
  it('should register user successfully with default organisation', async () => {
    const res = await request(app).post('/auth/register').send(user_details);

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.firstName).toBe(user_details.firstName);
    expect(res.body.data.user.lastName).toBe(user_details.lastName);
    expect(res.body.data.user.phone).toBe(user_details.phone);
  });

  // Test case for missing required fields during user registration
  it('should fail if required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({
      // Omitting firstName, lastName, email, password, phone intentionally
    });

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');

    // Check for specific error messages
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        { field: 'firstName', message: '"firstName" is required' },
        { field: 'lastName', message: '"lastName" is required' },
        { field: 'email', message: '"email" is required' },
        { field: 'password', message: '"password" is required' },
        { field: 'phone', message: '"phone" is required' },
      ]),
    );
  });

  // Test case for successful user login
  it('should log the user in successfully', async () => {
    const newUser = {
      firstName: 'Lonely',
      lastName: 'Jackson',
      email: 'lonely10@yopmail.com',
      password: 'Qwerty@123',
      phone: '00077621112',
    };

    // Save the user with a hashed password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);
    const user = new userModel({ ...newUser, password: hashedPassword });
    await user.save();

    const res = await request(app).post('/auth/login').send({
      email: newUser.email,
      password: newUser.password,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.firstName).toBe(newUser.firstName);
    expect(res.body.data.user.lastName).toBe(newUser.lastName);
  });

  // Test case for duplicate email during user registration
  it('should fail if there is duplicate email or userID', async () => {
    // Create the first user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(user_details.password, salt);
    const user = new userModel({ ...user_details, password: hashedPassword });
    await user.save();

    // Attempt to register the second user with the same email
    const res = await request(app)
      .post('/auth/register')
      .send(dup_user_details);

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toContainEqual({
      field: 'email',
      message: 'Email already exists',
    });
  });
});
