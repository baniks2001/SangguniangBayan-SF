import React, { useState, useEffect } from 'react';
import { ordinancesApi } from '../services/api';
import { FileText, Search, ChevronLeft, ChevronRight, Calendar, Scroll, Download, Info, Printer } from 'lucide-react';

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
  pdfUrl?: string;
  fileId?: string;
  imageElements?: Array<{
    id: string;
    src: string;
    alt: string;
    x: number;
    y: number;
    width: number;
    height: number;
    locked?: boolean;
    gridfsId?: string;
  }>;
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
      // Call API like admin-site does, with status and isPublic filters
      const response = await ordinancesApi.getAll({
        search: searchTerm,
        page: currentPage,
        limit: 10,
        status: 'Approved',
        isPublic: true
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

  // Print document function - shows full builder content with images
  const handlePrintDocument = (ordinance: Ordinance) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build image elements HTML if they exist
    let imagesHtml = '';
    if (ordinance.imageElements && ordinance.imageElements.length > 0) {
      imagesHtml = ordinance.imageElements.map(img => {
        const imgSrc = img.src?.startsWith('gridfs://')
          ? `${process.env.REACT_APP_API_URL || ''}/api/files/gridfs/${img.src.replace('gridfs://', '')}`
          : img.src;
        return `
        <div style="position:absolute;left:${img.x}px;top:${img.y}px;width:${img.width}px;height:auto;z-index:10;">
          <img src="${imgSrc}" alt="${img.alt}" style="width:100%;height:auto;display:block;" />
        </div>
      `;
      }).join('');
    }

    // Process content to fix image URLs
    const processedContent = ordinance.content
      ?.replace(/src="gridfs:\/\//g, `${process.env.REACT_APP_API_URL || ''}/api/files/gridfs/`)
      ?.replace(/src="\/uploads\//g, `${process.env.REACT_APP_API_URL || ''}/uploads/`)
      || '<p>No content available</p>';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordinance ${ordinance.ordinanceNumber} - Series ${ordinance.series}</title>
        <style>
          @page { size: letter; margin: 0; }
          * { box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0;
            color: #000;
          }
          .builder-content {
            width: 816px;
            min-height: 1056px;
            padding: 72px;
            position: relative;
            margin: 0 auto;
          }
          .builder-content img {
            max-width: 100%;
            height: auto;
          }
          .builder-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
          }
          .builder-content table td,
          .builder-content table th {
            border: 1px solid #000;
            padding: 8px;
          }
          .builder-content p {
            margin: 0.5em 0;
          }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="builder-content">
          ${imagesHtml}
          ${processedContent}
        </div>
        <div class="no-print" style="margin-top: 2em; text-align: center; padding: 2em; background: #f5f5f5; border-radius: 8px;">
          <p style="margin-bottom: 1em; color: #666;">This is a preview. Click below to print the official document.</p>
          <button onclick="window.print()" style="padding: 12px 30px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold;">
            Print Document
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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

      {/* Ordinance Detail Modal - matches print view style */}
      {selectedOrdinance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-3 sm:p-4 border-b bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Ordinance No. {selectedOrdinance.ordinanceNumber} - Series {selectedOrdinance.series}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedOrdinance && handlePrintDocument(selectedOrdinance)}
                    className="px-3 sm:px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedOrdinance(null)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-2 sm:p-8 bg-gray-100 flex justify-center overflow-x-auto">
              {/* Ordinance Page - matches document builder layout */}
              <div
                className="relative bg-white mx-auto"
                style={{
                  width: '100%',
                  maxWidth: '816px',
                  minHeight: '1056px',
                  padding: '24px',
                  boxShadow: '0 0 0 1px #d1d5db',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12pt',
                  lineHeight: 1.6,
                  color: '#000'
                }}
              >
                {/* Image Elements - Absolutely positioned on top of content */}
                {selectedOrdinance.imageElements && selectedOrdinance.imageElements.map((img) => (
                  <div
                    key={img.id}
                    className="absolute"
                    style={{
                      left: `${img.x}px`,
                      top: `${img.y}px`,
                      width: `${img.width}px`,
                      height: 'auto',
                      zIndex: 10
                    }}
                  >
                    <img
                      src={img.src?.startsWith('gridfs://') 
                        ? `${process.env.REACT_APP_API_URL || ''}/api/files/gridfs/${img.src.replace('gridfs://', '')}`
                        : img.src
                      }
                      alt={img.alt}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
                ))}
                {/* Ordinance Content */}
                <div 
                  className="text-justify"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12pt',
                    lineHeight: 1.6
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: selectedOrdinance.content?.replace(
                      /src="gridfs:\/\//g, 
                      `${process.env.REACT_APP_API_URL || ''}/api/files/gridfs/`
                    ).replace(
                      /src="\/uploads\//g, 
                      `${process.env.REACT_APP_API_URL || ''}/uploads/`
                    ) || '<p>No content available</p>'
                  }}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                Status: <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Approved
                </span>
                <span className="mx-2">|</span>
                Public Document
              </p>
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
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Ordinance No. {ordinance.ordinanceNumber}, Series {ordinance.series}
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
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(ordinance.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:ml-4 mt-4 sm:mt-0">
                    <button
                      onClick={() => ordinancesApi.downloadPdf(ordinance.fileId || ordinance.pdfUrl, ordinance.ordinanceNumber, ordinance.series)}
                      className="flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Ordinance
                    </button>
                    <button
                      onClick={() => setSelectedOrdinance(ordinance)}
                      className="flex items-center justify-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      View Ordinance Details
                    </button>
                  </div>
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OrdinancesPage;
