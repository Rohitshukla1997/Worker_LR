import React, { useState, useEffect } from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

const LorryForm = ({
  show,
  initialData,
  onClose,
  onSubmit,
  title = "Form",
  fields = [],
  onFieldChange,
}) => {
  const initialFormState = fields.reduce((acc, field) => {
    if (field.type === "multiselect") acc[field.name] = [];
    else if (field.type === "select") acc[field.name] = null;
    else acc[field.name] = "";
    return acc;
  }, {});

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (show) {
      if (initialData) {
        const prefilledData = fields.reduce((acc, field) => {
          acc[field.name] =
            initialData[field.name] || (field.type === "select" ? null : "");
          return acc;
        }, {});
        setFormData(prefilledData);
      } else {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const newFormState = { ...initialFormState };

        // Pre-select today's date if the field is "date"
        fields.forEach((field) => {
          if (field.type === "date") {
            newFormState[field.name] = today;
          }
        });

        setFormData(newFormState);
      }
    }
  }, [show, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (selectedOption, fieldName) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: selectedOption,
    }));

    if (onFieldChange) {
      onFieldChange(fieldName, selectedOption);
    }
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
          (field.type === "multiselect" && (!value || value.length === 0));

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
        cleanedData[field.name] =
          formData[field.name]?.value || formData[field.name] || "";
      } else if (field.type === "multiselect") {
        cleanedData[field.name] =
          formData[field.name]?.map((item) => item.value) || [];
      }
    });

    onSubmit(cleanedData);
    onClose();
  };

  const groupedFields = {};
  fields.forEach((field) => {
    if (!groupedFields[field.section]) groupedFields[field.section] = [];
    groupedFields[field.section].push(field);
  });

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-6xl rounded-xl bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {Object.entries(groupedFields).map(([section, sectionFields]) => (
            <div key={section} className="mb-6">
              <h5 className="mb-3 border-b pb-1 text-base font-medium text-gray-700">
                {section}
              </h5>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {sectionFields.map((field) => (
                  <div key={field.name}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500"> *</span>
                      )}
                    </label>
                    {field.type === "select" || field.type === "multiselect" ? (
                      <>
                        {field.creatable ? (
                          <CreatableSelect
                            isMulti={field.type === "multiselect"}
                            options={field.options || []}
                            value={formData[field.name]}
                            onChange={(selected) =>
                              handleSelectChange(selected, field.name)
                            }
                            isClearable={field.type === "select"}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <Select
                            isMulti={field.type === "multiselect"}
                            options={field.options || []}
                            value={formData[field.name]}
                            onChange={(selected) =>
                              handleSelectChange(selected, field.name)
                            }
                            isClearable={field.type === "select"}
                            className="react-select-container"
                            classNamePrefix="react-select"
                          />
                        )}
                        {errors[field.name] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[field.name]}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <input
                          type={field.type}
                          name={field.name}
                          placeholder={field.placeholder}
                          value={formData[field.name]}
                          onChange={handleChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        {errors[field.name] && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors[field.name]}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
          >
            Create Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default LorryForm;
