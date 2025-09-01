/* eslint-disable prettier/prettier */
import React from 'react'
import { CPagination, CPaginationItem } from '@coreui/react'
import PropTypes from 'prop-types'

function SmartPagination({
  totalPages,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) {
  const handlePageChange = (page) => {
    if (page === '...' || page < 1 || page > totalPages || page === currentPage) {
      return
    }
    onPageChange(page)
  }

  const getPaginationItems = () => {
    const pages = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        start = 2
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
        end = totalPages - 1
      }

      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="d-flex flex-column align-items-center mt-3 mb-3">
      {/* Pagination controls */}
      <div className="mb-3">
        {' '}
        {/* Added a wrapper div for pagination */}
        {itemsPerPage !== -1 && (
          <CPagination align="center">
            <CPaginationItem
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ cursor: 'pointer' }}
            >
              Previous
            </CPaginationItem>
            {getPaginationItems().map((item, index) => (
              <CPaginationItem
                key={index}
                active={item === currentPage}
                disabled={item === '...'}
                onClick={() => handlePageChange(item)}
                style={{ cursor: 'pointer' }}
              >
                {item}
              </CPaginationItem>
            ))}
            <CPaginationItem
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ cursor: 'pointer' }}
            >
              Next
            </CPaginationItem>
          </CPagination>
        )}
      </div>

      {/* Items per page selector */}
      <div className="d-flex align-items-center">
        <label className="me-2 mb-0">Show</label>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="form-select form-select-sm w-auto" // Bootstrap classes for styling
          style={{
            cursor: 'pointer', // Add pointer cursor
            border: '1px solid #ced4da', // Custom border
            borderRadius: '4px', // Rounded corners
            paddingLeft: '1px',
            padding: '0.25rem 1.8rem', // Adjust padding
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={-1}>All</option>
        </select>
        <label className="ms-2 mb-0">entries per page</label>
      </div>
    </div>
  )
}

SmartPagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onItemsPerPageChange: PropTypes.func.isRequired,
}

export default SmartPagination
