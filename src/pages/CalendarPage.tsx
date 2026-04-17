import React, { useState, useEffect } from 'react';
import { calendarApi } from '../services/api';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: 'session' | 'hearing' | 'special' | 'holiday' | 'other';
  location: string;
}

const eventTypeColors: Record<string, string> = {
  session: 'bg-blue-100 text-blue-800 border-blue-300',
  hearing: 'bg-green-100 text-green-800 border-green-300',
  special: 'bg-purple-100 text-purple-800 border-purple-300',
  holiday: 'bg-red-100 text-red-800 border-red-300',
  other: 'bg-gray-100 text-gray-800 border-gray-300'
};

const eventTypeLabels: Record<string, string> = {
  session: 'Regular Session',
  hearing: 'Public Hearing',
  special: 'Special Session',
  holiday: 'Holiday',
  other: 'Other Event'
};

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [filter, setFilter] = useState<'all' | 'upcoming'>('all');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter === 'upcoming') {
        params.upcoming = true;
      }
      const response = await calendarApi.getPublic(params);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getEventsForDate = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentMonth &&
             eventDate.getFullYear() === currentYear;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Calendar of Activities
          </h1>
          <p className="mt-2 text-gray-600">
            View scheduled sessions, hearings, and other activities of the Sangguniang Bayan
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Upcoming Events
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading calendar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Calendar View */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-3 sm:p-6 overflow-x-auto">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={prevMonth}
                  className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                </button>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px sm:gap-1 min-w-[300px]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <div key={day + idx} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-1 sm:py-2">
                    <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                    <span className="sm:hidden">{day}</span>
                  </div>
                ))}
                
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="h-16 sm:h-24 border border-gray-100"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dayEvents = getEventsForDate(day);
                  const isToday = new Date().getDate() === day && 
                                  new Date().getMonth() === currentMonth && 
                                  new Date().getFullYear() === currentYear;

                  return (
                    <div
                      key={day}
                      className={`h-16 sm:h-24 border border-gray-100 p-1 transition-colors hover:bg-gray-50 ${
                        isToday ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {day}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {dayEvents.slice(0, 1).map(event => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`w-full text-left text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded border truncate ${eventTypeColors[event.eventType]}`}
                          >
                            <span className="hidden sm:inline">{event.title}</span>
                            <span className="sm:hidden">•</span>
                          </button>
                        ))}
                        {dayEvents.length > 1 && (
                          <div className="text-[10px] sm:text-xs text-gray-500 text-center">
                            +{dayEvents.length - 1} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Events This Month</h3>
              <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events scheduled</p>
                ) : (
                  events.map(event => {
                    const eventDate = new Date(event.eventDate);
                    const isCurrentMonth = eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
                    if (!isCurrentMonth) return null;
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full text-left p-4 rounded-lg border hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${eventTypeColors[event.eventType]}`}>
                            {eventTypeLabels[event.eventType]}
                          </div>
                        </div>
                        <h4 className="font-semibold text-gray-900 mt-2">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.eventDate)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Event Type Legend */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Event Types</h3>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${eventTypeColors[type].split(' ')[0]}`}></div>
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${eventTypeColors[selectedEvent.eventType]}`}>
                  {eventTypeLabels[selectedEvent.eventType]}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedEvent.title}</h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Date</p>
                  <p className="text-gray-600">{formatDate(selectedEvent.eventDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Time</p>
                  <p className="text-gray-600">{formatTime(selectedEvent.eventDate)}</p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-600">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Description</p>
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
