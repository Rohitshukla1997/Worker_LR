import React from 'react'

const AddButton = ({
  label = 'Add',
  onClick,
  icon,
  variant = 'primary',
  size = '', // 'sm', 'lg', or ''
  className = '', // additional custom classes
  type = 'button',
  disabled = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} d-flex align-items-center ${className}`}
      disabled={disabled}
      style={{ gap: '0.3rem' }}
    >
      {icon && <span className="d-flex align-items-center">{icon}</span>}
      <span className="d-flex align-items-center">{label}</span>
    </button>
  )
}

export default AddButton
