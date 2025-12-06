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
`;

function TableArray({
  title,
  filteredData,
  setFilteredData,
  columns,
  viewButton,
  viewButtonLabel = "View",
  viewButtonIcon = <Eye size={16} />,
  viewButtonColor = "rgb(10, 45, 99)",
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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

  const isRowChecked = (rowId) => checkedRows.has(rowId);

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
      return (
        <div className="p-3 text-center text-gray-500">No products found</div>
      );
    }

    return (
      <div className="p-3">
        <h6 className="mb-3 font-semibold text-gray-700">
          Products ({products.length})
        </h6>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left border border-gray-200 font-semibold text-gray-600">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left border border-gray-200 font-semibold text-gray-600">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left border border-gray-200 font-semibold text-gray-600">
                  Quantity (Kg)
                </th>
                <th className="px-4 py-3 text-left border border-gray-200 font-semibold text-gray-600">
                  Bags
                </th>
                <th className="px-4 py-3 text-left border border-gray-200 font-semibold text-gray-600">
                  Item Weight
                </th>
                <th className="px-4 py-3 text-left border border-gray-200 font-semibold text-gray-600">
                  Item Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product._id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border border-gray-200">
                    {product.productName}
                  </td>
                  <td className="px-4 py-3 border border-gray-200">
                    {product.warehouseName}
                  </td>
                  <td className="px-4 py-3 border border-gray-200">
                    {product.quantityKg}
                  </td>
                  <td className="px-4 py-3 border border-gray-200">
                    {product.bags}
                  </td>
                  <td className="px-4 py-3 border border-gray-200">
                    {product.itemWeight}
                  </td>
                  <td className="px-4 py-3 border border-gray-200">
                    {product.itemCost}
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
                    >
                      {column.label}{" "}
                      {column.sortable && getSortIcon(column.key)}
                    </th>
                  ))}
                {(editButton ||
                  deleteButton ||
                  viewButton ||
                  reportButton ||
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
                      checkButton) && (
                      <td className="px-4 py-2 text-center border border-gray-200">
                        <div className="flex justify-center items-center gap-3">
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
                  const isChecked = getCheckboxChecked
                    ? getCheckboxChecked(row)
                    : isRowChecked(rowId);

                  return (
                    <React.Fragment key={rowIndex}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-center border border-gray-200">
                          {hasProducts && (
                            <button
                              className="flex items-center justify-center w-6 h-6 mx-auto rounded hover:bg-gray-200 transition-colors"
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
                                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
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
                          checkButton) && (
                          <td className="px-4 py-2 text-center border border-gray-200">
                            <div className="flex justify-center items-center gap-2">
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
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  onClick={() => handleEditButton(rowId)}
                                  aria-label="Edit"
                                  title="Edit"
                                >
                                  <Pencil color="#2D336B" size={18} />
                                </button>
                              )}

                              {deleteButton && (
                                <button
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  onClick={() => handleDeleteButton(rowId)}
                                  aria-label="Delete"
                                  title="Delete"
                                >
                                  <Trash2 color="#2D336B" size={18} />
                                </button>
                              )}

                              {reportButton && (
                                <button
                                  className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                  onClick={() => handleReportButton(rowId)}
                                  aria-label="Report"
                                  title="Report"
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
                                  className="flex items-center gap-2 px-3 py-1.5 rounded text-white transition-opacity"
                                  style={{
                                    background: viewButtonColor,
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
                        <tr className="bg-gray-50 transition-all duration-300">
                          <td
                            colSpan={columns.length + 3}
                            className="border border-gray-200"
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
  checkButton: PropTypes.bool,
  handleCheckboxButton: PropTypes.func,
  getCheckboxChecked: PropTypes.func,
};

TableArray.defaultProps = {
  isFetching: false,
  checkButton: false,
};

export default TableArray;
