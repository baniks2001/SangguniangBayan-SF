import React, { useState, useEffect } from 'react';
import { announcementsApi } from '../services/api';
import { Bell, Calendar, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  isActive: boolean;
  expiryDate?: string;
  createdAt: string;
}

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementsApi.getAll();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'High':
        return <Info className="h-5 w-5 text-orange-600" />;
      default:
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 border-red-400';
      case 'High':
        return 'bg-orange-50 border-orange-400';
      default:
        return 'bg-blue-50 border-blue-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Bell className="h-8 w-8 mr-3 text-red-600" />
          Announcements
        </h1>
        <p className="mt-2 text-gray-600">
          Stay informed with the latest announcements and advisories from the Sangguniang Bayan.
        </p>
      </div>

      {/* Announcements List */}
      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`border-l-4 rounded-r-lg shadow p-6 ${getPriorityColor(announcement.priority)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getPriorityIcon(announcement.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {announcement.content}
                  </div>
                  {announcement.expiryDate && (
                    <p className="text-sm text-gray-500 mt-4">
                      Valid until: {new Date(announcement.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
          <p className="text-gray-500">There are currently no active announcements.</p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
