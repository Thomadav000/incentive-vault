import React, { useState } from 'react';
import './CalendarView.css';

function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 10)); // November 2026

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Mock events
  const events = {
    1: [{ type: 'enrollment', program: 'Future Fortunes' }],
    15: [{ type: 'payment', program: 'Pink Buckle' }],
    20: [{ type: 'race', program: 'Ruby Buckle' }],
  };

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <h1>Calendar</h1>

        <div className="calendar-controls">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
            ← Previous
          </button>
          <h2>{monthName}</h2>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
            Next →
          </button>
        </div>

        <div className="calendar-legend">
          <div className="legend-item enrollment">📋 Enrollment Deadline</div>
          <div className="legend-item payment">💰 Payment Deadline</div>
          <div className="legend-item race">🏇 Race Date</div>
        </div>

        <div className="calendar-grid">
          <div className="calendar-header">Sun</div>
          <div className="calendar-header">Mon</div>
          <div className="calendar-header">Tue</div>
          <div className="calendar-header">Wed</div>
          <div className="calendar-header">Thu</div>
          <div className="calendar-header">Fri</div>
          <div className="calendar-header">Sat</div>

          {days.map((day, index) => (
            <div key={index} className={`calendar-day ${day ? '' : 'empty'}`}>
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="day-events">
                    {events[day] && events[day].map((event, idx) => (
                      <div key={idx} className={`event ${event.type}`} title={event.program}>
                        {event.type === 'enrollment' && '📋'}
                        {event.type === 'payment' && '💰'}
                        {event.type === 'race' && '🏇'}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <section className="upcoming-events">
          <h2>Upcoming Deadlines</h2>
          <div className="events-list">
            <div className="event-item enrollment">
              <span className="event-date">Nov 1</span>
              <span className="event-title">Future Fortunes - Enrollment</span>
            </div>
            <div className="event-item payment">
              <span className="event-date">Nov 15</span>
              <span className="event-title">Pink Buckle - Payment</span>
            </div>
            <div className="event-item race">
              <span className="event-date">Nov 20</span>
              <span className="event-title">Ruby Buckle - Race Date</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CalendarView;
