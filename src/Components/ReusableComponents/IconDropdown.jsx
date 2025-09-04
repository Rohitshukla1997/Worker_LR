/* eslint-disable prettier/prettier */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function IconDropdown({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative mr-8 mb-8" ref={dropdownRef}>
      {/* Main button */}
      <motion.button
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="w-10 h-10 flex items-center justify-center rounded-full border-none shadow-md"
        style={{
          background: "linear-gradient(to right, #504255, #cbb4d4)",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </motion.div>
      </motion.button>

      {/* Dropdown menu */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col gap-2 z-50"
          >
            {items.map((item, index) => (
              <motion.div
                key={index}
                className="relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.05 },
                }}
                exit={{
                  opacity: 0,
                  y: 20,
                  transition: { delay: (items.length - index - 1) * 0.05 },
                }}
              >
                {/* Dropdown buttons */}
                <motion.button
                  onClick={() => {
                    item.onClick();
                    setIsOpen(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full shadow-md border-none"
                  style={{
                    background: "linear-gradient(to right, #504255, #cbb4d4)",
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {React.createElement(item.icon, {
                    className: "w-5 h-5 text-white",
                  })}
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="absolute right-full top-1/2 -translate-y-1/2 rounded text-white text-sm whitespace-nowrap px-2 py-1 mr-2 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(to right, #504255, #cbb4d4)",
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
