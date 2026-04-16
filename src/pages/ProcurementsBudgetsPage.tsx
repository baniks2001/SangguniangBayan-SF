import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  DollarSign, 
  Calendar, 
  FileText, 
  Download,
  ChevronRight,
  Search,
  Filter,
  ExternalLink,
  Loader2,
  Printer,
  Building,
  Info,
  Clock
} from 'lucide-react';

// Types
interface ProcurementDocument {
  name: string;
  url: string;
  filename: string;
}

interface ImageElement {
  id: string;
  url: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface ProcurementItem {
  id: string;
  title: string;
  category: string;
  department: string;
  budget: number;
  status: 'Draft' | 'Pending' | 'Open' | 'Closed' | 'Awarded' | 'Cancelled' | 'Published';
  datePosted: string;
  deadline: string;
  description: string;
  documents: ProcurementDocument[];
  isPublic: boolean;
  winningBidder?: string;
  winningAmount?: number;
  content?: string;
  imageElements?: ImageElement[];
  createdAt?: string;
}

// API Base URL for static files
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const STATIC_BASE_URL = API_BASE_URL.replace('/api', '');

// Fetch procurements from API
const fetchProcurements = async (params?: { search?: string; category?: string; status?: string; page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  queryParams.append('endpoint', 'procurements');
  const response = await fetch(`/api/data?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch procurements');
  }
  return response.json();
};

// Get full URL for file
const getFileUrl = (fileUrl: string | undefined) => {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${STATIC_BASE_URL}${fileUrl}`;
};

// Download file
const downloadFile = (fileUrl: string | undefined, fileName: string) => {
  const fullUrl = getFileUrl(fileUrl);
  if (!fullUrl) {
    console.error('No file URL available');
    return;
  }
  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = fileName;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// View file in new tab
const viewFile = (fileUrl: string | undefined) => {
  const fullUrl = getFileUrl(fileUrl);
  if (fullUrl) {
    window.open(fullUrl, '_blank');
  } else {
    console.error('No file URL available');
  }
};

// Bid Application Interface
interface BidApplication {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  bidAmount: number;
  description: string;
  file?: File;
}

const ProcurementsBudgetsPage: React.FC = () => {
  const [procurements, setProcurements] = useState<ProcurementItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProcurement, setSelectedProcurement] = useState<ProcurementItem | null>(null);

  // Bid Application Modal State
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [bidProcurement, setBidProcurement] = useState<ProcurementItem | null>(null);
  const [bidFormData, setBidFormData] = useState<BidApplication>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    bidAmount: 0,
    description: ''
  });
  const [bidFile, setBidFile] = useState<File | null>(null);
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidSuccess, setBidSuccess] = useState(false);

  useEffect(() => {
    loadProcurements();
  }, []);

