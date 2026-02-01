const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const parseJson = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

const normalizeMasterDataRecord = (record) => {
  if (!record) return null;
  return {
    id: record.id,
    type: record.type,
    companyId: record.companyId ?? record.company_id ?? null,
    status: record.status || 'published',
    values: parseJson(record.values),
    created_by: record.created_by,
    updated_by: record.updated_by,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
};

const createHttpError = (status, code, message) => {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
};

const assertCompanyAccess = async (companyId, userId) => {
  if (!companyId) {
    throw createHttpError(400, 'ERR_MISSING_COMPANY', 'companyId is required');
  }
  const [company] = await query(
    `SELECT id
     FROM master_data
     WHERE id = ?
       AND type = 'company-profile'
       AND (created_by = ? OR updated_by = ?)
     LIMIT 1`,
    [companyId, userId, userId],
  );
  if (!company) {
    throw createHttpError(400, 'ERR_INVALID_COMPANY', 'Invalid companyId for current user');
  }
  return company.id;
};

const normalizeStatus = (status) => {
  if (!status) return 'published';
  const normalized = String(status).toLowerCase().trim();
  return ['draft', 'published', 'archived'].includes(normalized) ? normalized : 'published';
};

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
const getMasterDataByType = async (type, userId, { companyId = null, status = null } = {}) => {
  if (!type) return [];
  if (!userId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  let sql = `
    SELECT id, type, company_id AS companyId, status, \`values\`, created_by, updated_by, created_at, updated_at
    FROM master_data
    WHERE type = ?
      AND (created_by = ? OR updated_by = ?)
  `;
  const params = [type, userId, userId];

  if (companyId && type !== 'company-profile') {
    sql += ' AND company_id = ?';
    params.push(companyId);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(normalizeStatus(status));
  }

  sql += ' ORDER BY created_at DESC';

  const records = await query(sql, params);
  return records.map(normalizeMasterDataRecord);
};

const getMasterDataById = async (type, id, userId) => {
  const [record] = await query(
    `SELECT id, type, company_id AS companyId, status, \`values\`, created_by, updated_by, created_at, updated_at
     FROM master_data
     WHERE type = ?
       AND id = ?
       AND (created_by = ? OR updated_by = ?)
     LIMIT 1`,
    [type, id, userId, userId]
  );
  return normalizeMasterDataRecord(record);
};

const saveMasterDataRecord = async (type, { values, logoPreviews, companyId, status }, userId) => {
  const id = uuidv4();
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const needsCompany = type && type !== 'company-profile';
  const validatedCompanyId = needsCompany ? await assertCompanyAccess(companyId, safeUserId) : null;
  
  // Ensure values is an object and handle null/undefined safely
  const safeValues = values || {};
  const safeLogoPreviews = logoPreviews || {};

  // Keep only JSON-serializable values (strip File, function, undefined; avoid circular refs)
  const toSerializable = (val) => {
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
    if (typeof val === 'object' && val.constructor && val.constructor.name === 'File') return undefined;
    if (typeof val === 'function') return undefined;
    if (Array.isArray(val)) return val.map(toSerializable).filter((v) => v !== undefined);
    if (typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        const s = toSerializable(v);
        if (s !== undefined) out[k] = s;
      }
      return out;
    }
    return val;
  };
  const cleanValues = Object.entries(safeValues).reduce((acc, [key, value]) => {
    const s = toSerializable(value);
    if (s !== undefined) acc[key] = s;
    return acc;
  }, {});
  const cleanLogoPreviews = typeof safeLogoPreviews === 'object' && safeLogoPreviews !== null
    ? toSerializable(safeLogoPreviews)
    : {};

  const combinedData = {
    ...cleanValues,
    logoPreviews: cleanLogoPreviews || {},
  };

  try {
    const valuesJson = JSON.stringify(combinedData);
    await query(
      'INSERT INTO master_data (id, type, company_id, status, `values`, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, type, validatedCompanyId, nextStatus, valuesJson, safeUserId, safeUserId]
    );

    return getMasterDataById(type, id, safeUserId);
  } catch (error) {
    if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw createHttpError(400, 'ERR_USER_NOT_FOUND', 'User not found. Please log out and log in again.');
    }
    
    // Specifically log bad field errors which indicate missing migrations
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('[MasterDataService] MISSING MIGRATION DETECTED:', error.message);
      throw createHttpError(500, 'ERR_DATABASE_SCHEMA', `Database schema is outdated. Missing column in master_data table. Original error: ${error.message}`);
    }

    console.error('[MasterDataService] Error saving record:', {
      type,
      message: error.message,
      code: error.code,
      errno: error.errno,
      userId: safeUserId,
      valuesKeys: Object.keys(cleanValues),
    });
    throw error;
  }
};

