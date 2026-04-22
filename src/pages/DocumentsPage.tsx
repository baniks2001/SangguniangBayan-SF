import React, { useState, useEffect } from 'react';
import { documentsApi, filesApi, analyticsApi } from '../services/api';
import { FileArchive, Search, ChevronLeft, ChevronRight, FileText, Calendar, Download, FolderOpen } from 'lucide-react';

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

  const handleDownload = async (document: Document) => {
    try {
      // Track the download event
      await analyticsApi.track({
        type: 'download',
        contentType: 'document',
        contentId: document.id,
        contentTitle: document.title,
        metadata: {
          fileName: document.fileName,
          category: document.category,
          fileSize: document.fileSize
        }
      });

      // Increment download count in database
      await documentsApi.incrementDownloadCount(document.id);

      // Perform the download
      filesApi.downloadFile(document.fileId || document.fileUrl, document.fileName);

      // Update the download count in the UI
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === document.id 
            ? { ...doc, downloadCount: doc.downloadCount + 1 }
            : doc
        )
      );
    } catch (error) {
      console.error('Error tracking download:', error);
      // Still perform download even if tracking fails
      filesApi.downloadFile(document.fileId || document.fileUrl, document.fileName);
    }
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
                      onClick={() => handleDownload(doc)}
                      className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
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
    </div>
  );
};

export default DocumentsPage;
