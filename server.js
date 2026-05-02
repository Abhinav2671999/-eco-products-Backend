require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const multer = require('multer');

const productRoutes = require('./routes/productRoutes');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eco_products';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

app.use(
  cors({
    origin: CLIENT_ORIGIN === '*' ? true : CLIENT_ORIGIN.split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (_req, res) => {
  res.json({
    name: 'Eco Products API',
    status: 'ok',
    endpoints: {
      list: 'GET /api/products',
      detail: 'GET /api/products/:id',
      create: 'POST /api/products (multipart/form-data)',
      update: 'PUT /api/products/:id (multipart/form-data)',
      remove: 'DELETE /api/products/:id',
    },
  });
});

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

app.use('/api/products', productRoutes);

app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  console.error('[error]', err);
  res
    .status(err.status || 500)
    .json({ message: err.message || 'Internal Server Error' });
});

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[db] connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    app.listen(PORT, () => {
      console.log(`[api] listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
})();
