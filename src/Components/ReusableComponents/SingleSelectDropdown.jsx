import React from "react";
import Select from "react-select";

const SingleSelectDropdown = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  isClearable = true,
  isInvalid = false,
  errorMessage = "Please select a valid option.",
  className = "",
  labelClassName = "",
  containerClassName = "",
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <div className={`${className}`}>
        <Select
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          isClearable={isClearable}
          isSearchable={true}
          className="basic-single"
          classNamePrefix="select"
          classNames={{
            control: (state) =>
              `min-h-[38px] border ${
                isInvalid ? "border-red-300" : "border-gray-300"
              } rounded-md shadow-sm hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500`,
            placeholder: () => "text-gray-400",
            input: () => "text-gray-900",
            singleValue: () => "text-gray-900",
            menu: () => "border border-gray-300 rounded-md shadow-lg mt-1",
            option: (state) =>
              `${
                state.isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-900"
              } ${
                state.isFocused && !state.isSelected ? "bg-gray-100" : ""
              } px-3 py-2 cursor-pointer`,
            noOptionsMessage: () => "text-gray-500 p-3",
            loadingMessage: () => "text-gray-500 p-3",
            clearIndicator: () => "text-gray-400 hover:text-gray-600",
            dropdownIndicator: () => "text-gray-400 hover:text-gray-600",
            indicatorSeparator: () => "bg-gray-300",
          }}
          styles={{
            control: (base) => ({
              ...base,
              minHeight: "38px",
            }),
          }}
        />
      </div>
      {isInvalid && <p className="mt-1 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
};

export default SingleSelectDropdown;
