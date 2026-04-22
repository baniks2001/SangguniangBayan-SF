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
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {documents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(doc.category)}`}>
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {doc.title}
                    </h3>
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
                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:ml-4 mt-4 sm:mt-0">
                    <button
                      onClick={() => filesApi.downloadFile(doc.fileId || doc.fileUrl, doc.fileName)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
                    </button>
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Document Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg">No documents found.</p>
            <p className="text-sm mt-2">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-600 px-2">
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

      {/* Document Detail Modal - matches resolution details style */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-3 sm:p-4 border-b bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {selectedDocument.title}
                </h2>
                <div className="flex items-center gap-2">
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
                    className="px-3 sm:px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Document Information Section */}
            <div className="p-4 sm:p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Category</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedDocument.category)}`}>
                    {selectedDocument.category}
                  </span>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">File Name</h3>
                  <p className="text-sm text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-1 text-gray-400" />
                    {selectedDocument.fileName}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">File Size</h3>
                  <p className="text-sm text-gray-900">{selectedDocument.fileSize}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <h3 className="text-xs font-medium text-gray-500 mb-1">Downloads</h3>
                  <p className="text-sm text-gray-900 flex items-center">
                    <Download className="h-4 w-4 mr-1 text-gray-400" />
                    {selectedDocument.downloadCount} times
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-white p-3 rounded-lg border">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-sm text-gray-900">{selectedDocument.description}</p>
              </div>
              <div className="mt-4 bg-white p-3 rounded-lg border">
                <h3 className="text-xs font-medium text-gray-500 mb-1">Upload Date</h3>
                <p className="text-sm text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {new Date(selectedDocument.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Document Preview Section */}
            <div className="p-2 sm:p-8 bg-gray-100 flex justify-center overflow-x-auto">
              <div
                className="relative bg-white mx-auto"
                style={{
                  width: '100%',
                  maxWidth: '816px',
                  minHeight: '1056px',
                  padding: '48px',
                  boxShadow: '0 0 0 1px #d1d5db',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12pt',
                  lineHeight: 1.6,
                  color: '#000',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Document Header */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-4">{selectedDocument.title}</h1>
                  <div className="w-32 h-1 bg-blue-600 mx-auto mb-4"></div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedDocument.category)}`}>
                    {selectedDocument.category}
                  </span>
                </div>

                {/* Document Content */}
                <div className="text-justify mb-8">
                  <p className="mb-4">{selectedDocument.description}</p>
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Document Information:</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>File Name:</strong> {selectedDocument.fileName}
                        </div>
                        <div>
                          <strong>File Size:</strong> {selectedDocument.fileSize}
                        </div>
                        <div>
                          <strong>Category:</strong> {selectedDocument.category}
                        </div>
                        <div>
                          <strong>Upload Date:</strong> {new Date(selectedDocument.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div>
                          <strong>Downloads:</strong> {selectedDocument.downloadCount}
                        </div>
                        <div>
                          <strong>Status:</strong> Published
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Footer */}
                <div className="mt-auto pt-8 border-t text-center">
                  <p className="text-sm text-gray-600">
                    Sangguniang Bayan of San Francisco, Southern Leyte
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Municipal Compound, San Francisco, Southern Leyte, Philippines
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    filesApi.viewFile(selectedDocument.fileId || selectedDocument.fileUrl);
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View File
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
