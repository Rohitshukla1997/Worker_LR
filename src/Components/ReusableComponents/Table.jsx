import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableDataCell,
  CTableRow,
} from '@coreui/react'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'

const skeletonStyles = `
  @keyframes pulse {
    0% { opacity: 1 }
    50% { opacity: 0.4 }
    100% { opacity: 1 }
  }

  .skeleton-loader {
    background: #e0e0e0;
    border-radius: 4px;
    animation: pulse 1.5s infinite;
  }

  .action-cell {
    padding: 8px !important;
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

  .action-button {
    border: none;
    background: none;
    padding: 4px;
    border-radius: 6px;
    transition: background 0.2s ease;
    cursor: pointer;
  }

  .action-button:hover {
    background-color: #e9ecef;
  }

  .action-view-button {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* 🔹 Thin horizontal scrollbar */
  .table-responsive::-webkit-scrollbar {
    height: 6px;
  }
  .table-responsive::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }
  .table-responsive::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .table-responsive {
    scrollbar-width: thin; /* Firefox */
    scrollbar-color: #c1c1c1 #f1f1f1;
  }
`

function Table({
  title,
  filteredData,
  setFilteredData,
  columns,
  viewButton,
  viewButtonLabel = 'View',
  viewButtonIcon = <Eye size={16} />,
  viewButtonColor = 'rgb(10, 45, 99)',
  handleViewButton,
  editButton,
  handleEditButton,
  deleteButton,
  handleDeleteButton,
  currentPage,
  itemsPerPage,
  isFetching,
  action = 'Action',
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [viewLoadingId, setViewLoadingId] = useState(null)
  const [visiblePasswordRowId, setVisiblePasswordRowId] = useState(null)

  const startIndex = (currentPage - 1) * itemsPerPage
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (key) => {
    if (!columns.find((column) => column.key === key && column.sortable)) return

    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    setSortConfig({ key, direction })

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[key]
      const bValue = b[key]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      if (aStr < bStr) return direction === 'asc' ? -1 : 1
      if (aStr > bStr) return direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredData(sorted)
  }

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '▲' : '▼'
    }
  }

  return (
    <CRow>
      <style>{skeletonStyles}</style>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{title}</strong>
          </CCardHeader>
          <CCardBody>
            <CTable striped hover responsive bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="text-center">SN</CTableHeaderCell>
                  {columns
                    .filter((col) => !col.hidden)
                    .map((column, index) => (
                      <CTableHeaderCell
                        key={index}
                        className="text-center"
                        onClick={() => column.sortable && handleSort(column.key)}
                        style={{ cursor: column.sortable ? 'pointer' : 'default' }}
                      >
                        {column.label} {column.sortable && getSortIcon(column.key)}
                      </CTableHeaderCell>
                    ))}
                  {(editButton || deleteButton || viewButton) && (
                    <CTableHeaderCell className="text-center">{action}</CTableHeaderCell>
                  )}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {isFetching ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <CTableRow key={`skeleton-${index}`}>
                      <CTableDataCell className="text-center">
                        <div className="skeleton-loader" style={{ height: '20px' }} />
                      </CTableDataCell>
                      {columns.map((_, colIndex) => (
                        <CTableDataCell key={colIndex} className="text-center">
                          <div className="skeleton-loader" style={{ height: '20px' }} />
                        </CTableDataCell>
                      ))}
                      {(editButton || deleteButton || viewButton) && (
                        <CTableDataCell className="action-cell">
                          <div className="action-buttons">
                            {editButton && (
                              <div
                                className="skeleton-loader"
                                style={{ width: '20px', height: '20px' }}
                              />
                            )}
                            {deleteButton && (
                              <div
                                className="skeleton-loader"
                                style={{ width: '20px', height: '20px' }}
                              />
                            )}
                            {viewButton && (
                              <div
                                className="skeleton-loader"
                                style={{ width: '60px', height: '30px' }}
                              />
                            )}
                          </div>
                        </CTableDataCell>
                      )}
                    </CTableRow>
                  ))
                ) : filteredData.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={columns.length + 2} className="text-center">
                      No {title} found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  currentData.map((row, rowIndex) => (
                    <CTableRow key={rowIndex}>
                      <CTableDataCell className="text-center">
                        {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                      </CTableDataCell>
                      {columns
                        .filter((col) => !col.hidden)
                        .map((column) => (
                          <CTableDataCell key={column.key} className="text-center">
                            {column.key === 'password' ? (
                              <div className="d-flex align-items-center justify-content-center gap-2">
                                <span>
                                  {visiblePasswordRowId === row.id ? row.password : '••••••••'}
                                </span>
                                <button
                                  onClick={() =>
                                    setVisiblePasswordRowId(
                                      visiblePasswordRowId === row.id ? null : row.id,
                                    )
                                  }
                                  className="btn btn-sm btn-link p-0"
                                  title={
                                    visiblePasswordRowId === row.id
                                      ? 'Show password'
                                      : 'Hide password'
                                  }
                                >
                                  {visiblePasswordRowId === row.id ? (
                                    <Eye size={18} />
                                  ) : (
                                    <EyeOff size={18} />
                                  )}
                                </button>
                              </div>
                            ) : column.render ? (
                              column.render(row)
                            ) : (
                              row[column.key]
                            )}
                          </CTableDataCell>
                        ))}
                      {(editButton || deleteButton || viewButton) && (
                        <CTableDataCell className="action-cell">
                          <div className="action-buttons">
                            {editButton && (
                              <button
                                className="action-button"
                                onClick={() => handleEditButton(row.id)}
                                aria-label="Edit"
                              >
                                <Pencil color="#2D336B" size={18} />
                              </button>
                            )}
                            {deleteButton && (
                              <button
                                className="action-button"
                                onClick={() => handleDeleteButton(row.id)}
                                aria-label="Delete"
                              >
                                <Trash2 color="#2D336B" size={18} />
                              </button>
                            )}
                            {viewButton && (
                              <button
                                className="action-view-button"
                                onClick={async () => {
                                  setViewLoadingId(row.id)
                                  await handleViewButton(row.id)
                                  setViewLoadingId(null)
                                }}
                                disabled={viewLoadingId === row.id}
                                style={{
                                  backgroundColor: viewButtonColor,
                                  color: 'white',
                                  opacity: viewLoadingId === row.id ? 0.6 : 1,
                                  border: 'none',
                                }}
                              >
                                {viewButtonIcon}
                                <span>
                                  {viewLoadingId === row.id ? 'Loading...' : viewButtonLabel}
                                </span>
                              </button>
                            )}
                          </div>
                        </CTableDataCell>
                      )}
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

Table.propTypes = {
  title: PropTypes.string,
  filteredData: PropTypes.array,
  columns: PropTypes.array,
  setFilteredData: PropTypes.func,
  viewButton: PropTypes.bool,
  viewButtonLabel: PropTypes.string,
  viewButtonIcon: PropTypes.node,
  viewButtonColor: PropTypes.string,
  handleViewButton: PropTypes.func,
  editButton: PropTypes.bool,
  handleEditButton: PropTypes.func,
  deleteButton: PropTypes.bool,
  handleDeleteButton: PropTypes.func,
  currentPage: PropTypes.number,
  itemsPerPage: PropTypes.number,
  isFetching: PropTypes.bool,
}

Table.defaultProps = {
  isFetching: false,
}

export default Table
