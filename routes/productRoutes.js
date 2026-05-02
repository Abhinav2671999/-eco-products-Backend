const express = require('express');
const upload = require('../middleware/upload');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
