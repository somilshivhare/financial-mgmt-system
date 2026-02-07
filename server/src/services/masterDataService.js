const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/query');

const parseJson = (value) => {
  if (value == null) return null;
  if (typeof value === 'object' && value !== null && !Buffer.isBuffer(value)) return value;
  const str = Buffer.isBuffer(value) ? value.toString('utf8') : (typeof value === 'string' ? value : String(value));
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
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

const mapValuesToColumns = (values) => {
  if (!values || typeof values !== 'object') return {};
  
  return {
    name: values.payerName || values.consigneeName || values.companyName || values.customerName || values.nameOfEmployee || values.name || null,
    address: values.payerAddress || values.consigneeAddress || values.corporateOfficeAddress || values.correspondenceAddress || values.address || null,
    city: values.city || values.corporateDistrict || values.correspondenceDistrict || null,
    state: values.state || values.corporateState || values.correspondenceState || null,
    country: values.country || values.corporateCountry || values.correspondenceCountry || null,
    gst_no: values.payerGSTNo || values.consigneeGSTNo || values.gstNo || values.otherOfficeGST || null,
    contact_person: values.contactPersonName || values.poIssuingAuthority || null,
    contact_number: values.contactNumber || values.contactPersonContactNo || values.contactNo || null,
    email: values.emailId || values.customerEmail || null,
    designation: values.designation || null,
  };
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

const getMasterDataByType = async (type, userId, { companyId = null, status = null } = {}) => {
  if (!type) return [];
  if (!userId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  try {
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
    return (records || []).map(normalizeMasterDataRecord);
  } catch (err) {
    console.error('[MasterDataService] getMasterDataByType failed:', err.code || err.message, { type, userId: userId?.substring?.(0, 8) });
    return [];
  }
};

const getMasterDataById = async (type, id, userId) => {
  try {
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
  } catch (err) {
    console.error('[MasterDataService] getMasterDataById failed:', err.code || err.message, { type, id: id?.substring?.(0, 8) });
    return null;
  }
};

const saveMasterDataRecord = async (type, { values, logoPreviews, companyId, status }, userId) => {
  const id = uuidv4();
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const needsCompany = type && type !== 'company-profile';
  const validatedCompanyId = needsCompany ? await assertCompanyAccess(companyId, safeUserId) : null;
  
  const safeValues = values || {};
  const safeLogoPreviews = logoPreviews || {};

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

  if (Object.keys(cleanLogoPreviews).length > 0) {
    console.log('[MasterDataService] Saving logoPreviews:', Object.keys(cleanLogoPreviews).join(', '))
  }

  const nextStatus = normalizeStatus(status);
  const coreCols = mapValuesToColumns(combinedData);

  try {
    const valuesJson = JSON.stringify(combinedData);
    
    const parsedCheck = JSON.parse(valuesJson);
    if (parsedCheck.logoPreviews && Object.keys(parsedCheck.logoPreviews).length > 0) {
      console.log('[MasterDataService] Saving record with logoPreviews:', Object.keys(parsedCheck.logoPreviews).join(', '));
    }
    
    await query(
      `INSERT INTO master_data (
        id, type, company_id, status, \`values\`, created_by, updated_by,
        name, address, city, state, country, gst_no, contact_person, contact_number, email, designation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, type, validatedCompanyId, nextStatus, valuesJson, safeUserId, safeUserId,
        coreCols.name, coreCols.address, coreCols.city, coreCols.state, coreCols.country, 
        coreCols.gst_no, coreCols.contact_person, coreCols.contact_number, coreCols.email, coreCols.designation
      ]
    );

    return getMasterDataById(type, id, safeUserId);
  } catch (error) {
    if (error.errno === 1452 || error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw createHttpError(400, 'ERR_USER_NOT_FOUND', 'User not found. Please log out and log in again.');
    }
    
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
  
  const needsCompany = type && type !== 'company-profile';
  if (needsCompany) {
    const validatedCompanyId = await assertCompanyAccess(companyId || existing.companyId, safeUserId);
    if (existing.companyId && validatedCompanyId !== existing.companyId) {
      throw createHttpError(400, 'ERR_COMPANY_MISMATCH', 'Record cannot be moved to a different company');
    }
  }

  const updatedValues = { ...existing.values, ...values };
  if (logoPreviews && typeof logoPreviews === 'object') {
    const existingLogoPreviews = existing.values?.logoPreviews || {};
    updatedValues.logoPreviews = { ...existingLogoPreviews, ...logoPreviews };
    
    if (Object.keys(logoPreviews).length > 0) {
      console.log('[MasterDataService] Updating logoPreviews:', Object.keys(logoPreviews).join(', '))
    }
  } else if (existing.values?.logoPreviews) {
    updatedValues.logoPreviews = existing.values.logoPreviews;
  }
  
  const valuesJson = JSON.stringify(updatedValues);
  
  const parsedCheck = JSON.parse(valuesJson);
  if (parsedCheck.logoPreviews && Object.keys(parsedCheck.logoPreviews).length > 0) {
    console.log('[MasterDataService] Updating record with logoPreviews:', Object.keys(parsedCheck.logoPreviews).join(', '));
  }
  
  const nextStatus = status ? normalizeStatus(status) : existing.status || 'published';
  const coreCols = mapValuesToColumns(updatedValues);

  await query(
    `UPDATE master_data SET 
      \`values\` = ?, 
      status = ?, 
      updated_by = ?, 
      updated_at = NOW(),
      name = ?, 
      address = ?, 
      city = ?, 
      state = ?, 
      country = ?, 
      gst_no = ?, 
      contact_person = ?, 
      contact_number = ?, 
      email = ?, 
      designation = ?
    WHERE type = ? AND id = ? AND (created_by = ? OR updated_by = ?)`,
    [
      valuesJson, nextStatus, safeUserId, 
      coreCols.name, coreCols.address, coreCols.city, coreCols.state, coreCols.country, 
      coreCols.gst_no, coreCols.contact_person, coreCols.contact_number, coreCols.email, coreCols.designation,
      type, id, safeUserId, safeUserId
    ]
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

const getLatestMasterDataByType = async (type, userId = null, companyId = null, status = null) => {
  try {
    let sql = 'SELECT id, type, company_id AS companyId, status, `values`, created_by, updated_by, created_at, updated_at FROM master_data WHERE type = ?';
    const params = [type];

    if (userId) {
      sql += ' AND (created_by = ? OR updated_by = ?)';
      params.push(userId, userId);
    }

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
  } catch (err) {
    console.error('[MasterDataService] getLatestMasterDataByType failed:', err.code || err.message, { type });
    return null;
  }
};

const upsertMasterDataRecord = async (type, { values, logoPreviews, id, companyId, status }, userId) => {
  const safeValues = values || {};
  const safeLogoPreviews = logoPreviews || {};
  const safeUserId = userId || null;
  if (!safeUserId) {
    throw createHttpError(401, 'ERR_UNAUTHORIZED', 'Authentication required');
  }

  const needsCompany = type && type !== 'company-profile';
  const validatedCompanyId = needsCompany ? await assertCompanyAccess(companyId, safeUserId) : null;
  
  const cleanValues = Object.entries(safeValues).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
  
  const processedLogoPreviews = typeof safeLogoPreviews === 'object' && safeLogoPreviews !== null
    ? toSerializable(safeLogoPreviews)
    : {};
  
  const combinedData = {
    ...cleanValues,
    logoPreviews: processedLogoPreviews || {},
  };

  if (Object.keys(processedLogoPreviews).length > 0) {
    console.log('[MasterDataService] Upserting logoPreviews:', Object.keys(processedLogoPreviews).join(', '))
  }
  
  const valuesJson = JSON.stringify(combinedData);
  const nextStatus = normalizeStatus(status);
  
  const singleRecordTypes = ['customer-profile']; // Only customer-profile updates existing
  const isSingleRecordType = singleRecordTypes.includes(type);
  
  if (isSingleRecordType) {
    const existing = await getLatestMasterDataByType(type, safeUserId, validatedCompanyId, nextStatus);
    
    if (existing) {
      const updatedValues = { ...existing.values, ...combinedData };
      const updatedJson = JSON.stringify(updatedValues);
      const coreCols = mapValuesToColumns(updatedValues);
      
      await query(
        `UPDATE master_data SET 
          \`values\` = ?, 
          status = ?, 
          updated_by = ?, 
          updated_at = NOW(),
          name = ?, address = ?, city = ?, state = ?, country = ?, 
          gst_no = ?, contact_person = ?, contact_number = ?, email = ?, designation = ?
        WHERE id = ? AND (created_by = ? OR updated_by = ?)`,
        [
          updatedJson, nextStatus, safeUserId, 
          coreCols.name, coreCols.address, coreCols.city, coreCols.state, coreCols.country,
          coreCols.gst_no, coreCols.contact_person, coreCols.contact_number, coreCols.email, coreCols.designation,
          existing.id, safeUserId, safeUserId
        ]
      );
      
      return getMasterDataById(type, existing.id, safeUserId);
    }
  }
  
  const coreCols = mapValuesToColumns(combinedData);

  try {
    if (id) {
      const existing = await getMasterDataById(type, id, safeUserId);
      if (existing) {
        if (needsCompany && existing.companyId && validatedCompanyId !== existing.companyId) {
          throw createHttpError(400, 'ERR_COMPANY_MISMATCH', 'Record cannot be moved to a different company');
        }
        const updatedValues = { ...existing.values, ...combinedData };
        const updatedJson = JSON.stringify(updatedValues);
        const upCoreCols = mapValuesToColumns(updatedValues);
        
        await query(
          `UPDATE master_data SET 
            \`values\` = ?, 
            status = ?, 
            updated_by = ?, 
            updated_at = NOW(),
            name = ?, address = ?, city = ?, state = ?, country = ?, 
            gst_no = ?, contact_person = ?, contact_number = ?, email = ?, designation = ?
          WHERE id = ? AND (created_by = ? OR updated_by = ?)`,
          [
            updatedJson, nextStatus, safeUserId, 
            upCoreCols.name, upCoreCols.address, upCoreCols.city, upCoreCols.state, upCoreCols.country,
            upCoreCols.gst_no, upCoreCols.contact_person, upCoreCols.contact_number, upCoreCols.email, upCoreCols.designation,
            id, safeUserId, safeUserId
          ]
        );
        
        return getMasterDataById(type, id, safeUserId);
      }
    }
    
    const newId = id || uuidv4();
    await query(
      `INSERT INTO master_data (
        id, type, company_id, status, \`values\`, created_by, updated_by,
        name, address, city, state, country, gst_no, contact_person, contact_number, email, designation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, type, validatedCompanyId, nextStatus, valuesJson, safeUserId, safeUserId,
        coreCols.name, coreCols.address, coreCols.city, coreCols.state, coreCols.country, 
        coreCols.gst_no, coreCols.contact_person, coreCols.contact_number, coreCols.email, coreCols.designation
      ]
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

const getAggregatedMasterDataByCompany = async (companyId, userId, { status = 'published' } = {}) => {
  if (!companyId || !userId) {
    return null;
  }
  
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

const getAllAggregatedMasterData = async (userId) => {
  if (!userId) {
    return [];
  }
  
  try {
    const userCompanies = await getMasterDataByType('company-profile', userId);
    
    if (userCompanies.length === 0) {
      return [];
    }
    
    const aggregatedSets = await Promise.all(
      userCompanies.map(company => getAggregatedMasterDataByCompany(company.id, userId, { status: company.status }))
    );
    
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
  const draftValues = normalizedPublished.values || {};
  const draftValuesJson = JSON.stringify(draftValues);
  const companyCoreCols = mapValuesToColumns(draftValues);

  await query(
    `INSERT INTO master_data (
      id, type, company_id, status, \`values\`, created_by, updated_by,
      name, address, city, state, country, gst_no, contact_person, contact_number, email, designation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      draftCompanyId, 'company-profile', normalizedPublished.id, 'draft', draftValuesJson, safeUserId, safeUserId,
      companyCoreCols.name, companyCoreCols.address, companyCoreCols.city, companyCoreCols.state, companyCoreCols.country,
      companyCoreCols.gst_no, companyCoreCols.contact_person, companyCoreCols.contact_number, companyCoreCols.email, companyCoreCols.designation
    ]
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
    const latestValues = latest.values || {};
    const valuesJson = JSON.stringify(latestValues);
    const itemCoreCols = mapValuesToColumns(latestValues);
    
    await query(
      `INSERT INTO master_data (
        id, type, company_id, status, \`values\`, created_by, updated_by,
        name, address, city, state, country, gst_no, contact_person, contact_number, email, designation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draftId, type, draftCompanyId, 'draft', valuesJson, safeUserId, safeUserId,
        itemCoreCols.name, itemCoreCols.address, itemCoreCols.city, itemCoreCols.state, itemCoreCols.country,
        itemCoreCols.gst_no, itemCoreCols.contact_person, itemCoreCols.contact_number, itemCoreCols.email, itemCoreCols.designation
      ]
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

