const express = require('express');
const rateLimit = require('express-rate-limit');
const app = express();
const sessionRoutes = require('./routes/sessionRoutes');
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const clientRoutes = require('./routes/clientRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const specialtyRoutes = require('./routes/specialtyRoutes');
const timeTableRoutes = require('./routes/timeTableRoutes');
const helmet = require('helmet');

app.use(helmet());

app.use(express.json()); // Middleware for parsing JSON bodies

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use((req, res, next) => {
  console.log(`URL: ${req.method} ${req.url} ${JSON.stringify(req.body)})`);
  next();
});

// Import and set up model associations
require('./models/associations');


// Use the routes
app.use('/api', sessionRoutes);
app.use('/api', companyRoutes);
app.use('/api', userRoutes);
app.use('/api', clientRoutes);
app.use('/api', teacherRoutes);
app.use('/api', specialtyRoutes);
app.use('/api', timeTableRoutes);


module.exports = app;
