import React, { useState } from 'react';
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
  Building2,
  ShoppingCart,
  FileArchive,
  Calendar
} from 'lucide-react';

// Hardcoded system information
const SYSTEM_NAME_SHORT = 'Sangguniang Bayan';
const SYSTEM_NAME_FULL = 'Office Of The Sangguniang Bayan';
const MUNICIPALITY = 'Municipality of San Francisco';
const PROVINCE = 'Southern Leyte';

// Hardcoded contact information
const OFFICE_ADDRESS = 'Municipal Compound, San Francisco, Southern Leyte, Philippines';
const CONTACT_EMAIL = 'sb.sanfrancisco@gmail.com';
const CONTACT_PHONE = '0926-905-3859';
const FACEBOOK_URL = 'https://web.facebook.com/profile.php?id=61578350702689';

const PublicLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Split into 2 rows of 5 items each
  const navItemsRow1 = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/resolutions', label: 'Resolutions', icon: Scale },
    { path: '/ordinances', label: 'Ordinances', icon: FileText },
    { path: '/procurements', label: 'Procurements', icon: ShoppingCart },
    { path: '/documents', label: 'Documents', icon: FileArchive },
  ];

  const navItemsRow2 = [
    { path: '/vacancies', label: 'Vacancies', icon: Briefcase },
    { path: '/announcements', label: 'Announcements', icon: Bell },
    { path: '/news', label: 'News', icon: Newspaper },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/contact', label: 'Contact', icon: Mail },
  ];

  const allNavItems = [...navItemsRow1, ...navItemsRow2];

  const NavItem = ({ item, isMobile = false }: { item: typeof navItemsRow1[0]; isMobile?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    if (isMobile) {
      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
            active
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-blue-600'}`} />
          <span>{item.label}</span>
        </Link>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
          active
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
        }`}
      >
        <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-blue-600'}`} />
        <span className="whitespace-nowrap">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Logo and System Name */}
          <div className="flex items-center justify-between h-16">
            {/* Logo, Vertical Line, and System Name */}
            <Link to="/" className="flex items-center space-x-4">
              <img 
                src="/homepage-images/logo.png"
                alt="Sangguniang Bayan Logo"
                className="h-12 w-12 object-contain"
              />
              {/* Vertical Line */}
              <div className="hidden sm:block w-px h-10 bg-gray-800"></div>
              {/* System Name - visible on all screens */}
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-blue-900 whitespace-nowrap">
                  {SYSTEM_NAME_FULL}
                </h1>
                <p className="text-xs text-gray-600 whitespace-nowrap hidden sm:block">
                  {MUNICIPALITY}, {PROVINCE}
                </p>
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Navigation - 2 Rows of 5 items */}
          <nav className="hidden lg:block pb-4">
            {/* Row 1 */}
            <div className="flex items-center justify-center space-x-2 mb-2">
              {navItemsRow1.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex items-center justify-center space-x-2">
              {navItemsRow2.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </nav>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 pt-3 pb-4 space-y-2">
              {allNavItems.map((item) => (
                <NavItem key={item.path} item={item} isMobile />
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Hardcoded Footer */}
      <footer className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/homepage-images/logo.png" 
                  alt="Logo" 
                  className="h-12 w-auto object-contain" 
                />
                <div>
                  <h3 className="text-lg font-bold">{SYSTEM_NAME_SHORT}</h3>
                  <p className="text-xs text-blue-200">{MUNICIPALITY}, {PROVINCE}</p>
                </div>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                The local legislative body dedicated to transparency, accountability, 
                and excellent public service for the people of San Francisco.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-blue-700 pb-2">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/resolutions" className="text-blue-100 hover:text-white hover:underline transition">Resolutions</Link></li>
                <li><Link to="/ordinances" className="text-blue-100 hover:text-white hover:underline transition">Ordinances</Link></li>
                <li><Link to="/vacancies" className="text-blue-100 hover:text-white hover:underline transition">Job Vacancies</Link></li>
                <li><Link to="/announcements" className="text-blue-100 hover:text-white hover:underline transition">Announcements</Link></li>
                <li><Link to="/news" className="text-blue-100 hover:text-white hover:underline transition">News & Updates</Link></li>
                <li><Link to="/calendar" className="text-blue-100 hover:text-white hover:underline transition">Calendar of Activities</Link></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-blue-700 pb-2">Services</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/contact" className="text-blue-100 hover:text-white hover:underline transition">Contact Us</Link></li>
                <li><span className="text-blue-100">Public Assistance</span></li>
                <li><span className="text-blue-100">Legislative Support</span></li>
                <li><span className="text-blue-100">Document Request</span></li>
                <li><span className="text-blue-100">Schedule of Sessions</span></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4 border-b border-blue-700 pb-2">Contact Us</h3>
              <ul className="space-y-3 text-sm text-blue-100">
                <li className="flex items-start">
                  <Building2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{OFFICE_ADDRESS}</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{CONTACT_EMAIL}</span>
                </li>
                <li className="flex items-center">
                  <span className="h-5 w-5 mr-2 flex-shrink-0 text-center">📞</span>
                  <span>{CONTACT_PHONE}</span>
                </li>
              </ul>
              <a 
                href={FACEBOOK_URL}
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition"
              >
                <span className="mr-2">Facebook</span>
                <span>→</span>
              </a>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-10 pt-8 text-center">
            <p className="text-blue-200 text-sm">
              © {new Date().getFullYear()} {SYSTEM_NAME_SHORT} - {MUNICIPALITY}, {PROVINCE}. All rights reserved.
            </p>
            <p className="text-blue-300 text-xs mt-2">
              Official Website of the Sangguniang Bayan of San Francisco, Southern Leyte
            </p>
            <p className="text-blue-300 text-xs mt-2">
              Developed by: Servando S. Tio III
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
