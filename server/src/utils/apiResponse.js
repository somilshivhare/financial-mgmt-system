const apiSuccess = (data = null, message = 'ok') => {
  let serializableData = data;
  if (data !== null && data !== undefined) {
    try {
      const stringified = JSON.stringify(data);
      if (stringified.length > 1024 * 1024) {
        console.warn(`[apiResponse] Large response detected: ${Math.round(stringified.length / 1024)} KB`);
      }
    } catch (error) {
      console.error('[apiResponse] Data is not JSON-serializable:', error);
      if (data && typeof data === 'object') {
        serializableData = { 
          error: 'Response data contains non-serializable values',
          type: typeof data,
          keys: Object.keys(data).slice(0, 10)
        };
      } else {
        serializableData = String(data);
      }
    }
  }
  
  return {
    success: true,
    message: String(message || 'ok'),
    data: serializableData,
  };
};

const apiError = (message, code = 'ERR_GENERIC', data = null) => {
  const safeMessage = String(message || 'An error occurred');
  
  let serializableData = null;
  if (data !== null && data !== undefined) {
    try {
      JSON.stringify(data);
      serializableData = data;
    } catch (error) {
      console.error('[apiResponse] Error data is not JSON-serializable:', error);
      serializableData = { 
        error: 'Error details contain non-serializable values',
        originalType: typeof data
      };
    }
  }
  
  const response = {
    success: false,
    code: String(code || 'ERR_GENERIC'),
    message: safeMessage,
  };
  
  if (serializableData !== null) {
    response.data = serializableData;
  }
  
  return response;
};

module.exports = { apiSuccess, apiError };