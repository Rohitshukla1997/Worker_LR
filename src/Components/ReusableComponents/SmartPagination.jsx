/* eslint-disable prettier/prettier */
import React from "react";
import PropTypes from "prop-types";

function SmartPagination({
  totalPages,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) {
  const handlePageChange = (page) => {
    if (
      page === "..." ||
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }
    onPageChange(page);
  };

  const getPaginationItems = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col items-center mt-4 mb-4 space-y-2">
      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded border ${
            currentPage === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Previous
        </button>

        {getPaginationItems().map((item, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(item)}
            disabled={item === "..."}
            className={`px-3 py-1 rounded border ${
              item === currentPage
                ? "bg-blue-600 text-white"
                : item === "..."
                ? "bg-white text-gray-400 cursor-default"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded border ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          Next
        </button>
      </div>

      {/* Items per page selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={-1}>All</option>
        </select>
        <span className="text-sm">entries per page</span>
      </div>
    </div>
  );
}

SmartPagination.propTypes = {
  totalPages: PropTypes.number.isRequired,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  onItemsPerPageChange: PropTypes.func.isRequired,
};

export default SmartPagination;
