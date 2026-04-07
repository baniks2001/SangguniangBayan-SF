import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, 
  FileText, 
  Briefcase, 
  Bell, 
  Newspaper, 
  ChevronRight,
  Building2,
  Users,
  Gavel,
  Heart,
  Target,
  ChevronLeft,
  User,
  Calendar
} from 'lucide-react';
import { 
  resolutionsApi, 
  ordinancesApi, 
  vacanciesApi, 
  announcementsApi, 
  newsApi, 
  settingsApi, 
  organizationApi, 
  calendarApi 
} from '../services/api';

interface Settings {
  municipalityName?: string;
  provinceName?: string;
  sbTitle?: string;
  welcomeTitle?: string;
  welcomeMessage?: string;
  heroImage?: string;
  hero_title?: string;
  hero_subtitle?: string;
  site_name?: string;
}

interface Resolution {
  id: string;
  resolutionNumber: string;
  series: string;
  title: string;
  status: string;
}

interface Ordinance {
  id: string;
  ordinanceNumber: string;
  series: string;
  title: string;
  status: string;
}

interface Vacancy {
  id: string;
  jobTitle: string;
  position: string;
  department: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
}

interface OrgMember {
  id: string;
  name: string;
  position: string;
  category: 'vice_mayor' | 'sb_members' | 'legislative_staff';
  description?: string;
  imageUrl?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  eventType: string;
  location?: string;
}

