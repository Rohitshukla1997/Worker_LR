import React from 'react'
import { CCol, CFormFeedback, CFormLabel } from '@coreui/react'
import Select from 'react-select'

const SingleSelectDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  isClearable = true,
  isInvalid = false,
}) => {
  return (
    <CCol style={{ width: '20rem', paddingRight: '0rem' }}>
      {label && <CFormLabel>{label}</CFormLabel>}
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={true} // Enables typing & search
      />
      {isInvalid && <CFormFeedback invalid>Please select a valid option.</CFormFeedback>}
    </CCol>
  )
}

export default SingleSelectDropdown
