require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Source images live inside the repo so seeding works on any machine / on Render.
const seedDir = path.join(__dirname, 'seed-images');
const PLATE_IMG = path.join(seedDir, 'plate.jpeg');
const BOWL_IMG = path.join(seedDir, 'bowl.jpeg');
const TRAY_IMG = path.join(seedDir, 'tray.jpeg');
const PLATE_SQUARE_IMG = PLATE_IMG;
const PLATE_COMPARTMENT_IMG = TRAY_IMG;
const BOWL_SOUP_IMG = BOWL_IMG;
const TRAY_4_IMG = TRAY_IMG;
const TRAY_5_IMG = TRAY_IMG;

const products = [
  {
    name: 'Bagasse Round Plate 6" — Pack of 50',
    description:
      'Sturdy 6-inch round plate moulded from sugarcane bagasse. Ideal for snacks, desserts and small bites. Microwave-safe up to 120°C, leak-resistant and fully compostable in 90 days.',
    price: 125,
    category: 'plates',
    image: PLATE_IMG,
  },
  {
    name: 'Bagasse Round Plate 8" — Pack of 50',
    description:
      'The everyday workhorse. Strong enough for full meals, sturdy under hot, oily and gravy-based dishes. Perfect for cafés, canteens and event catering.',
    price: 175,
    category: 'plates',
    image: PLATE_IMG,
  },
  {
    name: 'Bagasse Round Plate 10" — Pack of 50',
    description:
      'Generous 10-inch dinner plate for full thalis and main courses. Holds rice, curry and sides without bending or leaking. 100% compostable.',
    price: 225,
    category: 'plates',
    image: PLATE_IMG,
  },
  {
    name: 'Bagasse Square Plate 9" — Pack of 50',
    description:
      'Modern square plate with raised edges. Plates up beautifully for cloud-kitchen dine-in and premium takeaway. Microwave-safe and freezer-safe.',
    price: 250,
    category: 'plates',
    image: PLATE_SQUARE_IMG,
  },
  {
    name: '3-Compartment Bagasse Plate — Pack of 50',
    description:
      'Three-section plate for thali-style serving. Divides rice, curry and sides without taste mingling. The bestseller for South Indian and meal-combo brands.',
    price: 300,
    category: 'plates',
    image: PLATE_COMPARTMENT_IMG,
  },
  {
    name: 'Bagasse Bowl 240ml — Pack of 50',
    description:
      'Snack-sized bowl for chutneys, raita, dips and ice-cream. Stackable, rigid and oil-resistant. A clean upgrade from plastic katoris.',
    price: 125,
    category: 'bowls',
    image: BOWL_IMG,
  },
  {
    name: 'Bagasse Bowl 360ml — Pack of 50',
    description:
      'Mid-size bowl for curries, dal, salads and dessert servings. Holds piping-hot food without warping. Microwave-safe up to 120°C.',
    price: 150,
    category: 'bowls',
    image: BOWL_IMG,
  },
  {
    name: 'Bagasse Bowl 500ml — Pack of 50',
    description:
      'The cloud-kitchen favourite. Deep, sturdy bowl for biryani, ramen, poke and curry-rice combos. Travels well in delivery bags.',
    price: 200,
    category: 'bowls',
    image: BOWL_IMG,
  },
  {
    name: 'Bagasse Soup Bowl 750ml — Pack of 25',
    description:
      'Tall, insulated soup bowl that keeps broths and gravies hot longer. Pairs with our compostable lid (sold separately) for spill-free delivery.',
    price: 150,
    category: 'bowls',
    image: BOWL_SOUP_IMG,
  },
  {
    name: '3-Compartment Bagasse Meal Tray — Pack of 25',
    description:
      'Single-serve meal tray with three deep compartments — rice, curry and a side. Strong base, no leakage, fits standard delivery bags.',
    price: 175,
    category: 'meal trays',
    image: TRAY_IMG,
  },
  {
    name: '4-Compartment Bagasse Meal Tray — Pack of 25',
    description:
      'A grown-up bento. Four compartments for a main, two sides and a small dessert or pickle. The go-to for office tiffin and corporate catering.',
    price: 225,
    category: 'meal trays',
    image: TRAY_4_IMG,
  },
  {
    name: '5-Compartment Bagasse Meal Tray — Pack of 25',
    description:
      'Premium thali tray with five sections. Designed for restaurants offering full-meal takeaway and event banquet service.',
    price: 275,
    category: 'meal trays',
    image: TRAY_5_IMG,
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function copyLocal(source, filepath) {
  return new Promise((resolve, reject) => {
    fs.copyFile(source, filepath, (err) => {
      if (err) return reject(err);
      resolve(filepath);
    });
  });
}

(async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  console.log('[seed] connecting to MongoDB…');
  await mongoose.connect(MONGO_URI);
  console.log(`[seed] connected: ${mongoose.connection.host}/${mongoose.connection.name}`);

  console.log('[seed] clearing existing products…');
  await Product.deleteMany({});

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const ext = path.extname(p.image) || '.jpeg';
    const filename = `seed-${String(i + 1).padStart(2, '0')}-${slugify(p.name)}${ext}`;
    const filepath = path.join(uploadDir, filename);
    try {
      console.log(`[seed] (${i + 1}/${products.length}) copying image for "${p.name}"`);
      await copyLocal(p.image, filepath);
      await Product.create({
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        image: filename,
      });
      console.log(`[seed]   → saved ${filename}`);
    } catch (err) {
      console.error(`[seed]   ✗ failed: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log('[seed] done. Disconnected.');
})().catch((err) => {
  console.error('[seed] fatal:', err);
  process.exit(1);
});
