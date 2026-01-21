const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const listCustomers = async ({ page = 1, pageSize = 20, q }) => {
  const offset = (page - 1) * pageSize;
  const search = q ? `%${q}%` : '%';
  const [data, [{ total }]] = await Promise.all([
    query(
      'SELECT * FROM customers WHERE name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [search, Number(pageSize), Number(offset)],
    ),
    query('SELECT COUNT(*) as total FROM customers WHERE name LIKE ?', [search]),
  ]);
  return { data, page: Number(page), pageSize: Number(pageSize), total };
};

const createCustomer = async (payload) => {
  const id = uuidv4();
  await query(
    'INSERT INTO customers (id, name, contact_email, contact_phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, payload.name, payload.contactEmail || null, payload.contactPhone || null, payload.address || null, payload.status || 'active'],
  );
  const [customer] = await query('SELECT * FROM customers WHERE id = ?', [id]);
  return customer;
};

const updateCustomer = async (id, payload) => {
  await query(
    `UPDATE customers SET name = ?, contact_email = ?, contact_phone = ?, address = ?, status = ?, updated_at = NOW()
     WHERE id = ?`,
    [payload.name, payload.contactEmail || null, payload.contactPhone || null, payload.address || null, payload.status || 'active', id],
  );
  const [customer] = await query('SELECT * FROM customers WHERE id = ?', [id]);
  return customer;
};

const listProducts = async ({ page = 1, pageSize = 20, q }) => {
  const offset = (page - 1) * pageSize;
  const search = q ? `%${q}%` : '%';
  const [data, [{ total }]] = await Promise.all([
    query(
      'SELECT * FROM products WHERE name LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [search, Number(pageSize), Number(offset)],
    ),
    query('SELECT COUNT(*) as total FROM products WHERE name LIKE ?', [search]),
  ]);
  return { data, page: Number(page), pageSize: Number(pageSize), total };
};

const createProduct = async (payload) => {
  const id = uuidv4();
  await query(
    'INSERT INTO products (id, name, sku, unit, unit_price, status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, payload.name, payload.sku || null, payload.unit || null, payload.unitPrice, payload.status || 'active'],
  );
  const [product] = await query('SELECT * FROM products WHERE id = ?', [id]);
  return product;
};

const updateProduct = async (id, payload) => {
  await query(
    `UPDATE products SET name = ?, sku = ?, unit = ?, unit_price = ?, status = ?, updated_at = NOW()
     WHERE id = ?`,
    [payload.name, payload.sku || null, payload.unit || null, payload.unitPrice, payload.status || 'active', id],
  );
  const [product] = await query('SELECT * FROM products WHERE id = ?', [id]);
  return product;
};

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  listProducts,
  createProduct,
  updateProduct,
};

