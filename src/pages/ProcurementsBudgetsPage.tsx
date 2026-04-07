import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';

// Types
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
  documents: { name: string; url: string }[];
}

// Hardcoded procurement data
const PROCUREMENT_DATA: ProcurementItem[] = [
  {
    id: '1',
    title: 'Supply of Office Equipment and Furniture',
    category: 'Goods',
    department: 'SB Office',
    budget: 150000,
    status: 'Open',
    datePosted: '2024-01-15',
    deadline: '2024-02-15',
    description: 'Procurement of office desks, chairs, filing cabinets, and computer equipment for the Sangguniang Bayan office.',
    documents: [
      { name: 'Invitation to Bid', url: '#' },
      { name: 'Terms of Reference', url: '#' }
    ]
  },
  {
    id: '2',
    title: 'Printing Services for Legislative Documents',
    category: 'Services',
    department: 'Legislative Staff',
    budget: 75000,
    status: 'Awarded',
    datePosted: '2024-01-10',
    deadline: '2024-02-10',
    description: 'Annual printing services contract for resolutions, ordinances, and other legislative documents.',
    documents: [
      { name: 'Notice of Award', url: '#' },
      { name: 'Contract Agreement', url: '#' }
    ]
  },
  {
    id: '3',
    title: 'Repair and Maintenance of SB Building',
    category: 'Infrastructure',
    department: 'Maintenance',
    budget: 250000,
    status: 'Closed',
    datePosted: '2024-01-05',
    deadline: '2024-02-05',
    description: 'General repair and maintenance works including electrical, plumbing, and painting works.',
    documents: [
      { name: 'Bid Results', url: '#' }
    ]
  },
  {
    id: '4',
    title: 'Supply of IT Equipment and Software',
    category: 'Goods',
    department: 'IT Unit',
    budget: 300000,
    status: 'Open',
    datePosted: '2024-01-20',
    deadline: '2024-02-28',
    description: 'Computers, printers, network equipment, and licensed software for legislative operations.',
    documents: [
      { name: 'Invitation to Bid', url: '#' },
      { name: 'Technical Specifications', url: '#' }
    ]
  },
  {
    id: '5',
    title: 'Catering Services for SB Sessions',
    category: 'Services',
    department: 'SB Secretary',
    budget: 120000,
    status: 'Awarded',
    datePosted: '2024-01-12',
    deadline: '2024-02-12',
    description: 'Catering services for regular and special sessions of the Sangguniang Bayan.',
    documents: [
      { name: 'Notice of Award', url: '#' }
    ]
  }
];

// Budget summary data
const BUDGET_SUMMARY = {
  totalBudget: 2500000,
  utilizedBudget: 1850000,
  remainingBudget: 650000,
  procurementCount: {
    open: 2,
    awarded: 2,
    closed: 1,
    total: 5
  }
};

const ProcurementsBudgetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  // Filter procurements
  const filteredProcurements = PROCUREMENT_DATA.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.department.toLowerCase().includes(searchTerm.toLowerCase());
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
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(BUDGET_SUMMARY.totalBudget)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilized</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(BUDGET_SUMMARY.utilizedBudget)}</p>
              </div>
              <FileText className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(BUDGET_SUMMARY.remainingBudget)}</p>
              </div>
              <Calendar className="h-10 w-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Biddings</p>
                <p className="text-2xl font-bold text-purple-700">{BUDGET_SUMMARY.procurementCount.open}</p>
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
        
        {filteredProcurements.length === 0 ? (
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
                          <span>Posted: {new Date(item.datePosted).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-blue-600">Budget: {formatCurrency(item.budget)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-64 flex flex-col gap-2">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Documents:</p>
                      {item.documents.map((doc, index) => (
                        <button
                          key={index}
                          className="flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.name}
                          </span>
                          <Download className="h-4 w-4" />
                        </button>
                      ))}
                      {item.status === 'Open' && (
                        <button className="mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                          <ExternalLink className="h-4 w-4" />
                          View Details
                        </button>
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
