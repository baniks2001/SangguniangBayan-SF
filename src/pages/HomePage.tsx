import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scale, 
  FileText, 
  Briefcase, 
  Bell, 
  Newspaper, 
  ChevronRight,
  ChevronLeft,
  Target,
  Heart,
  Gavel,
  Clock,
  Users,
  Building2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { 
  resolutionsApi, 
  ordinancesApi, 
  vacanciesApi, 
  announcementsApi, 
  newsApi 
} from '../services/api';

// Hardcoded system information
const WELCOME_TITLE = 'Welcome to Sangguniang Bayan Transparency Website';
const WELCOME_SUBTITLE = 'Municipal Compound, San Francisco, Southern Leyte, 6613 Philippines';
const WELCOME_MESSAGE = 'Transparency in Governance, Service to the People';

// Hero carousel images from homepage-images folder
const HERO_IMAGES = [
  '/homepage-images/hero-bg.jpg',
  '/homepage-images/hero-bg2.jpg',
  '/homepage-images/hero-bg3.jpg'
];

// Organization categories with descriptive image names
const ORGANIZATION_CATEGORIES = [
  {
    id: 'vice_mayor',
    name: 'Vice Mayor',
    description: 'Presiding Officer',
    images: ['/homepage-images/vice-mayor.jpg']
  },
  {
    id: 'sb_members',
    name: 'SB Members',
    description: 'Sangguniang Bayan Members',
    images: ['/homepage-images/sb-member-1.jpg', '/homepage-images/sb-member-2.jpg', '/homepage-images/sb-member-3.jpg','/homepage-images/sb-member-4.jpg', '/homepage-images/sb-member-5.jpg', '/homepage-images/sb-member-7.jpg', '/homepage-images/sb-member-8.jpg']
  },
  {
    id: 'sb_secretary',
    name: 'SB Secretary',
    description: 'Secretary to the SB',
    images: ['/homepage-images/sb-secretary.jpg']
  },
  {
    id: 'legislative_staff',
    name: 'Legislative Staff',
    description: 'Support Staff',
    images: ['/homepage-images/staff-1.jpg', '/homepage-images/staff-2.jpg', '/homepage-images/staff-3.jpg', '/homepage-images/staff-4.jpg', '/homepage-images/staff-5.jpg', '/homepage-images/staff-6.jpg', '/homepage-images/staff-7.jpg', '/homepage-images/staff-8.jpg', '/homepage-images/staff-9.jpg', '/homepage-images/staff-10.jpg']
  }
];

