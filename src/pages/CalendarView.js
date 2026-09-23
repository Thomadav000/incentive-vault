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
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [hoveredDeadline, setHoveredDeadline] = useState(null);

  const today = new Date();
  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && 
                         currentMonth.getMonth() === today.getMonth();

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
          name: h.barnName,
          isPaid: h.programsPaid && h.programsPaid[program.name] === true
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

      const horsesInProgram = horses.filter(h => h.programs && h.programs.includes(program.name));
      const horsePaidStatus = horsesInProgram.map(h => ({
        name: h.barnName,
        isPaid: h.programsPaid && h.programsPaid[program.name] === true
      }));
      const unpaidHorses = horsePaidStatus.filter(h => !h.isPaid).map(h => h.name);
      const paidCount = horsePaidStatus.filter(h => h.isPaid).length;
      const unpaidCount = horsesInProgram.length - paidCount;

      allDeadlines.push({
        program: program.name,
        deadline: program.deadline,
        month: deadlineMonth,
        day: deadlineDay,
        totalHorses: horsesInProgram.length,
        paidCount,
        unpaidCount,
        horseNames: horsesInProgram.map(h => h.barnName),
        unpaidHorseNames: unpaidHorses
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

  const getDeadlineText = (deadline) => {
    if (deadline.unpaidCount === 0) {
      return 'All horses paid';
    }
    const horseNames = deadline.unpaidHorseNames.join(', ');
    const verb = deadline.unpaidCount === 1 ? 'needs' : 'need';
    return `${horseNames} ${verb} payment`;
  };

  const createIcsEvent = (deadline) => {
    const eventDate = new Date(currentMonth.getFullYear(), monthOrder[deadline.month] - 1, deadline.day);
    const year = eventDate.getFullYear();
    const month = String(eventDate.getMonth() + 1).padStart(2, '0');
    const day = String(eventDate.getDate()).padStart(2, '0');
    const dtstart = `${year}${month}${day}`;

    const eventTitle = `${deadline.program} - Payment Due`;
    const eventDescription = getDeadlineText(deadline);
    const enrollmentUrl = programs[deadline.program]?.website || 'https://theincentivevault.com';

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Incentive Vault//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${deadline.program}-${dtstart}@theincentivevault.com
DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}
DTSTART:${dtstart}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}\\nEnroll: ${enrollmentUrl}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
  };

  const downloadCalendarEvent = (deadline) => {
    const icsContent = createIcsEvent(deadline);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deadline.program.replace(/\s+/g, '_')}_${deadline.deadline.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadMonthCalendar = () => {
    const currentMonthNum = currentMonth.getMonth() + 1;
    const monthDeadlines = events.allDeadlines.filter(d => monthOrder[d.month] === currentMonthNum);

    if (monthDeadlines.length === 0) {
      alert('No deadlines this month');
      return;
    }

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Incentive Vault//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${monthName} - Incentive Vault
X-WR-TIMEZONE:UTC
`;

    monthDeadlines.forEach(deadline => {
      const eventDate = new Date(currentMonth.getFullYear(), monthOrder[deadline.month] - 1, deadline.day);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const dtstart = `${year}${month}${day}`;

      const eventTitle = `${deadline.program} - Payment Due`;
      const eventDescription = getDeadlineText(deadline);
      const enrollmentUrl = programs[deadline.program]?.website || 'https://theincentivevault.com';

      icsContent += `BEGIN:VEVENT
UID:${deadline.program}-${dtstart}@theincentivevault.com
DTSTAMP:${new Date().toISOString().replace(/[-:.]/g, '')}
DTSTART:${dtstart}
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}\\nEnroll: ${enrollmentUrl}
STATUS:CONFIRMED
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Incentive_Vault_${monthName.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

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
          <button className="btn-add-month-calendar" onClick={downloadMonthCalendar}>Add Month to Calendar</button>
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
            <div key={index} className={`calendar-day ${day ? '' : 'empty'} ${isCurrentMonth && day === today.getDate() ? 'today' : ''}`}>
              {day && (
                <>
                  <div className="day-number">{day}</div>
                  <div className="day-events">
                    {events.eventMap[day] && events.eventMap[day].map((event, idx) => (
                      <div 
                        key={idx} 
                        className="event deadline"
                        onMouseEnter={() => setHoveredDeadline(`grid-${day}-${idx}`)}
                        onMouseLeave={() => setHoveredDeadline(null)}
                      >
                        <span className="event-icon">📅</span>
                        <span className="event-label">{event.program}</span>
                        <span className="event-status">
                          {event.unpaidCount > 0 ? `Pay ${event.unpaidCount}` : 'All Paid'}
                        </span>
                        {hoveredDeadline === `grid-${day}-${idx}` && (
                          <button 
                            className="btn-add-to-calendar"
                            onClick={() => downloadCalendarEvent({ program: event.program, month: monthOrder[currentMonth.toLocaleString('default', { month: 'long' })], day: day, deadline: event.deadline, unpaidCount: event.unpaidCount, unpaidHorseNames: event.horses.filter(h => !h.isPaid).map(h => h.name) })}
                          >
                            Add to Calendar
                          </button>
                        )}
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
                <div 
                  key={idx} 
                  className="event-item"
                  onMouseEnter={() => setHoveredDeadline(`upcoming-${idx}`)}
                  onMouseLeave={() => setHoveredDeadline(null)}
                >
                  <div className="event-date">{deadline.deadline}</div>
                  <div className="event-details">
                    <div className="event-title">{deadline.program}</div>
                    <div className="event-status-text">
                      {getDeadlineText(deadline)}
                    </div>
                  </div>
                  {hoveredDeadline === `upcoming-${idx}` && (
                    <button 
                      className="btn-add-to-calendar"
                      onClick={() => downloadCalendarEvent(deadline)}
                    >
                      Add to Calendar
                    </button>
                  )}
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