const updateMasterDataRecord = async (type, id, { values, logoPreviews, companyId, status }, userId) => {
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const existing = await getMasterDataById(type, id, safeUserId);
  if (!existing) return null;
  
  // Company linkage rules:
  // - company-profile has no companyId
  // - other types must keep a stable companyId (cannot be moved between companies via update)
  const needsCompany = type && type !== 'company-profile';
  if (needsCompany) {
    const validatedCompanyId = await assertCompanyAccess(companyId || existing.companyId, safeUserId);
    if (existing.companyId && validatedCompanyId !== existing.companyId) {
      throw createHttpError(400, 'ERR_COMPANY_MISMATCH', 'Record cannot be moved to a different company');
    }
  }

  const updatedValues = { ...existing.values, ...values };
  if (logoPreviews) {
    updatedValues.logoPreviews = { ...(existing.values.logoPreviews || {}), ...logoPreviews };
  }
  
  const valuesJson = JSON.stringify(updatedValues);
  
  const nextStatus = status ? normalizeStatus(status) : existing.status || 'published';

  await query(
    'UPDATE master_data SET `values` = ?, status = ?, updated_by = ?, updated_at = NOW() WHERE type = ? AND id = ? AND (created_by = ? OR updated_by = ?)',
    [valuesJson, nextStatus, safeUserId, type, id, safeUserId, safeUserId]
  );
  
  return getMasterDataById(type, id, safeUserId);
};

const deleteMasterDataRecord = async (type, id, userId) => {
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }
  const result = await query(
    'DELETE FROM master_data WHERE type = ? AND id = ? AND (created_by = ? OR updated_by = ?)',
    [type, id, safeUserId, safeUserId]
  );
  return result.affectedRows > 0;
};

const searchMasterData = async (queryString, userId) => {
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }
  const searchPattern = `%${queryString}%`;
  const records = await query(
    `SELECT id, type, company_id AS companyId, status, \`values\`, created_at, updated_at 
     FROM master_data 
     WHERE (created_by = ? OR updated_by = ?)
       AND JSON_SEARCH(\`values\`, 'all', ?) IS NOT NULL 
     ORDER BY created_at DESC 
     LIMIT 100`,
    [safeUserId, safeUserId, searchPattern]
  );
  return records.map(normalizeMasterDataRecord);
};

/**
 * Get the latest/master record for a type (useful for single-record types like company-profile)
 * Returns the most recently created or updated record
 */
const getLatestMasterDataByType = async (type, userId = null, companyId = null, status = null) => {
  let sql = 'SELECT id, type, company_id AS companyId, status, `values`, created_by, updated_by, created_at, updated_at FROM master_data WHERE type = ?';
  const params = [type];
  
  // Optionally filter by user
  if (userId) {
    sql += ' AND (created_by = ? OR updated_by = ?)';
    params.push(userId, userId);
  }

  // Optionally filter by company (for non-company types)
  if (companyId && type !== 'company-profile') {
    sql += ' AND company_id = ?';
    params.push(companyId);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(normalizeStatus(status));
  }
  
  sql += ' ORDER BY updated_at DESC, created_at DESC LIMIT 1';
  
  const [record] = await query(sql, params);
  return normalizeMasterDataRecord(record);
};

/**
 * Upsert master data record - Insert if new, Update if exists
 * For single-record types (like company-profile), updates existing or creates new
 * For multi-record types, always creates new unless id is provided
 */
