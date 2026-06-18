const prisma = require('./lib/prisma');

async function main() {
  const users = await prisma.user.findMany();
  const settings = await prisma.setting.findMany();
  const suppliers = await prisma.supplier.findMany();
  const categories = await prisma.category.findMany();
  const warehouses = await prisma.warehouse.findMany();
  const products = await prisma.product.findMany();
  const sales = await prisma.saleTransaction.findMany();
  const supplierInvoices = await prisma.supplierInvoice.findMany();
  const customers = await prisma.customer.findMany();
  const expenses = await prisma.expense.findMany();
  const loans = await prisma.loan.findMany();
  const staff = await prisma.staff.findMany();

  console.log('--- ALL TABLES ROW COUNTS ---');
  console.log('User:', users.length);
  console.log('Setting:', settings.length);
  console.log('Supplier:', suppliers.length);
  console.log('Category:', categories.length);
  console.log('Warehouse:', warehouses.length);
  console.log('Product:', products.length);
  console.log('SaleTransaction:', sales.length);
  console.log('SupplierInvoice:', supplierInvoices.length);
  console.log('Customer:', customers.length);
  console.log('Expense:', expenses.length);
  console.log('Loan:', loans.length);
  console.log('Staff:', staff.length);

  if (users.length > 0) console.log('Users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  if (customers.length > 0) console.log('Customers:', customers);
  if (expenses.length > 0) console.log('Expenses:', expenses);
  if (loans.length > 0) console.log('Loans:', loans);
  if (staff.length > 0) console.log('Staff:', staff);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
