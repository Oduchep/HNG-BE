import express from 'express';
import dotenv from 'dotenv';
import greetingRoutes from './routes/greetingRoutes.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organisationRoutes from './routes/organisationRoutes.js';
import { sequelize } from './db.config.js';

dotenv.config();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger middleware
app.use(logger);

// Routes
app.use('/api/organisations', organisationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', greetingRoutes);

app.get('/', (req, res) => {
  res.send('API works!');
});

// Error handler
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 6005;

// Connect to database
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to PostgreSQL has been established successfully.');
    return sequelize.sync(); // Sync all models
  })
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

// Export the Express app for Vercel
export default app;
