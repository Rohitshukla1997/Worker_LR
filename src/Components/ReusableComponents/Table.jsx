import React, { useState } from "react";
import PropTypes from "prop-types";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

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

  .action-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
  }

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
`;

function Table({
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
  action = "Action",
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewLoadingId, setViewLoadingId] = useState(null);
  const [visiblePasswordRowId, setVisiblePasswordRowId] = useState(null);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div className="w-full">
      <style>{skeletonStyles}</style>

      <div className="bg-white shadow-lg rounded-lg mb-6 border border-gray-300">
        {/* Title */}
        <div
          className="px-4 py-3 rounded-t-lg text-white font-semibold text-lg"
          style={{ background: "linear-gradient(to right, #504255, #cbb4d4)" }}
        >
          {title}
        </div>

        {/* Table */}
        <div className="overflow-x-auto table-responsive">
          <table className="min-w-full border border-gray-300 border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-center border border-gray-300">
                  SN
                </th>
                {columns
                  .filter((col) => !col.hidden)
                  .map((column, idx) => (
                    <th
                      key={column.key + "-" + idx} // unique
                      className="px-4 py-2 text-center cursor-pointer select-none border border-gray-300"
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      {column.label}{" "}
                      {column.sortable && getSortIcon(column.key)}
                    </th>
                  ))}
                {(editButton || deleteButton || viewButton) && (
                  <th className="px-4 py-2 text-center border border-gray-300">
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
                    {(editButton || deleteButton || viewButton) && (
                      <td className="px-4 py-2 text-center border border-gray-200">
                        <div className="action-buttons">
                          {editButton && (
                            <div className="skeleton-loader h-5 w-5" />
                          )}
                          {deleteButton && (
                            <div className="skeleton-loader h-5 w-5" />
                          )}
                          {viewButton && (
                            <div className="skeleton-loader h-7 w-16" />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-2 text-center"
                  >
                    No {title} found.
                  </td>
                </tr>
              ) : (
                currentData.map((row, rowIndex) => (
                  <tr key={row.id || rowIndex} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-center border border-gray-200">
                      {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                    </td>
                    {columns
                      .filter((col) => !col.hidden)
                      .map((column, colIndex) => (
                        <td
                          key={`${row.id || rowIndex}-${
                            column.key
                          }-${colIndex}`}
                          className="px-4 py-2 text-center border border-gray-200"
                        >
                          {column.key === "password" ? (
                            <div className="flex justify-center items-center gap-2">
                              <span>
                                {visiblePasswordRowId === row.id
                                  ? row.password
                                  : "••••••••"}
                              </span>
                              <button
                                onClick={() =>
                                  setVisiblePasswordRowId(
                                    visiblePasswordRowId === row.id
                                      ? null
                                      : row.id
                                  )
                                }
                                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                                title={
                                  visiblePasswordRowId === row.id
                                    ? "Hide password"
                                    : "Show password"
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
                        </td>
                      ))}
                    {(editButton || deleteButton || viewButton) && (
                      <td className="px-4 py-2 text-center border border-gray-200">
                        <div className="action-buttons">
                          {editButton && (
                            <button
                              onClick={() => handleEditButton(row.id)}
                              className="p-1 rounded hover:bg-gray-100"
                              title="Edit"
                            >
                              <Pencil size={18} color="#2D336B" />
                            </button>
                          )}
                          {deleteButton && (
                            <button
                              onClick={() => handleDeleteButton(row.id)}
                              className="p-1 rounded hover:bg-gray-100"
                              title="Delete"
                            >
                              <Trash2 size={18} color="#2D336B" />
                            </button>
                          )}
                          {viewButton && (
                            <button
                              onClick={async () => {
                                setViewLoadingId(row.id);
                                await handleViewButton(row.id);
                                setViewLoadingId(null);
                              }}
                              disabled={viewLoadingId === row.id}
                              className="flex items-center gap-2 px-3 py-1 rounded text-white"
                              style={{
                                background: viewButtonColor,
                                opacity: viewLoadingId === row.id ? 0.6 : 1,
                              }}
                            >
                              {viewButtonIcon}
                              <span>
                                {viewLoadingId === row.id
                                  ? "Loading..."
                                  : viewButtonLabel}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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
};

Table.defaultProps = {
  isFetching: false,
};

export default Table;
