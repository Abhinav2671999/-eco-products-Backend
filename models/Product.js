const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    category: {
      type: String,
      trim: true,
      default: 'general',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
