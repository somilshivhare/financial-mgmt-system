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

// Generic Master Data Service Methods
const getMasterDataByType = async (type) => {
  const records = await query(
    'SELECT id, type, `values`, created_by, updated_by, created_at, updated_at FROM master_data WHERE type = ? ORDER BY created_at DESC',
    [type]
  );
  return records.map(record => ({
    id: record.id,
    type: record.type,
    values: typeof record.values === 'string' ? JSON.parse(record.values) : record.values,
    created_by: record.created_by,
    updated_by: record.updated_by,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }));
};

const getMasterDataById = async (type, id) => {
  const [record] = await query(
    'SELECT id, type, `values`, created_by, updated_by, created_at, updated_at FROM master_data WHERE type = ? AND id = ?',
    [type, id]
  );
  if (!record) return null;
  return {
    id: record.id,
    type: record.type,
    values: typeof record.values === 'string' ? JSON.parse(record.values) : record.values,
    created_by: record.created_by,
    updated_by: record.updated_by,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
};

const saveMasterDataRecord = async (type, { values, logoPreviews }, userId) => {
  const id = uuidv4();
  
  // Ensure values is an object and handle null/undefined safely
  const safeValues = values || {};
  const safeLogoPreviews = logoPreviews || {};
  
  // Clean up undefined values from the object (MySQL doesn't like undefined in JSON)
  const cleanValues = Object.entries(safeValues).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  // Combine values and logoPreviews into a single JSON object
  const combinedData = {
    ...cleanValues,
    logoPreviews: safeLogoPreviews,
  };
  
  const valuesJson = JSON.stringify(combinedData);
  
  // Ensure userId is not undefined (convert to null if needed for MySQL)
  const safeUserId = userId || null;
  
  try {
    await query(
      'INSERT INTO master_data (id, type, `values`, created_by, updated_by) VALUES (?, ?, ?, ?, ?)',
      [id, type, valuesJson, safeUserId, safeUserId]
    );
    
    return getMasterDataById(type, id);
  } catch (error) {
    console.error('[MasterDataService] Error saving record:', {
      type,
      error: error.message,
      errorCode: error.code,
      userId: safeUserId,
      valuesKeys: Object.keys(cleanValues),
    });
    throw error;
  }
};

const updateMasterDataRecord = async (type, id, { values, logoPreviews }, userId) => {
  const existing = await getMasterDataById(type, id);
  if (!existing) return null;
  
  const updatedValues = { ...existing.values, ...values };
  if (logoPreviews) {
    updatedValues.logoPreviews = { ...(existing.values.logoPreviews || {}), ...logoPreviews };
  }
  
  const valuesJson = JSON.stringify(updatedValues);
  
  await query(
    'UPDATE master_data SET `values` = ?, updated_by = ?, updated_at = NOW() WHERE type = ? AND id = ?',
    [valuesJson, userId, type, id]
  );
  
  return getMasterDataById(type, id);
};

const deleteMasterDataRecord = async (type, id) => {
  const result = await query(
    'DELETE FROM master_data WHERE type = ? AND id = ?',
    [type, id]
  );
  return result.affectedRows > 0;
};

const searchMasterData = async (queryString) => {
  const searchPattern = `%${queryString}%`;
  const records = await query(
    `SELECT id, type, \`values\`, created_at, updated_at 
     FROM master_data 
     WHERE JSON_SEARCH(\`values\`, 'all', ?) IS NOT NULL 
     ORDER BY created_at DESC 
     LIMIT 100`,
    [searchPattern]
  );
  return records.map(record => ({
    id: record.id,
    type: record.type,
    values: typeof record.values === 'string' ? JSON.parse(record.values) : record.values,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }));
};

/**
 * Get the latest/master record for a type (useful for single-record types like company-profile)
 * Returns the most recently created or updated record
 */
const getLatestMasterDataByType = async (type, userId = null) => {
  let sql = 'SELECT id, type, `values`, created_by, updated_by, created_at, updated_at FROM master_data WHERE type = ?';
  const params = [type];
  
  // Optionally filter by user
  if (userId) {
    sql += ' AND (created_by = ? OR updated_by = ?)';
    params.push(userId, userId);
  }
  
  sql += ' ORDER BY updated_at DESC, created_at DESC LIMIT 1';
  
  const [record] = await query(sql, params);
  if (!record) return null;
  
  return {
    id: record.id,
    type: record.type,
    values: typeof record.values === 'string' ? JSON.parse(record.values) : record.values,
    created_by: record.created_by,
    updated_by: record.updated_by,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
};

/**
 * Upsert master data record - Insert if new, Update if exists
 * For single-record types (like company-profile), updates existing or creates new
 * For multi-record types, always creates new unless id is provided
 */
const upsertMasterDataRecord = async (type, { values, logoPreviews, id }, userId) => {
  const safeValues = values || {};
  const safeLogoPreviews = logoPreviews || {};
  
  // Clean up undefined values
  const cleanValues = Object.entries(safeValues).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  // Combine values and logoPreviews
  const combinedData = {
    ...cleanValues,
    logoPreviews: safeLogoPreviews,
  };
  
  const valuesJson = JSON.stringify(combinedData);
  const safeUserId = userId || null;
  
  // Single-record types: update existing or create new
  // Note: company-profile is NOT in this list - it always creates new records to allow multiple master data entries
  const singleRecordTypes = ['customer-profile']; // Only customer-profile updates existing
  const isSingleRecordType = singleRecordTypes.includes(type);
  
  if (isSingleRecordType) {
    // Check if record exists for this user
    const existing = await getLatestMasterDataByType(type, userId);
    
    if (existing) {
      // Update existing record
      const updatedValues = { ...existing.values, ...combinedData };
      const updatedJson = JSON.stringify(updatedValues);
      
      await query(
        'UPDATE master_data SET `values` = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [updatedJson, safeUserId, existing.id]
      );
      
      return getMasterDataById(type, existing.id);
    }
  }
  
  // If id provided, try to update
  if (id) {
    const existing = await getMasterDataById(type, id);
    if (existing) {
      const updatedValues = { ...existing.values, ...combinedData };
      const updatedJson = JSON.stringify(updatedValues);
      
      await query(
        'UPDATE master_data SET `values` = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [updatedJson, safeUserId, id]
      );
      
      return getMasterDataById(type, id);
    }
  }
  
  // Create new record
  const newId = id || uuidv4();
  await query(
    'INSERT INTO master_data (id, type, `values`, created_by, updated_by) VALUES (?, ?, ?, ?, ?)',
    [newId, type, valuesJson, safeUserId, safeUserId]
  );
  
  return getMasterDataById(type, newId);
};

/**
 * Get aggregated master data for a specific company profile
 * Groups all steps (customer, consignee, payer, etc.) under one company
 */
const getAggregatedMasterDataByCompany = async (companyId, userId) => {
  if (!companyId || !userId) {
    return null;
  }
  
  // Get the company profile
  const companyRecord = await getMasterDataById('company-profile', companyId);
  if (!companyRecord || companyRecord.created_by !== userId) {
    return null;
  }
  
  const companyValues = companyRecord.values || {};
  const companyLogoPreviews = companyValues.logoPreviews || {};
  const { logoPreviews, ...cleanCompanyValues } = companyValues;
  
  const types = [
    'company-profile',
    'customer-profile',
    'consignee-profile',
    'payer-profile',
    'employee-profile',
    'payment-terms',
  ];
  
  const stepData = {
    'company-profile': {
      id: companyRecord.id,
      values: cleanCompanyValues,
      logoPreviews: companyLogoPreviews,
      updatedAt: companyRecord.updated_at || companyRecord.created_at,
    },
  };
  const completionStatus = {
    'company-profile': true,
  };
  
  let latestUpdated = new Date(companyRecord.updated_at || companyRecord.created_at);
  
  // For now, fetch all records of other types for this user
  // In the future, we can link them to company via a company_id field
  for (const type of types.slice(1)) { // Skip company-profile, already done
    try {
      const records = await getMasterDataByType(type);
      // Get the latest record for this user (for now, not filtered by company)
      const userRecords = records
        .filter(r => r.created_by === userId)
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      
      if (userRecords.length > 0) {
        const latest = userRecords[0];
        const latestValues = latest.values || {};
        const latestLogoPreviews = latestValues.logoPreviews || {};
        const { logoPreviews: lp, ...cleanValues } = latestValues;
        
        stepData[type] = {
          id: latest.id,
          values: cleanValues,
          logoPreviews: latestLogoPreviews,
          updatedAt: latest.updated_at || latest.created_at,
        };
        completionStatus[type] = true;
        
        const recordDate = new Date(latest.updated_at || latest.created_at);
        if (recordDate > latestUpdated) {
          latestUpdated = recordDate;
        }
      } else {
        completionStatus[type] = false;
        stepData[type] = null;
      }
    } catch (error) {
      console.error(`[MasterDataService] Error fetching ${type}:`, error);
      completionStatus[type] = false;
      stepData[type] = null;
    }
  }
  
  const completedSteps = Object.values(completionStatus).filter(Boolean).length;
  const totalSteps = types.length;
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);
  
  const primaryName = companyValues.companyName || 'Master Data Record';
  const primaryLogo = companyLogoPreviews.logo || null;
  
  return {
    id: companyId,
    companyId,
    userId,
    primaryName,
    primaryLogo,
    completionPercentage,
    completedSteps,
    totalSteps,
    completionStatus,
    stepData,
    lastUpdated: latestUpdated.toISOString(),
    createdAt: companyRecord.created_at,
  };
};

/**
 * Get all aggregated master data sets for a user
 * Returns an array of consolidated records, one per company-profile
 */
const getAllAggregatedMasterData = async (userId) => {
  if (!userId) {
    return [];
  }
  
  try {
    // Get all company profiles for this user
    const companyRecords = await getMasterDataByType('company-profile');
    const userCompanies = companyRecords.filter(r => r.created_by === userId);
    
    if (userCompanies.length === 0) {
      return [];
    }
    
    // Get aggregated data for each company
    const aggregatedSets = await Promise.all(
      userCompanies.map(company => getAggregatedMasterDataByCompany(company.id, userId))
    );
    
    // Filter out null results and sort by last updated (newest first)
    return aggregatedSets
      .filter(set => set !== null)
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  } catch (error) {
    console.error('[MasterDataService] Error getting all aggregated master data:', error);
    return [];
  }
};

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer,
  listProducts,
  createProduct,
  updateProduct,
  getMasterDataByType,
  getMasterDataById,
  getLatestMasterDataByType,
  saveMasterDataRecord,
  updateMasterDataRecord,
  upsertMasterDataRecord,
  deleteMasterDataRecord,
  searchMasterData,
  getAggregatedMasterData: getAllAggregatedMasterData, // Changed to return array of all sets
  getAggregatedMasterDataByCompany, // Get single company's aggregated data
};

