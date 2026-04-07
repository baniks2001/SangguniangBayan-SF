import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Scale, 
  FileText, 
  Briefcase, 
  Bell, 
  Newspaper, 
  Mail,
  Menu,
  X,
  Home,
  Building2
} from 'lucide-react';
import { settingsApi } from '../services/api';

interface Settings {
  municipality_name?: string;
  province?: string;
  site_name?: string;
  office_address?: string;
  contact_email?: string;
  contact_phone?: string;
  site_logo?: string;
  facebook_url?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '');

const PublicLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const location = useLocation();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getPublicConfig();
      setSettings(response.config || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/resolutions', label: 'Resolutions', icon: Scale },
    { path: '/ordinances', label: 'Ordinances', icon: FileText },
    { path: '/vacancies', label: 'Vacancies', icon: Briefcase },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/news', label: 'News', icon: Newspaper },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              {settings.site_logo ? (
                <img 
                  src={`${STATIC_BASE_URL}${settings.site_logo}`}
                  alt="Logo"
                  className="h-10 w-10 object-contain rounded"
                />
              ) : (
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {settings.site_name || 'Sangguniang Bayan'}
                </h1>
                <p className="text-xs text-gray-600">
                  {settings.municipality_name || 'San Francisco'}, {settings.province || 'Southern Leyte'}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {settings.site_name || 'Sangguniang Bayan'}
              </h3>
              <p className="text-gray-400 text-sm">
                {settings.municipality_name || 'San Francisco'}, {settings.province || 'Southern Leyte'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Local legislative body dedicated to transparency and public service.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/resolutions" className="text-gray-400 hover:text-white">Resolutions</Link></li>
                <li><Link to="/ordinances" className="text-gray-400 hover:text-white">Ordinances</Link></li>
                <li><Link to="/vacancies" className="text-gray-400 hover:text-white">Job Vacancies</Link></li>
                <li><Link to="/announcements" className="text-gray-400 hover:text-white">Announcements</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>{settings.office_address || 'Municipal Hall, San Francisco, Southern Leyte'}</li>
                <li>Email: {settings.contact_email || 'sb.sanfrancisco@gmail.com'}</li>
                <li>Phone: {settings.contact_phone || '(053) 514-1234'}</li>
              </ul>
              {settings.facebook_url && (
                <a 
                  href={settings.facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-blue-400 hover:text-blue-300"
                >
                  Follow us on Facebook
                </a>
              )}
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} {settings.site_name || 'Sangguniang Bayan'} - {settings.municipality_name || 'San Francisco'}, {settings.province || 'Southern Leyte'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