const HomePage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [ordinances, setOrdinances] = useState<Ordinance[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, resolutionsRes, ordinancesRes, vacanciesRes, announcementsRes, newsRes, orgRes, calendarRes] = await Promise.all([
        settingsApi.getPublicConfig().catch(() => ({ config: {} })),
        resolutionsApi.getAll({ limit: 5, status: 'Approved', isPublic: true }).catch(() => ({ resolutions: [] })),
        ordinancesApi.getAll({ limit: 5, status: 'Approved', isPublic: true }).catch(() => ({ ordinances: [] })),
        vacanciesApi.getAll().catch(() => ({ vacancies: [] })),
        announcementsApi.getAll().catch(() => ({ announcements: [] })),
        newsApi.getAll({ limit: 3 }).catch(() => ({ news: [] })),
        organizationApi.getPublic().catch(() => ({ members: [] })),
        calendarApi.getPublic({ upcoming: true, limit: 5 }).catch(() => ({ events: [] }))
      ]);

      setSettings(settingsRes.config || {});
      setResolutions(resolutionsRes.resolutions || []);
      setOrdinances(ordinancesRes.ordinances || []);
      setVacancies(vacanciesRes.vacancies || []);
      setAnnouncements(announcementsRes.announcements || []);
      setNews(newsRes.news || []);
      setOrgMembers(orgRes.members || []);
      setCalendarEvents(calendarRes.events || []);
    } catch (error) {
      console.error('Error loading home page data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Building2 className="h-16 w-16 text-blue-300" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {settings.hero_title || settings.welcomeTitle || 'Welcome to Sangguniang Bayan'}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-2">
              {settings.hero_subtitle || settings.municipalityName || 'San Francisco'}, {settings.provinceName || 'Southern Leyte'}
            </p>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              {settings.welcomeMessage || 'Transparency in Governance, Service to the People'}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Scale className="h-8 w-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{resolutions.length}+</p>
            <p className="text-sm text-gray-600">Resolutions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{ordinances.length}+</p>
            <p className="text-sm text-gray-600">Ordinances</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Briefcase className="h-8 w-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{vacancies.length}</p>
            <p className="text-sm text-gray-600">Job Openings</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Newspaper className="h-8 w-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{news.length}+</p>
            <p className="text-sm text-gray-600">News Articles</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">About Sangguniang Bayan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mission</h3>
              <p className="text-gray-600 text-sm">
                To enact ordinances, approve resolutions, and ensure the delivery of basic services to the community.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Vision</h3>
              <p className="text-gray-600 text-sm">
                A progressive and transparent local legislative body serving the people with integrity and excellence.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gavel className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mandate</h3>
              <p className="text-gray-600 text-sm">
                To legislate for the welfare of the municipality and exercise oversight functions over the executive branch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Resolutions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Scale className="h-6 w-6 mr-2 text-blue-600" />
              Recent Resolutions
            </h2>
            <Link to="/resolutions" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {resolutions.slice(0, 3).map((resolution) => (
              <div key={resolution.id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50">
                <p className="text-sm text-gray-500">Resolution No. {resolution.resolutionNumber}, Series {resolution.series}</p>
                <p className="font-medium text-gray-900 line-clamp-1">{resolution.title}</p>
              </div>
            ))}
            {resolutions.length === 0 && (
              <p className="text-gray-500 text-center py-4">No resolutions available</p>
            )}
          </div>
        </div>
      </section>

      {/* Recent Ordinances */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FileText className="h-6 w-6 mr-2 text-green-600" />
              Recent Ordinances
            </h2>
            <Link to="/ordinances" className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {ordinances.slice(0, 3).map((ordinance) => (
              <div key={ordinance.id} className="border-l-4 border-green-500 pl-4 py-2 hover:bg-gray-50">
                <p className="text-sm text-gray-500">Ordinance No. {ordinance.ordinanceNumber}, Series {ordinance.series}</p>
                <p className="font-medium text-gray-900 line-clamp-1">{ordinance.title}</p>
              </div>
            ))}
            {ordinances.length === 0 && (
              <p className="text-gray-500 text-center py-4">No ordinances available</p>
            )}
          </div>
        </div>
      </section>

      {/* Job Vacancies */}
      {vacancies.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                <Briefcase className="h-6 w-6 mr-2" />
                Job Vacancies
              </h2>
              <Link to="/vacancies" className="text-white/90 hover:text-white flex items-center text-sm font-medium">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vacancies.slice(0, 3).map((vacancy) => (
                <div key={vacancy.id} className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/20 transition-colors">
                  <p className="font-semibold">{vacancy.jobTitle}</p>
                  <p className="text-sm text-white/80">{vacancy.position}</p>
                  <p className="text-xs text-white/60 mt-1">{vacancy.department}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest News */}
      {news.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Newspaper className="h-6 w-6 mr-2 text-purple-600" />
                Latest News
              </h2>
              <Link to="/news" className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.slice(0, 3).map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-4">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-2">
                      {item.category}
                    </span>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Bell className="h-6 w-6 mr-2 text-red-600" />
                Announcements
              </h2>
              <Link to="/announcements" className="text-red-600 hover:text-red-800 flex items-center text-sm font-medium">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className={`border-l-4 pl-4 py-2 ${
                  announcement.priority === 'Urgent' ? 'border-red-500 bg-red-50' :
                  announcement.priority === 'High' ? 'border-orange-500 bg-orange-50' :
                  'border-blue-500'
                }`}>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded mb-1 ${
                    announcement.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                    announcement.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {announcement.priority}
                  </span>
                  <p className="font-medium text-gray-900">{announcement.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Calendar of Activities */}
      {calendarEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                Upcoming Activities
              </h2>
              <Link to="/calendar" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-3">
              {calendarEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-lg font-bold text-blue-600">
                      {new Date(event.eventDate).getDate()}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">
                      {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        {event.eventType === 'session' ? 'Regular Session' : 
                         event.eventType === 'hearing' ? 'Public Hearing' :
                         event.eventType === 'special' ? 'Special Session' :
                         event.eventType === 'holiday' ? 'Holiday' : 'Other'}
                      </span>
                      {event.location && (
                        <span>📍 {event.location}</span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Legislative Organization */}
      {orgMembers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Legislative Organization</h2>
            
            {/* Vice Mayor */}
            {orgMembers.filter(m => m.category === 'vice_mayor').length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">Presiding Officer</h3>
                <div className="flex justify-center">
                  {orgMembers.filter(m => m.category === 'vice_mayor').map(member => (
                    <div key={member.id} className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl overflow-hidden shadow-lg max-w-xs">
                      <div className="aspect-[3/4] w-full bg-gray-200">
                        {member.imageUrl ? (
                          <img 
                            src={`http://localhost:5000${member.imageUrl}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <User className="h-20 w-20 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <p className="font-bold text-gray-900 text-lg">{member.name}</p>
                        <p className="text-red-700 font-medium">{member.position}</p>
                        {member.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{member.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SB Members */}
            {orgMembers.filter(m => m.category === 'sb_members').length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-gray-700 mb-6 text-center">Sangguniang Bayan Members</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {orgMembers.filter(m => m.category === 'sb_members').map(member => (
                    <div key={member.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl overflow-hidden shadow-lg">
                      <div className="aspect-[3/4] w-full bg-gray-200">
                        {member.imageUrl ? (
                          <img 
                            src={`http://localhost:5000${member.imageUrl}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <User className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-blue-700 font-medium text-sm">{member.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legislative Staff */}
            {orgMembers.filter(m => m.category === 'legislative_staff').length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-semibold text-gray-700 mb-6 text-center">Legislative Staff</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {orgMembers.filter(m => m.category === 'legislative_staff').map(member => (
                    <div key={member.id} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl overflow-hidden shadow-lg">
                      <div className="aspect-[3/4] w-full bg-gray-200">
                        {member.imageUrl ? (
                          <img 
                            src={`http://localhost:5000${member.imageUrl}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <User className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 text-center">
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-green-700 font-medium text-sm">{member.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