  const loadProcurements = async () => {
    try {
      setLoading(true);
      const data = await fetchProcurements();
      setProcurements(data.procurements || []);
      setError(null);
    } catch (err) {
      setError('Failed to load procurements');
      console.error('Error loading procurements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate budget summary from procurement data
  const budgetSummary = useMemo(() => {
    const totalBudget = procurements.reduce((sum, p) => sum + (p.budget || 0), 0);
    const utilizedBudget = procurements
      .filter(p => p.status === 'Awarded')
      .reduce((sum, p) => sum + (p.winningAmount || p.budget || 0), 0);
    const remainingBudget = totalBudget - utilizedBudget;
    const openCount = procurements.filter(p => p.status === 'Open').length;
    
    return {
      totalBudget,
      utilizedBudget,
      remainingBudget,
      openCount
    };
  }, [procurements]);

  // Published/Open procurements (visible for bidding)
  const publishedProcurements = procurements.filter(item => {
    if (!['Open', 'Published'].includes(item.status)) return false;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Awarded procurements (completed awards)
  const awardedProcurements = procurements.filter(item => {
    if (item.status !== 'Awarded') return false;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Cancelled procurements
  const cancelledProcurements = procurements.filter(item => {
    if (item.status !== 'Cancelled') return false;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Awarded': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Published': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle bid form submission
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bidProcurement) return;

    setSubmittingBid(true);
    try {
      const formData = new FormData();
      formData.append('procurementId', bidProcurement.id);
      formData.append('companyName', bidFormData.companyName);
      formData.append('contactPerson', bidFormData.contactPerson);
      formData.append('email', bidFormData.email);
      formData.append('phone', bidFormData.phone);
      formData.append('address', bidFormData.address);
      formData.append('bidAmount', bidFormData.bidAmount.toString());
      formData.append('description', bidFormData.description);
      
      if (bidFile) {
        formData.append('bidDocument', bidFile);
      }

      const response = await fetch(`${API_BASE_URL}/procurements/${bidProcurement.id}/bids`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bid submission error:', response.status, errorText);
        throw new Error(`Failed to submit bid: ${response.status} ${errorText}`);
      }

      setBidSuccess(true);
      setTimeout(() => {
        setBidModalOpen(false);
        setBidProcurement(null);
        setBidSuccess(false);
        setBidFormData({
          companyName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          bidAmount: 0,
          description: ''
        });
        setBidFile(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Failed to submit bid. Please try again.');
    } finally {
      setSubmittingBid(false);
    }
  };

  // Print procurement details
  const handlePrintDocument = (procurement: ProcurementItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${procurement.title}</title>
        <style>
          @page { size: letter; margin: 0.5in; }
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
          .header {
            text-align: center;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 2px solid #1e40af;
          }
          .header h1 {
            font-size: 18pt;
            margin: 0 0 0.5em 0;
            color: #1e40af;
          }
          .header .subtitle {
            font-size: 14pt;
            color: #4b5563;
          }
          .section {
            margin-bottom: 1.5em;
          }
          .section h2 {
            font-size: 14pt;
            color: #1e40af;
            margin-bottom: 0.5em;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 0.25em;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1em;
          }
          .info-item {
            margin-bottom: 0.5em;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
          }
          .info-value {
            color: #000;
          }
          .status-badge {
            display: inline-block;
            padding: 0.25em 0.75em;
            border-radius: 4px;
            font-weight: bold;
            font-size: 11pt;
          }
          .status-open { background: #dcfce7; color: #166534; }
          .status-closed { background: #f3f4f6; color: #374151; }
          .status-awarded { background: #dbeafe; color: #1e40af; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .description {
            text-align: justify;
            margin: 1em 0;
          }
          .documents-list {
            margin-top: 0.5em;
          }
          .document-item {
            padding: 0.5em;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin-bottom: 0.5em;
          }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Procurement Notice</h1>
          <div class="subtitle">Sangguniang Bayan of San Francisco</div>
        </div>

        <div class="section">
          <h2>${procurement.title}</h2>
          <span class="status-badge status-${procurement.status.toLowerCase()}">${procurement.status}</span>
          <span style="margin-left: 1em; color: #6b7280;">${procurement.category}</span>
        </div>

        <div class="section">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Department:</div>
              <div class="info-value">${procurement.department}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Budget:</div>
              <div class="info-value" style="color: #1e40af; font-weight: bold;">${formatCurrency(procurement.budget)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date Posted:</div>
              <div class="info-value">${formatDate(procurement.datePosted)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Deadline:</div>
              <div class="info-value">${formatDate(procurement.deadline)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Description</h2>
          <div class="description">${procurement.description}</div>
        </div>

        ${procurement.winningBidder ? `
        <div class="section">
          <h2>Award Information</h2>
          <div class="info-item">
            <div class="info-label">Winning Bidder:</div>
            <div class="info-value">${procurement.winningBidder}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Winning Amount:</div>
            <div class="info-value" style="color: #1e40af; font-weight: bold;">${formatCurrency(procurement.winningAmount || 0)}</div>
          </div>
        </div>
        ` : ''}

        ${procurement.documents && procurement.documents.length > 0 ? `
        <div class="section">
          <h2>Attached Documents</h2>
          <div class="documents-list">
            ${procurement.documents.map(doc => `<div class="document-item">${doc.name}</div>`).join('')}
          </div>
        </div>
        ` : ''}

        <div class="no-print" style="margin-top: 2em; text-align: center; padding: 2em; background: #f5f5f5; border-radius: 8px;">
          <p style="margin-bottom: 1em; color: #666;">This is a preview. Click below to print this procurement notice.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-4">
            <ShoppingCart className="h-8 w-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Procurements & Budgets</h1>
          </div>
          <p className="text-blue-100 text-lg max-w-3xl">
            Transparent procurement processes and budget allocation for the Sangguniang Bayan of San Francisco.
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search procurements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value="Published">Published</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Awarded">Awarded</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                <option value="Goods">Goods</option>
                <option value="Services">Services</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Procurement Detail Modal */}
      {selectedProcurement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Procurement Details</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedProcurement && handlePrintDocument(selectedProcurement)}
                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Printer className="h-4 w-4" />
                    <span className="text-sm">Print</span>
                  </button>
                  <button
                    onClick={() => setSelectedProcurement(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${getStatusColor(selectedProcurement.status)}`}>
                  {selectedProcurement.status}
                </span>
                <span className="ml-2 text-sm text-gray-500">{selectedProcurement.category}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedProcurement.title}
              </h3>
              
              {/* Document Content - Like Resolution Builder */}
              {selectedProcurement.content && (
                <div className="mb-6 border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-700">Document Content</p>
                  </div>
                  <div className="p-6 relative" style={{ minHeight: '300px' }}>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: selectedProcurement.content 
                          ? selectedProcurement.content.replace(
                              /<img[^>]+>/g, 
                              '<div class="image-placeholder bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 my-2">[Image Placeholder]</div>'
                            )
                          : '<p class="text-gray-400 italic">No content available</p>'
                      }}
                    />
                    {/* Render image elements if they exist */}
                    {selectedProcurement.imageElements && selectedProcurement.imageElements.length > 0 && (
                      <div className="absolute inset-0 pointer-events-none">
                        {selectedProcurement.imageElements.map((img) => (
                          <img
                            key={img.id}
                            src={img.url.startsWith('http') ? img.url : `${STATIC_BASE_URL}${img.url}`}
                            alt="Document image"
                            className="absolute pointer-events-auto shadow-lg rounded"
                            style={{
                              left: `${img.position.x}px`,
                              top: `${img.position.y}px`,
                              width: `${img.size.width}px`,
                              height: `${img.size.height}px`,
                              objectFit: 'contain',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description fallback if no content */}
              {!selectedProcurement.content && selectedProcurement.description && (
                <p className="text-gray-600 mb-6">{selectedProcurement.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Department:</span> {selectedProcurement.department}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Budget:</span> <span className="text-blue-600 font-semibold">{formatCurrency(selectedProcurement.budget)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Posted:</span> {formatDate(selectedProcurement.datePosted)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Deadline:</span> {formatDate(selectedProcurement.deadline)}
                </div>
                {selectedProcurement.winningBidder && (
                  <div className="col-span-2 pt-4 border-t mt-4">
                    <span className="font-medium text-gray-700">Winning Bidder:</span> {selectedProcurement.winningBidder} - {formatCurrency(selectedProcurement.winningAmount || 0)}
                  </div>
                )}
              </div>

              {selectedProcurement.documents && selectedProcurement.documents.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="font-semibold text-gray-900 mb-2">Documents:</p>
                  <div className="space-y-2">
                    {selectedProcurement.documents.map((doc, index) => (
                      <div key={index} className="flex gap-2">
                        <button
                          onClick={() => viewFile(doc.url)}
                          className="flex-1 flex items-center justify-between px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                          title="View document"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{doc.name}</span>
                          </span>
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        </button>
                        <button
                          onClick={() => downloadFile(doc.url, doc.name || doc.filename || 'document')}
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                          title="Download document"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Procurement Tables */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-16 space-y-8">
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-lg">Loading procurements...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-red-500 text-lg">{error}</p>
            <button onClick={loadProcurements} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retry</button>
          </div>
        ) : (
          <>
            {/* Published/Open Procurements Table */}
            {publishedProcurements.length > 0 && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-green-50 px-6 py-3 border-b border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Published ({publishedProcurements.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {publishedProcurements.map((procurement) => (
                    <div key={procurement.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {procurement.category}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              procurement.status === 'Open' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {procurement.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {procurement.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {procurement.department}
                            </div>
                            <div className="flex items-center text-blue-600 font-semibold">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatCurrency(procurement.budget)}
                            </div>
                            {procurement.deadline && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Deadline: {formatDate(procurement.deadline)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {procurement.documents && procurement.documents.length > 0 && (
                            <button
                              onClick={() => {
                                procurement.documents.forEach((doc, index) => {
                                  setTimeout(() => {
                                    const link = document.createElement('a');
                                    link.href = `${API_BASE_URL}${doc.url}`;
                                    link.download = doc.filename || doc.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }, index * 500);
                                });
                              }}
                              className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedProcurement(procurement)}
                            className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          <button
                            onClick={() => { setBidProcurement(procurement); setBidModalOpen(true); }}
                            className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Submit Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Awarded Procurements Table */}
            {awardedProcurements.length > 0 && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                    Awarded ({awardedProcurements.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {awardedProcurements.map((procurement) => (
                    <div key={procurement.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {procurement.category}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Awarded
                            </span>
                            {procurement.winningBidder && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Winner: {procurement.winningBidder}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {procurement.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {procurement.department}
                            </div>
                            <div className="flex items-center text-blue-600 font-semibold">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatCurrency(procurement.budget)}
                            </div>
                            {procurement.winningAmount && (
                              <div className="flex items-center text-green-600 font-semibold">
                                <DollarSign className="h-4 w-4 mr-1" />
                                Awarded: {formatCurrency(procurement.winningAmount)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {procurement.documents && procurement.documents.length > 0 && (
                            <button
                              onClick={() => {
                                procurement.documents.forEach((doc, index) => {
                                  setTimeout(() => {
                                    const link = document.createElement('a');
                                    link.href = `${API_BASE_URL}${doc.url}`;
                                    link.download = doc.filename || doc.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }, index * 500);
                                });
                              }}
                              className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedProcurement(procurement)}
                            className="flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                          >
                            <Info className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Procurements Table */}
            {cancelledProcurements.length > 0 && (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Cancelled ({cancelledProcurements.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {cancelledProcurements.map((procurement) => (
                    <div key={procurement.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              Cancelled
                            </span>
                            <span className="text-sm text-gray-500">{procurement.category}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{procurement.title}</h3>
                          <p className="text-gray-600 mb-3">{procurement.department}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Posted: {new Date(procurement.datePosted || procurement.createdAt || '').toLocaleDateString()}
                            </span>
                            {procurement.deadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Deadline: {new Date(procurement.deadline).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {procurement.description && (
                            <p className="text-gray-600 mt-2 line-clamp-2">{procurement.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <button
                            onClick={() => setSelectedProcurement(procurement)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {publishedProcurements.length === 0 && awardedProcurements.length === 0 && cancelledProcurements.length === 0 && (
              <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No procurements found</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bid Application Modal */}
      {bidModalOpen && bidProcurement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Submit Bid Application</h2>
                <button onClick={() => { setBidModalOpen(false); setBidProcurement(null); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">{bidProcurement?.title}</p>
            </div>
            <form onSubmit={handleBidSubmit} className="p-6 space-y-4">
              {bidSuccess ? (
                <div className="text-center py-8">
                  <div className="text-green-500 text-5xl mb-4">✓</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Bid Submitted Successfully!</h3>
                  <p className="text-gray-600">We will review your application and contact you soon.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input required type="text" value={bidFormData.companyName} onChange={(e) => setBidFormData({...bidFormData, companyName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                      <input required type="text" value={bidFormData.contactPerson} onChange={(e) => setBidFormData({...bidFormData, contactPerson: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input required type="email" value={bidFormData.email} onChange={(e) => setBidFormData({...bidFormData, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input required type="tel" value={bidFormData.phone} onChange={(e) => setBidFormData({...bidFormData, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Address *</label>
                    <textarea required rows={2} value={bidFormData.address} onChange={(e) => setBidFormData({...bidFormData, address: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bid Amount (PHP) *</label>
                    <input required type="number" min="0" step="0.01" value={bidFormData.bidAmount || ''} onChange={(e) => setBidFormData({...bidFormData, bidAmount: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bid Description/Proposal *</label>
                    <textarea required rows={4} value={bidFormData.description} onChange={(e) => setBidFormData({...bidFormData, description: e.target.value})} placeholder="Describe your proposal, qualifications, and any other relevant details..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bid Document (PDF/Word) *</label>
                    <input required type="file" accept=".pdf,.doc,.docx" onChange={(e) => setBidFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    <p className="text-xs text-gray-500 mt-1">Upload your formal bid proposal document</p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => { setBidModalOpen(false); setBidProcurement(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                    <button type="submit" disabled={submittingBid} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {submittingBid ? 'Submitting...' : 'Submit Bid'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcurementsBudgetsPage;
