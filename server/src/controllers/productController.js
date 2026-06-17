const prisma = require('../../lib/prisma');

// @desc  Get all products
// @route GET /api/products
const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { id: true, name: true } } }
    });
    return res.status(200).json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Get product by barcode
// @route GET /api/products/barcode/:barcode
const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findUnique({
      where: { barcode },
      include: { category: { select: { name: true } } }
    });
    if (!product) return res.status(404).json({ message: 'Product not found for this barcode' });
    return res.status(200).json(product);
  } catch (error) {
    console.error('Get product by barcode error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc  Create product
// @route POST /api/products
const createProduct = async (req, res) => {
  try {
    const { name, barcode, price, stock, unit, categoryId } = req.body;
    if (!name || !barcode) {
      return res.status(400).json({ message: 'Name and barcode are required' });
    }
    const product = await prisma.product.create({
      data: {
        name,
        barcode,
        price: parseFloat(price) || 0,
        stock: parseFloat(stock) || 0,
        unit: unit || 'pcs',
        categoryId: categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } }
    });
    return res.status(201).json(product);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Barcode already exists' });
    console.error('Create product error:', error);
    return res.status(500).json({ message: 'Server error creating product' });
  }
};

// @desc  Update product
// @route PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, barcode, price, stock, unit, categoryId } = req.body;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        barcode,
        price: parseFloat(price) || 0,
        stock: parseFloat(stock) || 0,
        unit: unit || 'pcs',
        categoryId: categoryId || null,
      },
      include: { category: { select: { id: true, name: true } } }
    });
    return res.status(200).json(product);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Barcode already exists' });
    console.error('Update product error:', error);
    return res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc  Bulk delete products
// @route DELETE /api/products
const deleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Product IDs are required' });
    }
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    return res.status(200).json({ message: 'Products deleted successfully' });
  } catch (error) {
    console.error('Delete products error:', error);
    return res.status(500).json({ message: 'Server error deleting products' });
  }
};

module.exports = { getProducts, getProductByBarcode, createProduct, updateProduct, deleteProducts };
