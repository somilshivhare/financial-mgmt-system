const apiSuccess = (data = null, message = 'ok') => {
  // Ensure data is JSON-serializable
  let serializableData = data;
  if (data !== null && data !== undefined) {
    try {
      // Test if data can be serialized
      const stringified = JSON.stringify(data);
      // If it's a very large response, we might want to know
      if (stringified.length > 1024 * 1024) {
        console.warn(`[apiResponse] Large response detected: ${Math.round(stringified.length / 1024)} KB`);
      }
    } catch (error) {
      console.error('[apiResponse] Data is not JSON-serializable:', error);
      // Convert to a safe format
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
  // Ensure message is a string
  const safeMessage = String(message || 'An error occurred');
  
  // Ensure data is JSON-serializable if provided
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