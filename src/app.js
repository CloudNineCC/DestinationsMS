const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

require('./db');

const citiesRouter = require('./routes/cities');
const seasonsRouter = require('./routes/seasons');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/cities', citiesRouter);
app.use('/seasons', seasonsRouter);

app.use((req, res) => {
  res.status(404).json({ errors: ['Not Found'] });
});

app.use((err, req, res, next) => {
  // For simplicity log to console. In production, use structured logging.
  console.error(err);
  res.status(500).json({ errors: ['Internal Server Error'] });
});

module.exports = app;
