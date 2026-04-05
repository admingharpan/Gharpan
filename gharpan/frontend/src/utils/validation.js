// Validation utility for forms - NO REQUIRED FIELDS, only format validation
export const registrationFormRules = {
  // No required rules - all fields are optional
  // Only format validation for better UX
  
  mobileNo: {
    pattern: /^[6-9]\d{9}$/,
    message: 'Mobile number should be 10 digits starting with 6-9'
  },

  pincode: {
    pattern: /^\d{6}$/,
    message: 'PIN code should be exactly 6 digits'
  },

  phoneNumber: {
    pattern: /^\d{10}$/,
    message: 'Phone number should be 10 digits'
  },

  alternativeContact: {
    pattern: /^\d{10}$/,
    message: 'Alternative contact should be 10 digits'
  },

  emergencyContactNumber: {
    pattern: /^\d{10}$/,
    message: 'Emergency contact number should be 10 digits'
  },

  informerMobile: {
    pattern: /^\d{10}$/,
    message: 'Informer mobile number should be 10 digits'
  },

  driverMobile: {
    pattern: /^\d{10}$/,
    message: 'Driver mobile number should be 10 digits'
  },
  
  age: {
    pattern: /^\d+$/,
    min: 0,
    max: 150,
    message: 'Age should be a valid number between 0-150'
  },
  
  weight: {
    pattern: /^\d*\.?\d+$/,
    message: 'Weight should be a valid number (e.g., 65.5)'
  },
  
  height: {
    pattern: /^\d*\.?\d+$/,
    message: 'Height should be a valid number (e.g., 170.5)'
  },
  
  voterId: {
    pattern: /^[A-Z]{3}[0-9]{7}$/,
    message: 'Voter ID should be in format: ABC1234567'
  },
  
  aadhaarNumber: {
    pattern: /^\d{12}$/,
    message: 'Aadhaar should be 12 digits'
  },

  emailAddress: {
    pattern: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
    message: 'Please enter a valid email address'
  },

  category: {
    pattern: /^(Other|Emergency|Routine)$/,
    message: 'Category should be Other, Emergency, or Routine'
  },

  bodyTemperature: {
    pattern: /^\d*\.?\d+$/,
    min: 30,
    max: 45,
    message: 'Body temperature should be between 30 and 45 degree C'
  },

  heartRate: {
    pattern: /^\d+$/,
    min: 30,
    max: 200,
    message: 'Heart rate should be between 30 and 200 BPM'
  },

  respiratoryRate: {
    pattern: /^\d+$/,
    min: 5,
    max: 40,
    message: 'Respiratory rate should be between 5 and 40'
  },

  itemAmount: {
    pattern: /^\d*\.?\d+$/,
    min: 0,
    message: 'Item amount cannot be negative'
  },

  videoUrl: {
    pattern: /^https?:\/\/.+/,
    message: 'Video URL should start with http:// or https://'
  }
};

const phoneFields = new Set([
  'mobileNo',
  'phoneNumber',
  'alternativeContact',
  'emergencyContactNumber',
  'informerMobile',
  'driverMobile'
]);

export const normalizePhoneNumber = (value) => {
  if (value === null || value === undefined) return '';

  let digits = String(value).replace(/\D/g, '');

  // Handle commonly entered prefixes like +91XXXXXXXXXX or 0XXXXXXXXXX.
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Keep input manageable while user is typing.
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }

  return digits;
};

// Validate individual field - only format, no required validation
export const validateField = (name, value, rules = registrationFormRules) => {
  if (!rules[name]) {
    return { isValid: true, error: '' };
  }

  const normalizedValue = phoneFields.has(name)
    ? normalizePhoneNumber(value)
    : String(value ?? '').trim();

  if (!normalizedValue) {
    return { isValid: true, error: '' };
  }

  const rule = rules[name];
  
  // Pattern validation
  if (rule.pattern && !rule.pattern.test(normalizedValue)) {
    return { isValid: false, error: rule.message };
  }
  
  // Min/Max validation for numbers
  if (rule.min !== undefined && parseFloat(normalizedValue) < rule.min) {
    return { isValid: false, error: rule.message };
  }
  
  if (rule.max !== undefined && parseFloat(normalizedValue) > rule.max) {
    return { isValid: false, error: rule.message };
  }
  
  return { isValid: true, error: '' };
};

// Validate entire form - returns warnings, not errors since nothing is required
export const validateForm = (data, rules = registrationFormRules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(data).forEach(key => {
    const validation = validateField(key, data[key], rules);
    if (!validation.isValid) {
      errors[key] = validation.error;
      isValid = false;
    }
  });
  
  return { isValid, errors };
};

// Auto-save utility
export const saveFormDraft = (formData) => {
  try {
    const timestamp = new Date().toISOString();
    const draftData = {
      ...formData,
      lastSaved: timestamp,
      isDraft: true
    };
    localStorage.setItem('registrationFormDraft', JSON.stringify(draftData));
    return { success: true, timestamp };
  } catch (error) {
    console.error('Failed to save draft:', error);
    return { success: false, error };
  }
};

// Load draft utility
export const loadFormDraft = () => {
  try {
    const draft = localStorage.getItem('registrationFormDraft');
    if (draft) {
      return JSON.parse(draft);
    }
    return null;
  } catch (error) {
    console.error('Failed to load draft:', error);
    return null;
  }
};

// Clear draft utility
export const clearFormDraft = () => {
  try {
    localStorage.removeItem('registrationFormDraft');
    return true;
  } catch (error) {
    console.error('Failed to clear draft:', error);
    return false;
  }
};