const upsertMasterDataRecord = async (type, { values, logoPreviews, id, companyId, status }, userId) => {
  const safeValues = values || {};
  const safeLogoPreviews = logoPreviews || {};
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const needsCompany = type && type !== 'company-profile';
  const validatedCompanyId = needsCompany ? await assertCompanyAccess(companyId, safeUserId) : null;
  
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
  const nextStatus = normalizeStatus(status);
  
  // Single-record types: update existing or create new
  // Note: company-profile is NOT in this list - it always creates new records to allow multiple master data entries
  const singleRecordTypes = ['customer-profile']; // Only customer-profile updates existing
  const isSingleRecordType = singleRecordTypes.includes(type);
  
  if (isSingleRecordType) {
    // Single per company: update existing record for this company, else create new
    const existing = await getLatestMasterDataByType(type, safeUserId, validatedCompanyId, nextStatus);
    
    if (existing) {
      // Update existing record
      const updatedValues = { ...existing.values, ...combinedData };
      const updatedJson = JSON.stringify(updatedValues);
      
      await query(
        'UPDATE master_data SET `values` = ?, status = ?, updated_by = ?, updated_at = NOW() WHERE id = ? AND (created_by = ? OR updated_by = ?)',
        [updatedJson, nextStatus, safeUserId, existing.id, safeUserId, safeUserId]
      );
      
      return getMasterDataById(type, existing.id, safeUserId);
    }
  }
  
  try {
    // If id provided, try to update
    if (id) {
      const existing = await getMasterDataById(type, id, safeUserId);
      if (existing) {
        if (needsCompany && existing.companyId && validatedCompanyId !== existing.companyId) {
          throw createHttpError(400, 'ERR_COMPANY_MISMATCH', 'Record cannot be moved to a different company');
        }
        const updatedValues = { ...existing.values, ...combinedData };
        const updatedJson = JSON.stringify(updatedValues);
        
        await query(
          'UPDATE master_data SET `values` = ?, status = ?, updated_by = ?, updated_at = NOW() WHERE id = ? AND (created_by = ? OR updated_by = ?)',
          [updatedJson, nextStatus, safeUserId, id, safeUserId, safeUserId]
        );
        
        return getMasterDataById(type, id, safeUserId);
      }
    }
    
    // Create new record
    const newId = id || uuidv4();
    await query(
      'INSERT INTO master_data (id, type, company_id, status, `values`, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newId, type, validatedCompanyId, nextStatus, valuesJson, safeUserId, safeUserId]
    );
    
    return getMasterDataById(type, newId, safeUserId);
  } catch (error) {
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.error('[MasterDataService] MISSING MIGRATION DETECTED in upsert:', error.message);
      throw createHttpError(500, 'ERR_DATABASE_SCHEMA', `Database schema is outdated. Missing column in master_data table. Original error: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Get aggregated master data for a specific company profile
 * Groups all steps (customer, consignee, payer, etc.) under one company
 */
const getAggregatedMasterDataByCompany = async (companyId, userId, { status = 'published' } = {}) => {
  if (!companyId || !userId) {
    return null;
  }
  
  // Get the company profile
  const companyRecord = await getMasterDataById('company-profile', companyId, userId);
  if (!companyRecord) {
    return null;
  }
  if (status && normalizeStatus(status) !== normalizeStatus(companyRecord.status)) {
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
  
  for (const type of types.slice(1)) { // Skip company-profile, already done
    try {
      const latest = await getLatestMasterDataByType(type, userId, companyId, status);
      if (latest) {
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
    status: normalizeStatus(status),
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
    // Get all company profiles for this user (published + draft)
    const userCompanies = await getMasterDataByType('company-profile', userId);
    
    if (userCompanies.length === 0) {
      return [];
    }
    
    // Get aggregated data for each company
    const aggregatedSets = await Promise.all(
      userCompanies.map(company => getAggregatedMasterDataByCompany(company.id, userId, { status: company.status }))
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

const getLatestDraftCompanyProfile = async (userId) => {
  const [record] = await query(
    `SELECT id, type, company_id AS companyId, status, \`values\`, created_by, updated_by, created_at, updated_at
     FROM master_data
     WHERE type = 'company-profile'
       AND status = 'draft'
       AND (created_by = ? OR updated_by = ?)
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [userId, userId],
  );
  return normalizeMasterDataRecord(record);
};

const getDraftCompanyProfileForPublished = async (publishedCompanyId, userId) => {
  const [record] = await query(
    `SELECT id, type, company_id AS companyId, status, \`values\`, created_by, updated_by, created_at, updated_at
     FROM master_data
     WHERE type = 'company-profile'
       AND status = 'draft'
       AND company_id = ?
       AND (created_by = ? OR updated_by = ?)
     ORDER BY updated_at DESC, created_at DESC
     LIMIT 1`,
    [publishedCompanyId, userId, userId],
  );
  return normalizeMasterDataRecord(record);
};

const createDraftFromPublished = async (publishedCompanyId, userId) => {
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const existingDraft = await getDraftCompanyProfileForPublished(publishedCompanyId, safeUserId);
  if (existingDraft) {
    return existingDraft;
  }

  const [publishedCompany] = await query(
    `SELECT id, type, company_id AS companyId, status, \`values\`, created_by, updated_by, created_at, updated_at
     FROM master_data
     WHERE id = ?
       AND type = 'company-profile'
       AND status = 'published'
       AND (created_by = ? OR updated_by = ?)
     LIMIT 1`,
    [publishedCompanyId, safeUserId, safeUserId],
  );

  const normalizedPublished = normalizeMasterDataRecord(publishedCompany);
  if (!normalizedPublished) {
    throw createHttpError(404, 'NOT_FOUND', 'Published company profile not found');
  }

  const draftCompanyId = uuidv4();
  const draftValuesJson = JSON.stringify(normalizedPublished.values || {});

  await query(
    'INSERT INTO master_data (id, type, company_id, status, `values`, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [draftCompanyId, 'company-profile', normalizedPublished.id, 'draft', draftValuesJson, safeUserId, safeUserId]
  );

  const types = [
    'customer-profile',
    'consignee-profile',
    'payer-profile',
    'employee-profile',
    'payment-terms',
  ];

  for (const type of types) {
    const latest = await getLatestMasterDataByType(type, safeUserId, normalizedPublished.id, 'published');
    if (!latest) continue;

    const draftId = uuidv4();
    const valuesJson = JSON.stringify(latest.values || {});
    await query(
      'INSERT INTO master_data (id, type, company_id, status, `values`, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [draftId, type, draftCompanyId, 'draft', valuesJson, safeUserId, safeUserId]
    );
  }

  return getMasterDataById('company-profile', draftCompanyId, safeUserId);
};

const getDraftAggregatedMasterData = async (draftCompanyId, userId) => {
  return getAggregatedMasterDataByCompany(draftCompanyId, userId, { status: 'draft' });
};

const publishDraftSet = async (draftCompanyId, userId) => {
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const draftCompany = await getMasterDataById('company-profile', draftCompanyId, safeUserId);
  if (!draftCompany || draftCompany.status !== 'draft') {
    throw createHttpError(404, 'NOT_FOUND', 'Draft company profile not found');
  }

  const publishedCompanyId = draftCompany.companyId || null;

  // Archive existing published set when editing a published company
  if (publishedCompanyId) {
    await query(
      `UPDATE master_data
       SET status = 'archived', updated_by = ?, updated_at = NOW()
       WHERE (id = ? OR company_id = ?)
         AND status = 'published'
         AND (created_by = ? OR updated_by = ?)`,
      [safeUserId, publishedCompanyId, publishedCompanyId, safeUserId, safeUserId]
    );
  }

  // Publish all draft records for this draft company id (company profile + linked steps)
  await query(
    `UPDATE master_data
     SET status = 'published', company_id = NULL, updated_by = ?, updated_at = NOW()
     WHERE id = ?
       AND status = 'draft'
       AND (created_by = ? OR updated_by = ?)`,
    [safeUserId, draftCompanyId, safeUserId, safeUserId]
  );

  await query(
    `UPDATE master_data
     SET status = 'published', updated_by = ?, updated_at = NOW()
     WHERE company_id = ?
       AND status = 'draft'
       AND (created_by = ? OR updated_by = ?)`,
    [safeUserId, draftCompanyId, safeUserId, safeUserId]
  );

  return getAggregatedMasterDataByCompany(draftCompanyId, safeUserId, { status: 'published' });
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
  getLatestDraftCompanyProfile,
  getDraftCompanyProfileForPublished,
  createDraftFromPublished,
  getDraftAggregatedMasterData,
  publishDraftSet,
};

