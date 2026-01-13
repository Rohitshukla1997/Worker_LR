import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  Check,
  Square,
  X,
  CheckCircle,
} from "lucide-react";

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

  /* Status icon styling */
  .status-icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .status-icon-button:hover {
    background-color: #e9ecef;
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
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 #f1f1f1;
  }

  /* Expand/Collapse row styles */
  .expandable-row {
    cursor: pointer;
  }

  .expanded-details {
    background-color: #f8f9fa;
    transition: all 0.3s ease;
  }

  /* Products section styling */
  .products-section {
    padding: 16px !important;
    margin: 8px 0 !important;
    border-radius: 8px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
  }

  .products-section h6 {
    margin-bottom: 12px !important;
    font-weight: 600;
    color: #495057;
    font-size: 14px;
    padding-left: 8px;
  }

  .products-table-container {
    background-color: white;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  .products-table {
    margin: 0 !important;
    border-collapse: collapse;
    width: 100%;
  }

  .products-table thead th {
    background-color: #f1f3f4 !important;
    font-weight: 600;
    font-size: 13px;
    padding: 10px 12px !important;
    border-bottom: 2px solid #dee2e6;
    color: #495057;
  }

  .products-table tbody td {
    padding: 8px 12px !important;
    font-size: 13px;
    border-bottom: 1px solid #e9ecef;
  }

  .products-table tbody tr:last-child td {
    border-bottom: none;
  }

  .products-table tbody tr:hover {
    background-color: #f8f9fa;
  }

  .expand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: #e9ecef;
    transition: all 0.2s ease;
  }

  .expand-icon:hover {
    background-color: #dee2e6;
  }

  /* Column widths for products table */
  .product-name-col {
    min-width: 150px;
    text-align: left !important;
  }

  .warehouse-col {
    min-width: 120px;
    text-align: left !important;
  }

  .quantity-col,
  .bags-col,
  .weight-col,
  .cost-col,
  .updatedQuantity-col {
    min-width: 100px;
  }

  /* Empty state styling */
  .empty-products {
    padding: 20px;
    text-align: center;
    color: #6c757d;
    font-style: italic;
    background-color: white;
    border-radius: 6px;
    border: 1px dashed #dee2e6;
  }

  .gradient-button {
  background: linear-gradient(to right, #504255, #cbb4d4);
  color: white;
}
`;

function TableArray({
  title,
  filteredData,
  setFilteredData,
  columns,
  viewButton,
  viewButtonLabel = "View",
  viewButtonIcon = <Eye size={16} />,
  viewButtonColor = "linear-gradient(to right, #504255, #cbb4d4)",
  handleViewButton,
  editButton,
  handleEditButton,
  deleteButton,
  handleDeleteButton,
  currentPage,
  itemsPerPage,
  isFetching,
  reportButton,
  handleReportButton,
  statusButton = false,
  handleStatusButton,
  statusButtonLabel = "Status",
  statusButtonIcon = <CheckCircle size={18} />,
  checkButton = false,
  handleCheckboxButton,
  getCheckboxChecked,
  action = "Action",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewLoadingId, setViewLoadingId] = useState(null);
  const [visiblePasswordRowId, setVisiblePasswordRowId] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [checkedRows, setCheckedRows] = useState(new Set());

  // Use filteredData directly since it already contains the current page data
  const currentData = filteredData;

  const toggleRowExpansion = (rowId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  const isRowExpanded = (rowId) => expandedRows.has(rowId);

  const handleCheckboxChange = (rowId) => {
    const newCheckedRows = new Set(checkedRows);
    if (newCheckedRows.has(rowId)) {
      newCheckedRows.delete(rowId);
    } else {
      newCheckedRows.add(rowId);
    }
    setCheckedRows(newCheckedRows);

    if (handleCheckboxButton) {
      handleCheckboxButton(rowId, newCheckedRows.has(rowId));
    }
  };

  const isRowChecked = (rowId) => {
    if (getCheckboxChecked) {
      const row = currentData.find((r) => (r.id || r._id) === rowId);
      return getCheckboxChecked(row);
    }
    return checkedRows.has(rowId);
  };

  // Function to determine status icon based on status
  const getStatusIcon = (row) => {
    const status = row?.status?.toLowerCase();

    if (status === "completed") {
      return <Check color="#28a745" size={18} />;
    } else if (status === "cancelled") {
      return <X color="#dc3545" size={18} />;
    } else if (status === "partially correction") {
      return <Check color="#28a745" size={18} />;
    } else {
      // Pending or any other status
      return <Square color="#6c757d" size={18} />;
    }
  };

  const handleSort = (key) => {
    if (!columns.find((column) => column.key === key && column.sortable))
      return;

    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredData(sorted);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
  };

  const renderProductsTable = (products) => {
    if (!products || products.length === 0) {
      return <div className="empty-products">No products found</div>;
    }

    return (
      <div className="products-section">
        <h6>Products ({products.length})</h6>
        <div className="products-table-container">
          <table className="w-full bg-white border-collapse">
            <thead>
              <tr>
                <th className="product-name-col px-4 py-3 text-left font-semibold border-b">
                  Product Name
                </th>
                <th className="warehouse-col px-4 py-3 text-left font-semibold border-b">
                  Warehouse
                </th>
                <th className="quantity-col px-4 py-3 text-center font-semibold border-b">
                  Quantity (MT)
                </th>
                <th className="bagSize-col px-4 py-3 text-center font-semibold border-b">
                  Bag Size
                </th>
                <th className="totalBags-col px-4 py-3 text-center font-semibold border-b">
                  Total Bags
                </th>
                <th className="updatedQuantityMT px-4 py-3 text-center font-semibold border-b">
                  Quantity Taken By Party(MT)
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product._id || index} className="hover:bg-gray-50">
                  <td className="product-name-col px-4 py-3 border-b">
                    {product.productName || "-"}
                  </td>
                  <td className="warehouse-col px-4 py-3 border-b">
                    {product.warehouseName || "-"}
                  </td>
                  <td className="quantity-col px-4 py-3 text-center border-b">
                    {product.quantityMT || "0"}
                  </td>
                  <td className="bagSize-col px-4 py-3 text-center border-b">
                    {product.bagSize || "0"}
                  </td>
                  <td className="totalBags-col px-4 py-3 text-center border-b">
                    {product.totalBags || "0"}
                  </td>
                  <td className="updatedQuantity-col px-4 py-3 text-center border-b">
                    {product.updatedQuantityMT || "0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <style>{skeletonStyles}</style>

      <div className="bg-white shadow-lg rounded-lg mb-6 border border-gray-300 w-full">
        {/* Title */}
        <div
          className="px-4 py-3 rounded-t-lg text-white font-semibold text-lg"
          style={{ background: "linear-gradient(to right, #504255, #cbb4d4)" }}
        >
          {title}
        </div>

        {/* Table */}
        <div className="overflow-x-auto table-responsive w-full">
          <table className="w-full border border-gray-300 border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-center border border-gray-300 min-w-[40px]"></th>
                <th className="px-4 py-2 text-center border border-gray-300 min-w-[50px]">
                  SN
                </th>
                {columns
                  .filter((col) => !col.hidden)
                  .map((column, idx) => (
                    <th
                      key={column.key + "-" + idx}
                      className="px-4 py-2 text-center cursor-pointer select-none border border-gray-300"
                      onClick={() => column.sortable && handleSort(column.key)}
                      style={{
                        minWidth: column.minWidth || "auto",
                      }}
                    >
                      {column.label}{" "}
                      {column.sortable && getSortIcon(column.key)}
                    </th>
                  ))}
                {(editButton ||
                  deleteButton ||
                  viewButton ||
                  reportButton ||
                  statusButton ||
                  checkButton) && (
                  <th className="px-4 py-2 text-center border border-gray-300 min-w-[180px]">
                    {action}
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {isFetching ? (
                Array.from({ length: itemsPerPage }).map((_, index) => (
                  <tr key={`skeleton-${index}`}>
                    <td className="px-4 py-2 text-center border border-gray-200">
                      <div className="skeleton-loader h-6 w-6 mx-auto rounded" />
                    </td>
                    <td className="px-4 py-2 text-center border border-gray-200">
                      <div className="skeleton-loader h-5 w-full mx-auto" />
                    </td>
                    {columns.map((_, colIndex) => (
                      <td
                        key={`skeleton-col-${colIndex}`}
                        className="px-4 py-2 text-center border border-gray-200"
                      >
                        <div className="skeleton-loader h-5 w-full mx-auto" />
                      </td>
                    ))}
                    {(editButton ||
                      deleteButton ||
                      viewButton ||
                      reportButton ||
                      statusButton ||
                      checkButton) && (
                      <td className="px-4 py-2 text-center border border-gray-200">
                        <div className="action-buttons">
                          {statusButton && (
                            <div className="skeleton-loader h-5 w-5 rounded" />
                          )}
                          {checkButton && (
                            <div className="skeleton-loader h-5 w-5 rounded" />
                          )}
                          {editButton && (
                            <div className="skeleton-loader h-5 w-5 rounded" />
                          )}
                          {deleteButton && (
                            <div className="skeleton-loader h-5 w-5 rounded" />
                          )}
                          {reportButton && (
                            <div className="skeleton-loader h-5 w-5 rounded" />
                          )}
                          {viewButton && (
                            <div className="skeleton-loader h-7 w-16 rounded" />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 3}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    No {title} found.
                  </td>
                </tr>
              ) : (
                currentData.map((row, rowIndex) => {
                  const rowId = row.id || row._id;
                  const isExpanded = isRowExpanded(rowId);
                  const hasProducts = row.products && row.products.length > 0;
                  const statusIcon = getStatusIcon(row);
                  const status = row?.status?.toLowerCase();
                  const isCompletedOrCancelled =
                    status === "completed" ||
                    status === "cancelled" ||
                    status === "partially correction";

                  const isChecked = isRowChecked(rowId);

                  return (
                    <React.Fragment key={rowIndex}>
                      <tr className="hover:bg-gray-50 expandable-row">
                        <td className="px-4 py-2 text-center border border-gray-200">
                          {hasProducts && (
                            <button
                              className="expand-icon action-button"
                              onClick={() => toggleRowExpansion(rowId)}
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? (
                                <ChevronDown
                                  size={16}
                                  className="text-gray-600"
                                />
                              ) : (
                                <ChevronRight
                                  size={16}
                                  className="text-gray-600"
                                />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center border border-gray-200">
                          {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                        </td>
                        {columns
                          .filter((col) => !col.hidden)
                          .map((column, colIndex) => (
                            <td
                              key={`${rowId}-${column.key}-${colIndex}`}
                              className="px-4 py-2 text-center border border-gray-200"
                            >
                              {column.key === "password" ? (
                                <div className="flex justify-center items-center gap-2">
                                  <span>
                                    {visiblePasswordRowId === rowId
                                      ? row.password
                                      : "••••••••"}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setVisiblePasswordRowId(
                                        visiblePasswordRowId === rowId
                                          ? null
                                          : rowId
                                      )
                                    }
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 action-button"
                                    title={
                                      visiblePasswordRowId === rowId
                                        ? "Show password"
                                        : "Hide password"
                                    }
                                  >
                                    {visiblePasswordRowId === rowId ? (
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
                            </td>
                          ))}
                        {(editButton ||
                          deleteButton ||
                          viewButton ||
                          reportButton ||
                          statusButton ||
                          checkButton) && (
                          <td className="px-4 py-2 text-center border border-gray-200 action-cell">
                            <div className="action-buttons">
                              {/* Status Icon Button */}
                              {statusButton && (
                                <button
                                  className="status-icon-button action-button"
                                  onClick={() => handleStatusButton(rowId)}
                                  aria-label={`Status: ${
                                    row?.status || "Pending"
                                  }`}
                                  title={`Status: ${row?.status || "Pending"}`}
                                >
                                  {statusIcon}
                                </button>
                              )}

                              {checkButton && (
                                <label
                                  className={`flex items-center justify-center w-9 h-9 rounded cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-blue-50 hover:bg-blue-100"
                                      : "hover:bg-gray-100"
                                  }`}
                                  title={isChecked ? "Completed" : "Pending"}
                                >
                                  <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (handleCheckboxButton) {
                                        handleCheckboxButton(rowId, !isChecked);
                                      } else {
                                        handleCheckboxChange(rowId);
                                      }
                                    }}
                                    aria-label="Toggle status"
                                  />
                                  {isChecked ? (
                                    <Check color="#28a745" size={18} />
                                  ) : (
                                    <Square color="#6c757d" size={18} />
                                  )}
                                </label>
                              )}

                              {editButton && (
                                <button
                                  className="action-button"
                                  onClick={() => handleEditButton(rowId)}
                                  aria-label="Edit"
                                  disabled={isCompletedOrCancelled}
                                  title={
                                    isCompletedOrCancelled
                                      ? "Cannot edit completed/cancelled/Partially Correction records"
                                      : "Edit"
                                  }
                                >
                                  <Pencil
                                    color={
                                      isCompletedOrCancelled
                                        ? "#6c757d"
                                        : "#2D336B"
                                    }
                                    size={18}
                                  />
                                </button>
                              )}

                              {deleteButton && (
                                <button
                                  className="action-button"
                                  onClick={() => handleDeleteButton(rowId)}
                                  aria-label="Delete"
                                  disabled={isCompletedOrCancelled}
                                  title={
                                    isCompletedOrCancelled
                                      ? "Cannot delete completed/cancelled/Partially Correction records"
                                      : "Delete"
                                  }
                                >
                                  <Trash2
                                    color={
                                      isCompletedOrCancelled
                                        ? "#6c757d"
                                        : "#2D336B"
                                    }
                                    size={18}
                                  />
                                </button>
                              )}

                              {reportButton && (
                                <button
                                  className="action-button"
                                  onClick={() => handleReportButton(rowId)}
                                  aria-label="Report"
                                >
                                  <FileText color="#2D336B" size={18} />
                                </button>
                              )}

                              {viewButton && (
                                <button
                                  onClick={async () => {
                                    setViewLoadingId(rowId);
                                    await handleViewButton(rowId);
                                    setViewLoadingId(null);
                                  }}
                                  disabled={viewLoadingId === rowId}
                                  className="action-view-button gradient-button"
                                  style={{
                                    backgroundColor: viewButtonColor,
                                    opacity: viewLoadingId === rowId ? 0.6 : 1,
                                  }}
                                >
                                  {viewButtonIcon}
                                  <span className="text-sm">
                                    {viewLoadingId === rowId
                                      ? "Loading..."
                                      : viewButtonLabel}
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && hasProducts && (
                        <tr className="expanded-details">
                          <td
                            colSpan={columns.length + 3}
                            className="border border-gray-200"
                            style={{ padding: "0" }}
                          >
                            {renderProductsTable(row.products)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

TableArray.propTypes = {
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
  reportButton: PropTypes.bool,
  handleReportButton: PropTypes.func,
  statusButton: PropTypes.bool,
  handleStatusButton: PropTypes.func,
  statusButtonLabel: PropTypes.string,
  statusButtonIcon: PropTypes.node,
  checkButton: PropTypes.bool,
  handleCheckboxButton: PropTypes.func,
  getCheckboxChecked: PropTypes.func,
  action: PropTypes.string,
};

TableArray.defaultProps = {
  isFetching: false,
  statusButton: false,
  checkButton: false,
};

export default TableArray;
