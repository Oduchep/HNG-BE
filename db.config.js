import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log(`port: ${process.env.PORT}`);

export const sequelize = new Sequelize(process.env.POSTGRESQL_URI, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // Set to console.log to see the raw SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // If using a self-signed certificate
    },
  },
});
