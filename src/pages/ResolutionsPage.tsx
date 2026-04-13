import React, { useState, useEffect } from 'react';
import { resolutionsApi } from '../services/api';
import { Scale, Search, ChevronLeft, ChevronRight, FileText, Calendar, Download, Info, Printer } from 'lucide-react';

interface Resolution {
  id: string;
  resolutionNumber: string;
  series: string;
  title: string;
  content: string;
  status: string;
  isPublic: boolean;
  author: string;
  createdAt: string;
  pdfUrl?: string;
  fileId?: string;
  signatories?: any[];
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

const ResolutionsPage: React.FC = () => {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    loadResolutions();
  }, [currentPage, searchTerm]);

  const loadResolutions = async () => {
    try {
      setLoading(true);
      // Call API like admin-site does, with status and isPublic filters
      const response = await resolutionsApi.getAll({
        search: searchTerm,
        page: currentPage,
        limit: 10,
        status: 'Approved',
        isPublic: true
      });
      console.log('Resolutions API response:', response);
      setResolutions(response.resolutions || []);
      setTotalPages(response.pagination?.total || 1);
    } catch (error) {
      console.error('Error loading resolutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadResolutions();
  };

  // Print document function - shows full builder content with images
  const handlePrintDocument = (resolution: Resolution) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build image elements HTML if they exist
    let imagesHtml = '';
    if (resolution.imageElements && resolution.imageElements.length > 0) {
      imagesHtml = resolution.imageElements.map(img => {
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
    const processedContent = resolution.content
      ?.replace(/src="gridfs:\/\//g, `${process.env.REACT_APP_API_URL || ''}/api/files/gridfs/`)
      ?.replace(/src="\/uploads\//g, `${process.env.REACT_APP_API_URL || ''}/uploads/`)
      || '<p>No content available</p>';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resolution ${resolution.resolutionNumber} - Series ${resolution.series}</title>
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

  if (loading && resolutions.length === 0) {
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
          <Scale className="h-8 w-8 mr-3 text-blue-600" />
          Resolutions
        </h1>
        <p className="mt-2 text-gray-600">
          Browse and search through official resolutions enacted by the Sangguniang Bayan.
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
              placeholder="Search resolutions by title, number, or content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Resolution Detail Modal - matches print view style */}
      {selectedResolution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Resolution No. {selectedResolution.resolutionNumber} - Series {selectedResolution.series}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedResolution && handlePrintDocument(selectedResolution)}
                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="text-sm">Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedResolution(null)}
                    className="p-2 hover:bg-gray-200 rounded"
                  >
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-100 flex justify-center">
              {/* Resolution Page - matches document builder layout */}
              <div
                className="relative bg-white mx-auto"
                style={{
                  width: '816px',
                  minHeight: '1056px',
                  padding: '72px',
                  boxShadow: '0 0 0 1px #d1d5db',
                  fontFamily: "'Times New Roman', Times, serif",
                  fontSize: '12pt',
                  lineHeight: 1.6,
                  color: '#000'
                }}
              >
                {/* Image Elements - Absolutely positioned on top of content */}
                {selectedResolution.imageElements && selectedResolution.imageElements.map((img) => (
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
                {/* Resolution Content */}
                <div
                  className="text-justify"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12pt',
                    lineHeight: 1.6
                  }}
                  dangerouslySetInnerHTML={{
                    __html: selectedResolution.content?.replace(
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

      {/* Resolutions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {resolutions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {resolutions.map((resolution) => (
              <div
                key={resolution.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Resolution No. {resolution.resolutionNumber}, Series {resolution.series}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        resolution.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        resolution.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {resolution.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {resolution.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(resolution.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => resolutionsApi.downloadPdf(resolution.fileId || resolution.pdfUrl, resolution.resolutionNumber, resolution.series)}
                      className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Approved File
                    </button>
                    <button
                      onClick={() => setSelectedResolution(resolution)}
                      className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Resolution Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Scale className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No resolutions found</p>
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

export default ResolutionsPage;
