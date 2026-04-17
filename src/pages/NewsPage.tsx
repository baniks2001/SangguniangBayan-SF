import React, { useState, useEffect } from 'react';
import { newsApi } from '../services/api';
import { Newspaper, Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  publishedAt: string;
}

// Helper to convert stored imageUrl to full file URL
const getFileUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  // Handle /file?id=xxx format (stored from admin-site)
  if (imageUrl.startsWith('/file?')) {
    return `/api${imageUrl}`;
  }
  return imageUrl;
};

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const categories = ['', 'General', 'Legislative', 'Community', 'Development'];

  useEffect(() => {
    loadNews();
  }, [currentPage, selectedCategory]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await newsApi.getAll({
        category: selectedCategory,
        page: currentPage,
        limit: 9
      });
      setNews(response.news || []);
      setTotalPages(response.pagination?.total || 1);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Legislative':
        return 'bg-blue-100 text-blue-800';
      case 'Community':
        return 'bg-green-100 text-green-800';
      case 'Development':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && news.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Newspaper className="h-8 w-8 mr-3 text-purple-600" />
          News & Updates
        </h1>
        <p className="mt-2 text-gray-600">
          Latest news, updates, and stories from the Sangguniang Bayan and the municipality.
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category || 'all'}
            onClick={() => {
              setSelectedCategory(category);
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category || 'All Categories'}
          </button>
        ))}
      </div>

      {/* News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedNews.category)}`}>
                {selectedNews.category}
              </span>
              <button
                onClick={() => setSelectedNews(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {selectedNews.imageUrl && (
                <img
                  src={getFileUrl(selectedNews.imageUrl)}
                  alt={selectedNews.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedNews.title}</h2>
              <p className="text-sm text-gray-500 flex items-center mb-4">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(selectedNews.publishedAt).toLocaleDateString()}
              </p>
              <div 
                className="prose max-w-none text-gray-700 news-content"
                dangerouslySetInnerHTML={{ 
                  __html: selectedNews.content?.replace(
                    /src="\/uploads\//g, 
                    `src="${window.location.protocol}//${window.location.host}/uploads/`
                  ) || '' 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* News Grid */}
      {news.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedNews(item)}
              >
                {item.imageUrl ? (
                  <img
                    src={getFileUrl(item.imageUrl)}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-purple-300" />
                  </div>
                )}
                <div className="p-4">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ 
                    __html: item.content?.replace(/<[^>]*>/g, '').substring(0, 100) + '...' 
                  }} />
                  <p className="mt-2 text-xs text-gray-400 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <span className="text-sm text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Newspaper className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No News Available</h3>
          <p className="text-gray-500">Check back later for updates.</p>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
