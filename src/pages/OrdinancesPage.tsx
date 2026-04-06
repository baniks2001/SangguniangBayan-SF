import React, { useState, useEffect } from 'react';
import { ordinancesApi } from '../services/api';
import { FileText, Search, ChevronLeft, ChevronRight, Calendar, Scroll } from 'lucide-react';

interface Ordinance {
  id: string;
  ordinanceNumber: string;
  series: string;
  title: string;
  content: string;
  status: string;
  isPublic: boolean;
  author: string;
  createdAt: string;
}

const OrdinancesPage: React.FC = () => {
  const [ordinances, setOrdinances] = useState<Ordinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrdinance, setSelectedOrdinance] = useState<Ordinance | null>(null);

  useEffect(() => {
    loadOrdinances();
  }, [currentPage, searchTerm]);

  const loadOrdinances = async () => {
    try {
      setLoading(true);
      const response = await ordinancesApi.getAll({
        search: searchTerm,
        page: currentPage,
        limit: 10
      });
      setOrdinances(response.ordinances || []);
      setTotalPages(response.pagination?.total || 1);
    } catch (error) {
      console.error('Error loading ordinances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrdinances();
  };

  if (loading && ordinances.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Scroll className="h-8 w-8 mr-3 text-green-600" />
          Municipal Ordinances
        </h1>
        <p className="mt-2 text-gray-600">
          Access and search through official municipal ordinances enacted by the Sangguniang Bayan.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ordinances by title, number, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Ordinance Detail Modal */}
      {selectedOrdinance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Ordinance Details</h2>
                <button
                  onClick={() => setSelectedOrdinance(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">Republic of the Philippines</p>
                <p className="text-sm text-gray-600">Province of Southern Leyte</p>
                <p className="text-sm text-gray-600">Municipality of San Francisco</p>
                <p className="font-semibold text-gray-900 mt-2">SANGGUNIANG BAYAN</p>
                <p className="text-xs text-gray-500 mt-1">OFFICE OF THE SANGGUNIANG SECRETARY</p>
              </div>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded">
                  Ordinance No. {selectedOrdinance.ordinanceNumber}, Series {selectedOrdinance.series}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedOrdinance.title}
              </h3>
              <div className="prose max-w-none mb-6 text-gray-700 whitespace-pre-wrap">
                {selectedOrdinance.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ordinances List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {ordinances.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {ordinances.map((ordinance) => (
              <div
                key={ordinance.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedOrdinance(ordinance)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ordinance.ordinanceNumber}-{ordinance.series}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ordinance.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        ordinance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ordinance.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {ordinance.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {ordinance.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(ordinance.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <FileText className="h-6 w-6 text-gray-400 ml-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Scroll className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No ordinances found</p>
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdinancesPage;