// Hardcoded statistics - default values
const DEFAULT_STATS = { resolutions: 0, ordinances: 0, yearsServing: 35, population: '13,000+' };

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [resolutions, setResolutions] = useState<any[]>([]);
  const [ordinances, setOrdinances] = useState<any[]>([]);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resolutionsRes, ordinancesRes, vacanciesRes, announcementsRes, newsRes, allResolutions, allOrdinances] = await Promise.all([
        resolutionsApi.getAll({ limit: 3, status: 'Approved', isPublic: true }).catch(() => ({ resolutions: [], pagination: { totalItems: 0 } })),
        ordinancesApi.getAll({ limit: 3, status: 'Approved', isPublic: true }).catch(() => ({ ordinances: [], pagination: { totalItems: 0 } })),
        vacanciesApi.getAll().catch(() => ({ vacancies: [] })),
        announcementsApi.getAll().catch(() => ({ announcements: [] })),
        newsApi.getAll({ limit: 3 }).catch(() => ({ news: [] })),
        resolutionsApi.getAll({ status: 'Approved', isPublic: true, limit: 1 }).catch(() => ({ pagination: { totalItems: 0 } })),
        ordinancesApi.getAll({ status: 'Approved', isPublic: true, limit: 1 }).catch(() => ({ pagination: { totalItems: 0 } }))
      ]);
      setResolutions(resolutionsRes.resolutions || []);
      setOrdinances(ordinancesRes.ordinances || []);
      setVacancies(vacanciesRes.vacancies || []);
      setAnnouncements(announcementsRes.announcements || []);
      setNews(newsRes.news || []);
      // Update stats with actual counts from database
      setStats(prev => ({
        ...prev,
        resolutions: allResolutions.pagination?.totalItems || 0,
        ordinances: allOrdinances.pagination?.totalItems || 0
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = useCallback(() => setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length), []);
  const prevSlide = useCallback(() => setCurrentSlide((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length), []);

  // Organization Image Carousel Component
  const OrganizationCarousel = ({ category }: { category: typeof ORGANIZATION_CATEGORIES[0] }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const images = category.images;

    useEffect(() => {
      if (images.length > 1) {
        const timer = setInterval(() => setCurrentImage((prev) => (prev + 1) % images.length), 3000);
        return () => clearInterval(timer);
      }
    }, [images.length]);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative aspect-[4/5] w-full bg-gray-100">
          {images.map((src, index) => (
            <img key={index} src={src} alt={`${category.name} - ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${index === currentImage ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          {images.length > 1 && (
            <>
              <button onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition">
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button key={index} onClick={() => setCurrentImage(index)} className={`w-2 h-2 rounded-full transition ${index === currentImage ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-4 text-center bg-gradient-to-b from-white to-gray-50">
          <h4 className="font-bold text-gray-900 text-lg">{category.name}</h4>
          <p className="text-blue-600 font-medium text-sm">{category.description}</p>
        </div>
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-0">
      {/* Hero Section with Image Carousel */}
      <section className="relative h-[600px] overflow-hidden">
        {HERO_IMAGES.map((src, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
            <img src={src} alt={`Hero ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 via-blue-800/70 to-blue-900/80"></div>
          </div>
        ))}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
          <div className="mb-6 bg-white/10 backdrop-blur-sm p-4 rounded-full animate-fade-in-up">
            <img src="/homepage-images/logo.png" alt="Logo" className="h-32 w-32 md:h-48 md:w-48 object-contain animate-pulse-slow" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-center drop-shadow-lg animate-fade-in-up delay-200">{WELCOME_TITLE}</h1>
          <p className="text-xl md:text-3xl text-blue-100 mb-2 text-center drop-shadow-md animate-fade-in-up delay-400">{WELCOME_SUBTITLE}</p>
          <p className="text-lg md:text-xl text-blue-200 text-center max-w-2xl drop-shadow-sm animate-fade-in-up delay-600">{WELCOME_MESSAGE}</p>
        </div>
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition"><ChevronLeft className="h-8 w-8" /></button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm transition"><ChevronRight className="h-8 w-8" /></button>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
          {HERO_IMAGES.map((_, index) => (
            <button key={index} onClick={() => setCurrentSlide(index)} className={`w-3 h-3 rounded-full transition ${index === currentSlide ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center text-white animate-fade-in-up"><Scale className="h-10 w-10 mx-auto text-blue-300 mb-3 animate-bounce-slow" /><p className="text-4xl font-bold animate-count-up">{stats.resolutions}+</p><p className="text-blue-200 mt-1">Resolutions</p></div>
            <div className="text-center text-white animate-fade-in-up delay-100"><FileText className="h-10 w-10 mx-auto text-green-300 mb-3 animate-bounce-slow" /><p className="text-4xl font-bold animate-count-up">{stats.ordinances}+</p><p className="text-blue-200 mt-1">Ordinances</p></div>
            <div className="text-center text-white animate-fade-in-up delay-200"><Clock className="h-10 w-10 mx-auto text-yellow-300 mb-3 animate-bounce-slow" /><p className="text-4xl font-bold">{stats.yearsServing}</p><p className="text-blue-200 mt-1">Years Serving</p></div>
            <div className="text-center text-white animate-fade-in-up delay-300"><Users className="h-10 w-10 mx-auto text-purple-300 mb-3 animate-bounce-slow" /><p className="text-4xl font-bold">{stats.population}</p><p className="text-blue-200 mt-1">Population Served</p></div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">About Sangguniang Bayan</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Target className="h-8 w-8 text-blue-600" /></div>
            <h3 className="text-xl font-bold text-center mb-3">Our Mission</h3>
            <p className="text-gray-600 text-center leading-relaxed">"TO ENACT QUALITY LEGISLATION AND EXERCISE EFFECTIVE OVERSIGHT THAT PROMOTES SOCIAL JUSTICE, ECONOMIC GROWTH, AND ENVIRONMENTAL SUSTAINABILITY THROUGH INCLUSIVE, TRANSPARENT, AND PARTICIPATORY GOVERNANCE"</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Heart className="h-8 w-8 text-green-600" /></div>
            <h3 className="text-xl font-bold text-center mb-3">Our Vision</h3>
            <p className="text-gray-600 text-center leading-relaxed">"A PREMIER AND PROACTIVE LEGISLATIVE BODY IN SOUTHERN LEYTE, ENACTING RESPONSIVE AND INNOVATIVE POLICIES THAT EMPOWER A RESILIENT, GOD-LOVING, AND PROSPEROUS SAN FRANCISCO</p>
          </div>
        </div>
      </section>

      {/* Official Seal Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Official Seal */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-full shadow-2xl p-4 mb-6 border-4 border-blue-100 ring-4 ring-blue-50">
                <img 
                  src="/homepage-images/logo.png" 
                  alt="Official Seal of Sangguniang Bayan" 
                  className="h-80 w-80 md:h-96 md:w-96 lg:h-[28rem] lg:w-[28rem] object-contain"
                />
              </div>
            </div>    
            
            {/* Right Side - Seal Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">The Official Seal of the Sangguniang Bayan</h3>
                <div className="w-24 h-1 bg-blue-600 mb-6"></div>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  <strong>Symbolism of the Official Seal:</strong>
                  <strong> Sangguniang Bayan of San Francisco, Southern Leyte</strong>
                </p>
                <p> 
                </p>
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-600">
                  <ul className="space-y-1 text-blue-800 text-sm">
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span><strong>The Scale and the Quil (The Legislative Mandate)</strong></span>
                      <span className="mr-2"></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span>  The Scale Represents the unwavering commitment of the Council to social justice and equality,
                        signifying that every ordinance is weighed with fairness. The Quill represents the power of legislation and the
                        intellectual labor of the members in crafting laws that protect the welfare of the people.
                      </span>
                    </li>
                    <p></p>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span><strong>The Sun and the Gear (Progress and Unity)</strong></span>
                      <span className="mr-2"></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span>The Sun symbolizes the distinct barangays of San Francisco, unified under a single version of hope and transarency. The integrated
                        Gear reflects the Council's role as the engine of progress, driving the municipality toward modernization and economic growth.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span><strong>The Coconut Fronds and Waves (Geography and Heritage)</strong></span>
                      <span className="mr-2"></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span>The Sun symbolizes the distinct barangays of San Francisco, unified under a single version of hope and transarency. The integrated
                        Gear reflects the Council's role as the engine of progress, driving the municipality toward modernization and economic growth.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span><strong>The Open Book (Transparebcy and Law)</strong></span>
                      <span className="mr-2"></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span>The Sun symbolizes the distinct barangays of San Francisco, unified under a single version of hope and transarency. The integrated
                        Gear reflects the Council's role as the engine of progress, driving the municipality toward modernization and economic growth.
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span><strong>The Navy and Gold Palette (Authority and Excellence)</strong></span>
                      <span className="mr-2"></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2"></span>
                      <span>The Sun symbolizes the distinct barangays of San Francisco, unified under a single version of hope and transarency. The integrated
                        Gear reflects the Council's role as the engine of progress, driving the municipality toward modernization and economic growth.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organization Chart Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Legislative Organization</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Meet the dedicated officials serving the people of San Francisco, Southern Leyte</p>
            <div className="w-24 h-1 bg-blue-600 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {ORGANIZATION_CATEGORIES.map((category) => (
              <OrganizationCarousel key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Documents Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center"><Scale className="h-6 w-6 mr-2 text-blue-600" />Recent Resolutions</h3>
              <Link to="/resolutions" className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </div>
            <div className="space-y-4">
              {resolutions.length > 0 ? resolutions.map((res) => (
                <div key={res.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-blue-50 transition-colors">
                  <p className="text-sm text-blue-600 font-medium">Resolution No. {res.resolutionNumber}, Series {res.series}</p>
                  <p className="font-medium text-gray-900 line-clamp-2">{res.title}</p>
                </div>
              )) : <p className="text-gray-500 text-center py-8">No resolutions available.</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center"><FileText className="h-6 w-6 mr-2 text-green-600" />Recent Ordinances</h3>
              <Link to="/ordinances" className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </div>
            <div className="space-y-4">
              {ordinances.length > 0 ? ordinances.map((ord) => (
                <div key={ord.id} className="border-l-4 border-green-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-green-50 transition-colors">
                  <p className="text-sm text-green-600 font-medium">Ordinance No. {ord.ordinanceNumber}, Series {ord.series}</p>
                  <p className="font-medium text-gray-900 line-clamp-2">{ord.title}</p>
                </div>
              )) : <p className="text-gray-500 text-center py-8">No ordinances available.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Job Vacancies */}
      {vacancies.length > 0 && (
        <section className="bg-gradient-to-r from-orange-500 to-red-500 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center"><Briefcase className="h-7 w-7 mr-3" />Job Opportunities</h2>
              <Link to="/vacancies" className="text-white/90 hover:text-white flex items-center text-sm font-medium bg-white/20 px-4 py-2 rounded-lg">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {vacancies.slice(0, 3).map((vac) => (
                <div key={vac.id} className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-colors border border-white/20">
                  <p className="font-bold text-white text-lg">{vac.jobTitle}</p>
                  <p className="text-orange-100 mt-1">{vac.position}</p>
                  <p className="text-sm text-orange-200/80 mt-2">{vac.department}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News & Announcements */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center"><Newspaper className="h-7 w-7 mr-3 text-purple-600" />Latest News</h2>
                <Link to="/news" className="text-purple-600 hover:text-purple-800 flex items-center text-sm font-medium">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </div>
              <div className="space-y-4">
                {news.length > 0 ? news.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow border-l-4 border-purple-500">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full mb-2">{item.category}</span>
                    <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                  </div>
                )) : <p className="text-gray-500 text-center py-8">No news available.</p>}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center"><Bell className="h-7 w-7 mr-3 text-red-600" />Announcements</h2>
                <Link to="/announcements" className="text-red-600 hover:text-red-800 flex items-center text-sm font-medium">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </div>
              <div className="space-y-4">
                {announcements.length > 0 ? announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className={`rounded-lg p-5 border-l-4 ${ann.priority === 'Urgent' ? 'bg-red-50 border-red-500' : ann.priority === 'High' ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-500'}`}>
                    <span className={`inline-block px-2 py-1 text-xs rounded mb-1 ${ann.priority === 'Urgent' ? 'bg-red-100 text-red-800' : ann.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>{ann.priority}</span>
                    <h3 className="font-bold text-gray-900">{ann.title}</h3>
                  </div>
                )) : <p className="text-gray-500 text-center py-8">No announcements available.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
