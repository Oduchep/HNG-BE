import express from 'express';
import mongoose from 'mongoose';
import greetingRoutes from './routes/greetingRoutes.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import organisationRoutes from './routes/organisationRoutes.js';

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
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log(`Connected to MongoDB`);
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
  });

// Export the Express app for Vercel
export default app;
