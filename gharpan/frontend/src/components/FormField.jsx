import React from 'react';

const FormField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  placeholder, 
  options = [], 
  helper,
  helpText,
  disabled = false,
  className = '',
  autoComplete = 'off',
  maxLength,
  min,
  max,
  accept,
  pattern,
  step
}) => {
  const helperText = helper || helpText;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select 
            name={name} 
            value={value} 
            onChange={onChange}
            className={`form-control ${error ? 'is-invalid' : ''}`}
            disabled={disabled}
          >
            <option value="">-- Please select --</option>
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea 
            name={name} 
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            className={`form-control ${error ? 'is-invalid' : ''}`}
            disabled={disabled}
            rows={4}
          />
        );
      
      case 'file':
        return (
          <input 
            type="file" 
            name={name} 
            onChange={onChange}
            className={`form-control ${error ? 'is-invalid' : ''}`}
            disabled={disabled}
            accept={accept}
          />
        );
      
      default:
        return (
          <input 
            type={type} 
            name={name} 
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
            disabled={disabled}
            autoComplete={autoComplete}
            maxLength={maxLength}
            min={min}
            max={max}
            pattern={pattern}
            step={step}
          />
        );
    }
  };

  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
        <small className="text-success ms-2"></small>
      </label>
      
      {renderInput()}
      
      {helperText && (
        <small className="form-text text-muted">{helperText}</small>
      )}
      
      {error && (
        <div className="invalid-feedback d-block">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;

