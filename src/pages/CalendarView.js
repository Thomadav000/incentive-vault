import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { UserContext } from '../context/UserContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import './CalendarView.css';

const monthOrder = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5,
  'June': 6, 'July': 7, 'August': 8, 'September': 9, 'October': 10,
  'November': 11, 'December': 12
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function CalendarView() {
  const { horses, programs, loading, user } = useContext(UserContext);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [hoveredDeadline, setHoveredDeadline] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(() => {
    const saved = localStorage.getItem('calendarViewCollapsed');
    return saved ? JSON.parse(saved) : true;
  });

  // Personal Events State
  const [personalEvents, setPersonalEvents] = useState([]);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    month: '',
    day: '',
    year: new Date().getFullYear(),
    description: '',
    link: ''
  });
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('calendarActiveTab');
    return saved ? JSON.parse(saved) : 'deadlines';
  });

  // Fetch personal events with useCallback
  const fetchPersonalEventsCallback = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, 'personalEvents'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setPersonalEvents(events);
    } catch (error) {
      console.error('Error fetching personal events:', error);
    }
  }, [user?.uid]);

  // Fetch personal events on mount
  useEffect(() => {
    fetchPersonalEventsCallback();
  }, [fetchPersonalEventsCallback]);

  // Save active tab preference
  useEffect(() => {
    localStorage.setItem('calendarActiveTab', JSON.stringify(activeTab));
  }, [activeTab]);

  // Save calendar open/close preference
  useEffect(() => {
    localStorage.setItem('calendarViewCollapsed', JSON.stringify(isCalendarOpen));
  }, [isCalendarOpen]);

  const handleOpenModal = (selectedDate = null) => {
    if (selectedDate) {
      const parts = selectedDate.split(' ');
      setFormData({
        name: '',
        month: parts[0],
        day: parts[1],
        year: new Date().getFullYear(),
        description: '',
        link: ''
      });
    } else {
      setFormData({
        name: '',
        month: '',
        day: '',
        year: new Date().getFullYear(),
        description: '',
        link: ''
      });
    }
    setEditingEvent(null);
    setShowPersonalModal(true);
  };

  const handleEditEvent = (event) => {
    const parts = event.date.split(' ');
    setFormData({
      name: event.name,
      month: parts[0],
      day: parts[1],
      year: new Date().getFullYear(),
      description: event.description,
      link: event.link || ''
    });
    setEditingEvent(event);
    setShowPersonalModal(true);
  };

  const handleCloseModal = () => {
    setShowPersonalModal(false);
    setEditingEvent(null);
    setFormData({ name: '', month: '', day: '', year: new Date().getFullYear(), description: '', link: '' });
  };

  const handleSaveEvent = async () => {
    if (!formData.name || !formData.month || !formData.day || !user?.uid) {
      alert('Event name, month, and day are required');
      return;
    }

    const dateString = `${formData.month} ${formData.day}`;

    try {
      if (editingEvent) {
        // Update existing event
        const eventDoc = doc(db, 'personalEvents', editingEvent.id);
        await updateDoc(eventDoc, {
          name: formData.name,
          date: dateString,
          description: formData.description,
          link: formData.link,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new event
        await addDoc(collection(db, 'personalEvents'), {
          userId: user.uid,
          name: formData.name,
          date: dateString,
          description: formData.description,
          link: formData.link,
          createdAt: serverTimestamp()
        });
      }
      await fetchPersonalEventsCallback();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Delete this event?')) {
      try {
        await deleteDoc(doc(db, 'personalEvents', eventId));
        await fetchPersonalEventsCallback();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
      }
    }
  };

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

      const horsesInProgram = horses.filter(h => 
        h.programs && h.programs.some(p => p.name === program.name)
      );

      const horsePaidStatus = horsesInProgram.map(h => {
        const horseProgram = h.programs.find(p => p.name === program.name);
        return {
          name: h.barnName,
          isPaid: horseProgram && horseProgram.status === 'Eligible - Paid'
        };
      });

      const totalHorses = horsesInProgram.length;
      const paidCount = horsePaidStatus.filter(h => h.isPaid).length;
      const unpaidCount = totalHorses - paidCount;

      if (monthOrder[deadlineMonth] === currentMonth.getMonth() + 1) {
        if (!eventMap[deadlineDay]) {
          eventMap[deadlineDay] = [];
        }

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

      const unpaidHorses = horsePaidStatus.filter(h => !h.isPaid).map(h => h.name);

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

    // Add personal events to eventMap
    personalEvents.forEach(event => {
      const eventMonth = event.date.split(' ')[0];
      const eventDay = parseInt(event.date.split(' ')[1]);

      if (monthOrder[eventMonth] === currentMonth.getMonth() + 1) {
        if (!eventMap[eventDay]) {
          eventMap[eventDay] = [];
        }

        eventMap[eventDay].push({
          type: 'personal',
          name: event.name,
          date: event.date,
          description: event.description,
          link: event.link,
          id: event.id
        });
      }
    });

    return { eventMap, allDeadlines };
  }, [programs, horses, currentMonth, personalEvents]);

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

  const upcomingPersonalEvents = useMemo(() => {
    return personalEvents
      .filter(e => {
        const eventMonth = e.date.split(' ')[0];
        const eventDay = parseInt(e.date.split(' ')[1]);
        const month = monthOrder[eventMonth];
        const currentMonthNum = currentMonth.getMonth() + 1;
        const currentYear = currentMonth.getFullYear();
        const eventYear = new Date(currentMonth.getFullYear(), month - 1, eventDay).getFullYear();

        return eventYear > currentYear || (eventYear === currentYear && month >= currentMonthNum);
      })
      .sort((a, b) => {
        const monthA = monthOrder[a.date.split(' ')[0]];
        const dayA = parseInt(a.date.split(' ')[1]);
        const monthB = monthOrder[b.date.split(' ')[0]];
        const dayB = parseInt(b.date.split(' ')[1]);

        const monthDiff = monthA - monthB;
        return monthDiff !== 0 ? monthDiff : dayA - dayB;
      })
      .slice(0, 5);
  }, [personalEvents, currentMonth]);

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
          <button className="btn-add-event" onClick={() => handleOpenModal()}>+ Add Event</button>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">Deadline</div>
          <div className="legend-item">Personal Event</div>
        </div>

        {/* COLLAPSIBLE CALENDAR SECTION */}
        <div className="calendar-section">
          <div className="calendar-header-bar">
            <span className="calendar-label">Calendar</span>
            <button 
              className="btn-collapse-calendar"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              title={isCalendarOpen ? 'Collapse' : 'Expand'}
            >
              {isCalendarOpen ? '▼' : '▲'}
            </button>
          </div>

          {isCalendarOpen && (
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
                            className={`event ${event.type === 'deadline' ? 'deadline' : 'personal-event'}`}
                            onMouseEnter={() => setHoveredDeadline(`grid-${day}-${idx}`)}
                            onMouseLeave={() => setHoveredDeadline(null)}
                          >
                            <span className="event-label">
                              {event.type === 'deadline' ? event.program : event.name}
                            </span>
                            {event.type === 'deadline' && (
                              <span className="event-status">
                                {event.unpaidCount > 0 ? `Pay ${event.unpaidCount}` : 'All Paid'}
                              </span>
                            )}
                            {hoveredDeadline === `grid-${day}-${idx}` && event.type === 'deadline' && (
                              <button 
                                className="btn-add-to-calendar"
                                onClick={() => downloadCalendarEvent({ program: event.program, month: monthOrder[currentMonth.toLocaleString('default', { month: 'long' })], day: day, deadline: event.deadline, unpaidCount: event.unpaidCount, unpaidHorseNames: event.horses.filter(h => !h.isPaid).map(h => h.name) })}
                              >
                                Add to Calendar
                              </button>
                            )}
                            {hoveredDeadline === `grid-${day}-${idx}` && event.type === 'personal' && (
                              <div className="event-actions">
                                <button className="btn-edit-event" onClick={() => handleEditEvent(event)}>Edit</button>
                                <button className="btn-delete-event" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOGGLE TABS */}
        <div className="events-tab-container">
          <button 
            className={`tab-button ${activeTab === 'deadlines' ? 'active' : ''}`}
            onClick={() => setActiveTab('deadlines')}
          >
            Upcoming Deadlines
          </button>
          <button 
            className={`tab-button ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Events
          </button>
        </div>

        {/* UPCOMING DEADLINES SECTION */}
        {activeTab === 'deadlines' && (
          <section className={`upcoming-events ${!isCalendarOpen ? 'slide-up' : ''}`}>
            <h2>Upcoming Deadlines</h2>
            {upcomingDeadlines.length > 0 ? (
              <div className="events-list">
                {upcomingDeadlines.map((deadline, idx) => (
                  <div 
                    key={idx} 
                    className="event-item deadline-item"
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
        )}

        {/* PERSONAL EVENTS SECTION */}
        {activeTab === 'personal' && (
          <section className={`upcoming-events ${!isCalendarOpen ? 'slide-up' : ''}`}>
            <h2>Personal Events</h2>
            {upcomingPersonalEvents.length > 0 ? (
              <div className="events-list">
                {upcomingPersonalEvents.map((event, idx) => (
                  <div 
                    key={idx} 
                    className="event-item personal-item"
                    onMouseEnter={() => setHoveredDeadline(`personal-${idx}`)}
                    onMouseLeave={() => setHoveredDeadline(null)}
                  >
                    <div className="event-date">{event.date}</div>
                    <div className="event-details">
                      <div className="event-title">{event.name}</div>
                      {event.description && (
                        <div className="event-status-text">{event.description}</div>
                      )}
                      {event.link && (
                        <a href={event.link} target="_blank" rel="noopener noreferrer" className="event-link">
                          View Details
                        </a>
                      )}
                    </div>
                    {hoveredDeadline === `personal-${idx}` && (
                      <div className="event-actions">
                        <button className="btn-edit-event" onClick={() => handleEditEvent(event)}>Edit</button>
                        <button className="btn-delete-event" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-events">No personal events</p>
            )}
          </section>
        )}
      </div>

      {/* PERSONAL EVENT MODAL */}
      {showPersonalModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEvent ? 'Edit Event' : 'Add Personal Event'}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEvent(); }}>
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Horse Show, Vet Appointment"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <div className="date-selectors">
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  >
                    <option value="">Month</option>
                    {monthNames.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>

                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                  >
                    <option value="">Day</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>

                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about this event"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Link (Optional)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-save">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarView;