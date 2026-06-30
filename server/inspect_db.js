const prisma = require('./lib/prisma');

async function main() {
  try {
    const products = await prisma.product.findMany();
    const sales = await prisma.saleTransaction.findMany({ include: { items: true } });
    const categories = await prisma.category.findMany();
    const suppliers = await prisma.supplier.findMany();
    const supplierInvoices = await prisma.supplierInvoice.findMany({ include: { items: true } });
    const expenses = await prisma.expense.findMany();
    const loans = await prisma.loan.findMany();
    const customers = await prisma.customer.findMany();

    console.log('PRODUCTS COUNT:', products.length);
    console.log('SALES COUNT:', sales.length);
    console.log('CATEGORIES COUNT:', categories.length);
    console.log('SUPPLIERS COUNT:', suppliers.length);
    console.log('SUPPLIER INVOICES COUNT:', supplierInvoices.length);
    console.log('EXPENSES COUNT:', expenses.length);
    console.log('LOANS COUNT:', loans.length);
    console.log('CUSTOMERS COUNT:', customers.length);

    // Sums
    const totalSalesAmount = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSalesPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalSalesDiscount = sales.reduce((sum, s) => sum + s.discount, 0);
    console.log('TOTAL SALES AMOUNT (REVENUE):', totalSalesAmount);
    console.log('TOTAL SALES PAID:', totalSalesPaid);
    console.log('TOTAL SALES DISCOUNT:', totalSalesDiscount);

    // Supplier Invoices Sums
    const totalInvAmount = supplierInvoices.reduce((sum, s) => sum + s.grandTotal, 0);
    const totalInvPaid = supplierInvoices.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalInvDue = supplierInvoices.reduce((sum, s) => sum + s.due, 0);
    console.log('TOTAL SUPPLIER INVOICE GRAND TOTAL:', totalInvAmount);
    console.log('TOTAL SUPPLIER INVOICE PAID:', totalInvPaid);
    console.log('TOTAL SUPPLIER INVOICE DUE:', totalInvDue);

    // Stock
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    console.log('TOTAL STOCK UNITS:', totalStock);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
