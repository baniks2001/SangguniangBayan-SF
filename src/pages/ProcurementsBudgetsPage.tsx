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
  Loader2
} from 'lucide-react';

// Types
interface ProcurementDocument {
  name: string;
  url: string;
  filename: string;
}

interface ProcurementItem {
  id: string;
  title: string;
  category: string;
  department: string;
  budget: number;
  status: 'Open' | 'Closed' | 'Awarded' | 'Cancelled';
  datePosted: string;
  deadline: string;
  description: string;
  documents: ProcurementDocument[];
  isPublic: boolean;
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
  
  const response = await fetch(`/api/procurements?${queryParams}`);
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

const ProcurementsBudgetsPage: React.FC = () => {
  const [procurements, setProcurements] = useState<ProcurementItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Filter procurements
  const filteredProcurements = procurements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      case 'Awarded': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
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

      {/* Budget Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(budgetSummary.totalBudget)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilized</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(budgetSummary.utilizedBudget)}</p>
              </div>
              <FileText className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(budgetSummary.remainingBudget)}</p>
              </div>
              <Calendar className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Biddings</p>
                <p className="text-2xl font-bold text-purple-700">{budgetSummary.openCount}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-purple-500" />
            </div>
          </div>
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

      {/* Procurement List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Procurements</h2>
        
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-lg">Loading procurements...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-red-500 text-lg">{error}</p>
            <button 
              onClick={loadProcurements}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredProcurements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No procurements found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProcurements.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className="text-sm text-gray-500">{item.category}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-sm text-gray-500">{item.department}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Posted: {formatDate(item.datePosted)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline: {formatDate(item.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-blue-600">Budget: {formatCurrency(item.budget)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-72 flex flex-col gap-2">
                      {item.documents && item.documents.length > 0 && (
                        <>
                          <p className="text-sm font-semibold text-gray-700 mb-1">Documents:</p>
                          {item.documents.map((doc, index) => (
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcurementsBudgetsPage;
