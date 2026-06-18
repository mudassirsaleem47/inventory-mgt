const prisma = require('../../lib/prisma');

// @desc  Get consolidated dashboard statistics
// @route GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const [products, sales, categories, suppliers, settings, supplierInvoices, expenses, loans] = await Promise.all([
      prisma.product.findMany({
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.saleTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        include: { items: true }
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.setting.findUnique({
        where: { id: 'default' }
      }),
      prisma.supplierInvoice.findMany({
        orderBy: { createdAt: 'desc' },
        include: { supplier: true, warehouse: true, items: true }
      }),
      prisma.expense.findMany({
        orderBy: { date: 'desc' }
      }),
      prisma.loan.findMany({
        orderBy: { dueDate: 'asc' }
      })
    ]);

    return res.status(200).json({
      products: products || [],
      sales: sales || [],
      categories: categories || [],
      suppliers: suppliers || [],
      settings: settings || null,
      supplierInvoices: supplierInvoices || [],
      expenses: expenses || [],
      loans: loans || []
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
};

module.exports = {
  getDashboardStats
};
