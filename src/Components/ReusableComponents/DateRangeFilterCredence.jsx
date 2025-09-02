/* eslint-disable prettier/prettier */
import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DateRangeFilter = ({ onDateRangeChange, title }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const calendarRef = useRef(null);

  // Close calendar if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDate = new Date(year, month, -i);
      days.unshift(prevMonthDate);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const formatDate = (date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const handleDateClick = (date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(selectedStartDate);
      } else {
        setSelectedEndDate(date);
      }
    }
  };

  const isDateInRange = (date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const isDateSelected = (date) => {
    return (
      selectedStartDate?.toDateString() === date.toDateString() ||
      selectedEndDate?.toDateString() === date.toDateString()
    );
  };

  const handleApply = () => {
    let start = selectedStartDate;
    let end = selectedEndDate;

    if (selectedStartDate && !selectedEndDate) {
      end = new Date(start);
    } else if (selectedEndDate && !selectedStartDate) {
      start = new Date(end);
    }

    if (start) {
      start = new Date(start);
      start.setHours(0, 1, 1, 0);
    }

    if (end) {
      end = new Date(end);
      end.setHours(23, 59, 59, 999);
    }

    onDateRangeChange(start, end);
    setIsCalendarOpen(false);
  };

  const handleClear = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
  };

  const presets = [
    {
      label: "Today",
      action: () => {
        const today = new Date();
        setSelectedStartDate(today);
        setSelectedEndDate(today);
      },
    },
    {
      label: "Yesterday",
      action: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setSelectedStartDate(yesterday);
        setSelectedEndDate(yesterday);
      },
    },
    {
      label: "This Month",
      action: () => {
        const start = new Date();
        start.setDate(1);
        const end = new Date();
        setSelectedStartDate(start);
        setSelectedEndDate(end);
      },
    },
    {
      label: "Last Month",
      action: () => {
        const start = new Date();
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        const end = new Date();
        end.setDate(0);
        setSelectedStartDate(start);
        setSelectedEndDate(end);
      },
    },
    {
      label: "Custom Range",
      action: () => {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
      },
    },
  ];

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        {selectedStartDate && selectedEndDate
          ? `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`
          : title}
      </button>

      {isCalendarOpen && (
        <div
          ref={calendarRef}
          className="absolute mt-2 w-[450px] rounded-lg border bg-white p-4 shadow-lg z-50"
        >
          <div className="flex">
            {/* Presets */}
            <div className="w-40 border-r pr-4">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={preset.action}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 hover:text-purple-600"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="flex-grow pl-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1
                      )
                    )
                  }
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1
                      )
                    )
                  }
                  className="rounded p-1 hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-xs font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  )
                )}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth();
                  const isSelected = isDateSelected(date);
                  const inRange = isDateInRange(date);

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      className={`aspect-square w-full rounded-full text-sm transition 
                        ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : inRange
                            ? "bg-gray-200"
                            : "hover:bg-gray-100"
                        }
                        ${!isCurrentMonth ? "text-gray-400" : ""}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              className="rounded-md bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={handleApply}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
