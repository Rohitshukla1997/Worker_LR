import React, { useState, useEffect } from "react";
import Select from "react-select";

const ReusableModal = ({
  show,
  initialData,
  onClose,
  onSubmit,
  title = "Form",
  fields = [],
  size = "lg",
}) => {
  const initialFormState = fields.reduce((acc, field) => {
    if (field.type === "multiselect") acc[field.name] = [];
    else if (field.type === "select") acc[field.name] = null;
    else if (field.type === "file") acc[field.name] = null;
    else acc[field.name] = "";
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      if (initialData) {
        const prefilledData = fields.reduce((acc, field) => {
          const value = initialData[field.name];

          if (field.type === "select") {
            acc[field.name] =
              field.options?.find((opt) => opt.value === value) || null;
          } else if (field.type === "multiselect") {
            acc[field.name] =
              field.options?.filter((opt) =>
                (value || []).includes(opt.value)
              ) || [];
          } else {
            acc[field.name] = value || "";
          }

          return acc;
        }, {});
        setFormData(prefilledData);
      } else {
        setFormData(initialFormState);
      }
    }
  }, [show, initialData]);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    const newValue = type === "file" ? files[0] : value;
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSelectChange = (selectedOption, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.name];
        const isEmpty =
          (["text", "number", "date", "password"].includes(field.type) &&
            !value) ||
          (field.type === "select" && !value) ||
          (field.type === "multiselect" && (!value || value.length === 0)) ||
          (field.type === "file" && !value);

        if (isEmpty) {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const cleanedData = { ...formData };
    fields.forEach((field) => {
      if (field.type === "select") {
        cleanedData[field.name] = formData[field.name]?.value || "";
      } else if (field.type === "multiselect") {
        cleanedData[field.name] =
          formData[field.name]?.map((item) => item.value) || [];
      }
    });

    onSubmit(cleanedData);
    onClose();
  };

  if (!show) return null;

  const modalSize =
    {
      sm: "max-w-md",
      md: "max-w-xl",
      lg: "max-w-3xl",
      xl: "max-w-5xl",
    }[size] || "max-w-3xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div
        className={`bg-white rounded-lg shadow-lg w-full ${modalSize} max-h-[80vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b px-4 py-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto">
          {fields.map((field) => (
            <div className="mb-4" key={field.name}>
              <label className="block mb-1 font-medium">
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>

              {field.type === "multiselect" ? (
                <Select
                  isMulti
                  options={field.options || []}
                  value={formData[field.name]}
                  onChange={(selected) =>
                    handleSelectChange(selected, field.name)
                  }
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              ) : field.type === "select" ? (
                <Select
                  options={field.options || []}
                  value={formData[field.name]}
                  onChange={(selected) =>
                    handleSelectChange(selected, field.name)
                  }
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    menu: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              ) : field.type === "file" ? (
                <div>
                  <input
                    type="file"
                    name={field.name}
                    onChange={handleChange}
                    accept={field.accept || "image/*"}
                    className="block w-full text-sm text-gray-700 border border-gray-300 rounded-md cursor-pointer focus:outline-none"
                  />
                  {formData[field.name] &&
                    typeof formData[field.name] === "object" && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Selected:</strong> {formData[field.name].name}
                      </div>
                    )}
                </div>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-200 focus:border-blue-500"
                />
              )}

              {errors[field.name] && (
                <div className="text-red-500 text-sm mt-1">
                  {errors[field.name]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t px-4 py-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReusableModal;
