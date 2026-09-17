import React, { useContext, useState, useMemo } from 'react';
import { UserContext } from '../context/UserContext';
import './CalendarView.css';

const monthOrder = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5,
  'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10,
  'November': 11, 'December': 12
};

function CalendarView() {
  const { horses, programs, loading } = useContext(UserContext);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const events = useMemo(() => {
    const eventMap = {};
    const allDeadlines = [];

    Object.values(programs).forEach(program => {
      if (!program.deadline) return;

      const deadlineMonth = program.deadline.split(' ')[0];
      const deadlineDay = parseInt(program.deadline.split(' ')[1]);

      if (monthOrder[deadlineMonth] === currentMonth.getMonth() + 1) {
        if (!eventMap[deadlineDay]) {
          eventMap[deadlineDay] = [];
        }

        const horsesInProgram = horses.filter(h => h.programs && h.programs.includes(program.name));
        const horsePaidStatus = horsesInProgram.map(h => ({
          name: h.name,
          isPaid: h.programsPaid && h.programsPaid[program.name]
        }));

        const totalHorses = horsesInProgram.length;
        const paidCount = horsePaidStatus.filter(h => h.isPaid).length;
        const unpaidCount = totalHorses - paidCount;

        eventMap[deadlineDay].push({
          type: 'deadline',
          program: program.name,
          deadline: program.deadline,
          totalHorses,
          paidCount,
          unpaidCount,
          horses: horsePaidStatus
        });
      }

      allDeadlines.push({
        program: program.name,
        deadline: program.deadline,
        month: deadlineMonth,
        day: deadlineDay,
        totalHorses: horses.filter(h => h.programs && h.programs.includes(program.name)).length,
        paidCount: horses.filter(h => h.programs && h.programs.includes(program.name) && h.programsPaid && h.programsPaid[program.name]).length
      });
    });

    return { eventMap, allDeadlines };
  }, [programs, horses, currentMonth]);

  const upcomingDeadlines = useMemo(() => {
    return events.allDeadlines
      .filter(d => {
        const month = monthOrder[d.month];
        const currentMonthNum = currentMonth.getMonth() + 1;
        const currentYear = currentMonth.getFullYear();
        const deadlineYear = new Date(currentMonth.getFullYear(), month - 1, d.day).getFullYear();

        return deadlineYear > currentYear || (deadlineYear === currentYear && month >= currentMonthNum);
      })
      .sort((a, b) => {
        const monthDiff = monthOrder[a.month] - monthOrder[b.month];
        return monthDiff !== 0 ? monthDiff : a.day - b.day;
      })
      .slice(0, 5);
  }, [events.allDeadlines, currentMonth]);

  if (loading) {
    return <div className="calendar-page">Loading calendar...</div>;
  }

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
          <div className="legend-item">📅 Deadline</div>
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
                    {events.eventMap[day] && events.eventMap[day].map((event, idx) => (
                      <div key={idx} className="event deadline" title={event.program}>
                        <span className="event-icon">📅</span>
                        <span className="event-label">{event.program}</span>
                        <span className="event-status">
                          {event.unpaidCount > 0 ? `Pay ${event.unpaidCount}` : 'All Paid'}
                        </span>
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
          {upcomingDeadlines.length > 0 ? (
            <div className="events-list">
              {upcomingDeadlines.map((deadline, idx) => (
                <div key={idx} className="event-item">
                  <div className="event-date">{deadline.deadline}</div>
                  <div className="event-details">
                    <div className="event-title">{deadline.program}</div>
                    <div className="event-status-text">
                      {deadline.unpaidCount > 0 
                        ? `${deadline.unpaidCount} horse${deadline.unpaidCount !== 1 ? 's' : ''} need${deadline.unpaidCount !== 1 ? '' : 's'} payment`
                        : 'All horses paid'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-events">No upcoming deadlines</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default CalendarView;