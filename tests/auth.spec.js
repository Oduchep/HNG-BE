import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../server.js';
import { sequelize } from '../db.config.js';
import OrganisationModel from '../models/organisationModel.js';
import UserModel from '../models/userModel.js';

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

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Token Generation', () => {
  it('should generate a token that expires at the correct time and includes correct user details', () => {
    const userId = 'testuser1';
    const token = jwt.sign({ _id: userId }, SECRET, { expiresIn: '3d' });
    const decoded = jwt.verify(token, SECRET);

    expect(decoded._id).toBe(userId);
    const expectedExpiration = Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60;
    expect(decoded.exp).toBeCloseTo(expectedExpiration, -2);
  });
});

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await UserModel.destroy({ where: {} });
    await OrganisationModel.destroy({ where: {} });
  });

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

  it('should fail if required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({});

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');

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

  it('should log the user in successfully', async () => {
    const newUser = {
      firstName: 'Lonely',
      lastName: 'Jackson',
      email: 'lonely10@yopmail.com',
      password: 'Qwerty@123',
      phone: '00077621112',
    };

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newUser.password, salt);
    const user = await UserModel.create({
      ...newUser,
      password: hashedPassword,
    });

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

  it('should fail if there is duplicate email or userID', async () => {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(user_details.password, salt);
    const user = await UserModel.create({
      ...user_details,
      password: hashedPassword,
    });

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

describe('Organisation Access', () => {
  let user1, user2, organisation1, organisation2;

  beforeAll(async () => {
    await UserModel.destroy({ where: {} });
    await OrganisationModel.destroy({ where: {} });

    organisation1 = await OrganisationModel.create({ name: 'Org 1' });
    organisation2 = await OrganisationModel.create({ name: 'Org 2' });

    user1 = await UserModel.create({
      firstName: 'UniqueJohn',
      lastName: 'Doe',
      email: 'uniquejohn@example.com',
      password: 'password',
      phone: '1234567890',
    });
    user2 = await UserModel.create({
      firstName: 'UniqueJane',
      lastName: 'Doe',
      email: 'uniquejane@example.com',
      password: 'password',
      phone: '0987654321',
    });

    await user1.addOrganisation(organisation1);
    await user2.addOrganisation(organisation2);
  });

  afterAll(async () => {
    await UserModel.destroy({ where: {} });
    await OrganisationModel.destroy({ where: {} });
  });

  it('should not allow access to organisations the user does not belong to', async () => {
    const user1Orgs = await user1.getOrganisations();
    const user2Orgs = await user2.getOrganisations();

    expect(user1Orgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: organisation1.orgId }),
      ]),
    );
    expect(user1Orgs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: organisation2.orgId }),
      ]),
    );

    expect(user2Orgs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: organisation2.orgId }),
      ]),
    );
    expect(user2Orgs).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: organisation1.orgId }),
      ]),
    );
  });
});
