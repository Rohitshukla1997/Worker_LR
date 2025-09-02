import React, { useEffect, useState } from "react";
import { X, Search } from "lucide-react"; // lightweight icon library

const SearchInput = ({
  searchQuery,
  setSearchQuery,
  placeholder = "Search Here...",
  debounceDelay = 700,
  width = "300px", // default width
}) => {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(inputValue);
    }, debounceDelay);

    return () => clearTimeout(handler);
  }, [inputValue, debounceDelay, setSearchQuery]);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  return (
    <div
      className="flex items-center border rounded-md bg-white"
      style={{ width }}
    >
      {/* Search Icon */}
      <div className="px-2 text-gray-500">
        <Search size={18} />
      </div>

      {/* Input Field */}
      <input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className={`flex-1 px-2 py-1 outline-none rounded-md ${
          inputValue
            ? "border border-blue-500 shadow-sm"
            : "border border-transparent"
        }`}
      />

      {/* Clear Button (only when input has text) */}
      {inputValue && (
        <button
          onClick={() => setInputValue("")}
          className="px-2 text-gray-500 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
