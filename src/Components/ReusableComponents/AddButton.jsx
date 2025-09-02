import React from "react";

const AddButton = ({
  label = "Add",
  onClick,
  icon,
  size = "md", // sm, md, lg
  className = "",
  type = "button",
  disabled = false,
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl 
        bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white font-medium 
        shadow-md transition-all duration-300 ease-in-out
        hover:from-[#3d3344] hover:to-[#b39ac2] hover:shadow-lg
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${className}
      `}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default AddButton;
