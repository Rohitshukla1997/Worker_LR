/* eslint-disable prettier/prettier */
import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './DateRangeCredence.css'

const DateRangeFilter = ({ onDateRangeChange, title }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStartDate, setSelectedStartDate] = useState(null)
  const [selectedEndDate, setSelectedEndDate] = useState(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const calendarRef = useRef(null)

  // Close calendar if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false)
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCalendarOpen])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevMonthDate = new Date(year, month, -i)
      days.unshift(prevMonthDate)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const formatDate = (date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  const handleDateClick = (date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date)
      setSelectedEndDate(null)
    } else {
      if (date < selectedStartDate) {
        setSelectedStartDate(date)
        setSelectedEndDate(selectedStartDate)
      } else {
        setSelectedEndDate(date)
      }
    }
  }

  const isDateInRange = (date) => {
    if (!selectedStartDate || !selectedEndDate) return false
    return date >= selectedStartDate && date <= selectedEndDate
  }

  const isDateSelected = (date) => {
    return (
      selectedStartDate?.toDateString() === date.toDateString() ||
      selectedEndDate?.toDateString() === date.toDateString()
    )
  }

  const handleApply = () => {
    let start = selectedStartDate
    let end = selectedEndDate

    if (selectedStartDate && !selectedEndDate) {
      end = new Date(start)
    } else if (selectedEndDate && !selectedStartDate) {
      start = new Date(end)
    }

    if (start) {
      start = new Date(start)
      start.setHours(0, 1, 1, 0) // Set to 00:01:01
    }

    if (end) {
      end = new Date(end)
      end.setHours(23, 59, 59, 999) // Optionally, set to end of day
    }

    console.log('Applying Date Range:', start, end)
    onDateRangeChange(start, end)
    setIsCalendarOpen(false)
  }


  const handleClear = () => {
    setSelectedStartDate(null)
    setSelectedEndDate(null)
  }

  const presets = [
    {
      label: 'Today',
      action: () => {
        const today = new Date()
        setSelectedStartDate(today)
        setSelectedEndDate(today)
      },
    },
    {
      label: 'Yesterday',
      action: () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        setSelectedStartDate(yesterday)
        setSelectedEndDate(yesterday)
      },
    },
    {
      label: 'This Month',
      action: () => {
        const start = new Date()
        start.setDate(1)
        const end = new Date()
        setSelectedStartDate(start)
        setSelectedEndDate(end)
      },
    },
    {
      label: 'Last Month',
      action: () => {
        const start = new Date()
        start.setMonth(start.getMonth() - 1)
        start.setDate(1)
        const end = new Date()
        end.setDate(0)
        setSelectedStartDate(start)
        setSelectedEndDate(end)
      },
    },
    {
      label: 'Custom Range',
      action: () => {
        setSelectedStartDate(null)
        setSelectedEndDate(null)
      },
    },
  ]

  return (
    <div className="position-relative">
      <button
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
        className="btn btn-outline-secondary"
      >
        {selectedStartDate && selectedEndDate
          ? `${formatDate(selectedStartDate)} - ${formatDate(selectedEndDate)}`
          : title}
      </button>

      {isCalendarOpen && (
        <div
          ref={calendarRef} // Attach ref to the calendar div
          className="position-absolute mt-2 bg-white rounded shadow border p-4"
          style={{ width: '450px', zIndex: 1000 }}
        >
          <div className="d-flex">
            {/* Presets */}
            <div className="border-end pe-4" style={{ width: '200px' }}>
              {presets.map((preset) => (
                <button key={preset.label} onClick={preset.action} className="preset-button">
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="flex-grow-1 ps-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1),
                    )
                  }
                  className="btn btn-link p-1"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="fw-semibold">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
                    )
                  }
                  className="btn btn-link p-1"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="calendar-grid">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center small fw-medium text-secondary py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                  const classes = [
                    'date-button',
                    !isCurrentMonth && 'other-month',
                    isDateSelected(date) && 'selected',
                    isDateInRange(date) && !isDateSelected(date) && 'in-range',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <button key={index} onClick={() => handleDateClick(date)} className={classes}>
                      {date.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 pt-4 border-top">
            <button onClick={() => setIsCalendarOpen(false)} className="btn btn-light me-2">
              Cancel
            </button>
            <button onClick={handleClear} className="btn btn-danger text-white me-2">
              Clear
            </button>
            <button
              onClick={handleApply}
              // disabled={!selectedStartDate || !selectedEndDate}
              // disabled={!selectedStartDate && !selectedEndDate}
              className="btn btn-primary"
              style={{ backgroundColor: '#6f42c1', borderColor: '#6f42c1' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangeFilter
