const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('../models/Product');

const buildImageUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/uploads/${filename}`;

const serializeProduct = (req, product) => {
  const obj = product.toObject({ versionKey: false });
  obj.imageUrl = obj.image ? buildImageUrl(req, obj.image) : null;
  return obj;
};

const removeImageFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  fs.unlink(filePath, () => {});
};

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, limit, sort } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
    };
    const sortBy = sortMap[sort] || { createdAt: -1 };

    let query = Product.find(filter).sort(sortBy);
    if (limit && !Number.isNaN(Number(limit))) query = query.limit(Number(limit));

    const products = await query.exec();
    res.json({
      count: products.length,
      products: products.map((p) => serializeProduct(req, p)),
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(serializeProduct(req, product));
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }
    if (!name || !description || price === undefined) {
      removeImageFile(req.file.filename);
      return res
        .status(400)
        .json({ message: 'name, description and price are required' });
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      removeImageFile(req.file.filename);
      return res.status(400).json({ message: 'price must be a positive number' });
    }

    const product = await Product.create({
      name,
      description,
      price: numericPrice,
      category: category || 'general',
      image: req.file.filename,
    });

    res.status(201).json(serializeProduct(req, product));
  } catch (err) {
    if (req.file) removeImageFile(req.file.filename);
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, category } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        if (req.file) removeImageFile(req.file.filename);
        return res.status(400).json({ message: 'price must be a positive number' });
      }
      product.price = numericPrice;
    }

    if (req.file) {
      const oldImage = product.image;
      product.image = req.file.filename;
      removeImageFile(oldImage);
    }

    await product.save();
    res.json(serializeProduct(req, product));
  } catch (err) {
    if (req.file) removeImageFile(req.file.filename);
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    removeImageFile(product.image);
    res.json({ message: 'Product deleted', id: product._id });
  } catch (err) {
    next(err);
  }
};
