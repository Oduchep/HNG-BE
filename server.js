import express from 'express';
import mongoose from 'mongoose';
import greetingRoutes from './routes/greetingRoutes.js';
import logger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

const app = express();

// body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logger middleware
app.use(logger);

// routes
app.use('/api', greetingRoutes);

app.get('/', (req, res) => {
  res.send('API works!');
});

// error handler
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 6005;

// connect to db
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port...${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
