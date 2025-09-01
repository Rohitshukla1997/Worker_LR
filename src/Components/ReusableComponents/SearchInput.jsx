import React, { useEffect, useState } from 'react'
import { CInputGroup, CInputGroupText, CFormInput, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilX } from '@coreui/icons'

const SearchInput = ({
  searchQuery,
  setSearchQuery,
  placeholder = 'Search Here...',
  debounceDelay = 700,
  width = '300px', // default width
}) => {
  const [inputValue, setInputValue] = useState(searchQuery)

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue)
    }, debounceDelay)

    return () => clearTimeout(handler)
  }, [inputValue, debounceDelay, setSearchQuery])

  useEffect(() => {
    setInputValue(searchQuery)
  }, [searchQuery])

  return (
    <CInputGroup style={{ width }}>
      {/* Search Icon */}
      <CInputGroupText>
        <CIcon icon={cilSearch} />
      </CInputGroupText>

      {/* Input Field */}
      <CFormInput
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        style={{
          boxShadow: inputValue ? '0 0 1px rgba(0, 123, 255, 0.75)' : 'none',
          borderColor: inputValue ? '#007bff' : undefined,
        }}
      />

      {/* Clear Button (only when input has text) */}
      {inputValue && (
        <CButton color="light" onClick={() => setInputValue('')} style={{ border: 'none' }}>
          <CIcon icon={cilX} />
        </CButton>
      )}
    </CInputGroup>
  )
}

export default SearchInput
