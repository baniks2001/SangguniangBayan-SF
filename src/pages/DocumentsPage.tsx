import React, { useState, useEffect } from 'react';
import { documentsApi, filesApi } from '../services/api';
import { FileArchive, Search, ChevronLeft, ChevronRight, FileText, Calendar, Eye, Download, FolderOpen, Printer } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  fileId?: string;
  fileUrl?: string;
  fileName: string;
  fileSize: string;
  downloadCount: number;
  isPublic: boolean;
  status?: 'Draft' | 'Pending' | 'Published' | 'Archived';
  createdAt: string;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'Forms', label: 'Forms' },
  { value: 'Reports', label: 'Reports' },
  { value: 'Guidelines', label: 'Guidelines' },
  { value: 'Memorandum', label: 'Memorandum' },
  { value: 'Others', label: 'Others' }
];

const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [currentPage, searchTerm, selectedCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.getAll({
        search: searchTerm,
        category: selectedCategory,
        page: currentPage,
        limit: 10
      });
      console.log('Documents API response:', response);
      // Filter to only show published documents (not Draft or Pending)
      const publishedDocs = (response.documents || []).filter(
        (doc: Document) => doc.status === 'Published' || !doc.status
      );
      setDocuments(publishedDocs);
      setTotalPages(response.pagination?.total || 1);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadDocuments();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Forms': 'bg-blue-100 text-blue-800',
      'Reports': 'bg-green-100 text-green-800',
      'Guidelines': 'bg-purple-100 text-purple-800',
      'Memorandum': 'bg-orange-100 text-orange-800',
      'Others': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading && documents.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FileArchive className="h-8 w-8 mr-3 text-blue-600" />
          Documents
        </h1>
        <p className="mt-2 text-gray-600">
          Browse and download official documents published by the Sangguniang Bayan.
        </p>
      </div>

      {/* Search and Filter */}
      <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by title or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No documents found.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{doc.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{doc.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {doc.fileName}
                    </span>
                    <span>{doc.fileSize}</span>
                    <span className="flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      {doc.downloadCount} downloads
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View
                  </button>
                  <button
                    onClick={() => filesApi.downloadFile(doc.fileId || doc.fileUrl, doc.fileName)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedDocument.category)} mb-2`}>
                    {selectedDocument.category}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedDocument.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{selectedDocument.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">File Name</h3>
                  <p className="text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-gray-400" />
                    {selectedDocument.fileName}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">File Size</h3>
                  <p className="text-gray-900">{selectedDocument.fileSize}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Upload Date</h3>
                  <p className="text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {new Date(selectedDocument.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Downloads</h3>
                  <p className="text-gray-900 flex items-center">
                    <Download className="h-4 w-4 mr-1 text-gray-400" />
                    {selectedDocument.downloadCount} times
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    filesApi.viewFile(selectedDocument.fileId || selectedDocument.fileUrl);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </button>
                <button
                  onClick={() => {
                    const fileUrl = filesApi.getFileUrl(selectedDocument.fileId || selectedDocument.fileUrl);
                    if (fileUrl) {
                      const printWindow = window.open(fileUrl, '_blank');
                      if (printWindow) {
                        printWindow.addEventListener('load', () => {
                          setTimeout(() => printWindow.print(), 500);
                        });
                      }
                    }
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => {
                    filesApi.downloadFile(selectedDocument.fileId || selectedDocument.fileUrl, selectedDocument.fileName);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
