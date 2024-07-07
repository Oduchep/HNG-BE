import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server';
import userModel from '../models/userModel';
import organisationModel from '../models/organisationModel';
import bcrypt from 'bcrypt';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
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

// BeforeAll and AfterAll hooks for database connection and cleanup
beforeAll(async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

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
    await userModel.deleteMany({});
    await organisationModel.deleteMany({});
  });

  // Test case for successful user registration with default organisation
  it('should register user successfully with default organisation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(user_details);

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
    const res = await request(app).post('/api/auth/register').send({
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

    const res = await request(app).post('/api/auth/login').send({
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
      .post('/api/auth/register')
      .send(dup_user_details);

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toContainEqual({
      field: 'email',
      message: 'Email already exists',
    });
  });
});

// Describe block for organisation access tests
describe('Organisation Access', () => {
  let user1, user2, organisation1, organisation2;

  beforeAll(async () => {
    // Clear the database before running the tests
    await userModel.deleteMany({});
    await organisationModel.deleteMany({});

    // Create organisations
    organisation1 = await organisationModel.create({ name: 'Org 1' });
    organisation2 = await organisationModel.create({ name: 'Org 2' });

    // Create users
    user1 = await userModel.create({
      firstName: 'UniqueJohn',
      lastName: 'Doe',
      email: 'uniquejohn@example.com',
      password: 'password',
      phone: '1234567890',
      organisations: [organisation1._id],
    });
    user2 = await userModel.create({
      firstName: 'UniqueJane',
      lastName: 'Doe',
      email: 'uniquejane@example.com',
      password: 'password',
      phone: '0987654321',
      organisations: [organisation2._id],
    });
  });

  afterAll(async () => {
    // Clean up the database after tests
    await userModel.deleteMany({});
    await organisationModel.deleteMany({});
  });

  // Test case to ensure users cannot access organisations they do not belong to
  it('should not allow access to organisations the user does not belong to', async () => {
    const user1Orgs = await userModel
      .findById(user1._id)
      .populate('organisations');
    const user2Orgs = await userModel
      .findById(user2._id)
      .populate('organisations');

    expect(user1Orgs.organisations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: organisation1._id }),
      ]),
    );
    expect(user1Orgs.organisations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: organisation2._id }),
      ]),
    );

    expect(user2Orgs.organisations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: organisation2._id }),
      ]),
    );
    expect(user2Orgs.organisations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ _id: organisation1._id }),
      ]),
    );
  });
});
