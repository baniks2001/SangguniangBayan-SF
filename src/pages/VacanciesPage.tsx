import React, { useState, useEffect, useRef } from 'react';
import { vacanciesApi, applicationsApi } from '../services/api';
import { Briefcase, Building2, DollarSign, Clock, MapPin, ChevronRight, Calendar, X, Upload, FileText } from 'lucide-react';

interface Vacancy {
  id: string;
  jobTitle: string;
  position: string;
  department: string;
  employmentType: string;
  estimatedSalary: string;
  jobDescription: string;
  requirements?: string[];
  closingDate?: string;
}

const VacanciesPage: React.FC = () => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    age: '',
    mobileNumber: '',
    email: '',
    address: '',
    education: '',
    experience: ''
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadVacancies();
  }, []);

  const loadVacancies = async () => {
    try {
      setLoading(true);
      const response = await vacanciesApi.getAll();
      setVacancies(response.vacancies || []);
    } catch (error) {
      console.error('Error loading vacancies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setShowApplicationForm(true);
    setSubmitSuccess(false);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacancy) return;

    try {
      setSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('vacancyId', selectedVacancy.id);
      formData.append('fullName', applicationData.fullName);
      formData.append('age', applicationData.age);
      formData.append('mobileNumber', applicationData.mobileNumber);
      formData.append('email', applicationData.email);
      formData.append('address', applicationData.address);
      formData.append('education', applicationData.education);
      formData.append('experience', applicationData.experience);
      
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      
      await applicationsApi.submitWithFile(formData);
      setSubmitSuccess(true);
      setApplicationData({
        fullName: '',
        age: '',
        mobileNumber: '',
        email: '',
        address: '',
        education: '',
        experience: ''
      });
      setResumeFile(null);
      setTimeout(() => {
        setShowApplicationForm(false);
        setSelectedVacancy(null);
      }, 2000);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Briefcase className="h-8 w-8 mr-3 text-orange-600" />
          Job Vacancies
        </h1>
        <p className="mt-2 text-gray-600">
          Explore career opportunities with the Sangguniang Bayan and municipal government.
        </p>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && selectedVacancy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Apply for: {selectedVacancy.jobTitle}
              </h2>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {submitSuccess ? (
                <div className="text-center py-8">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Application Submitted!</h3>
                  <p className="text-gray-600">Thank you for your application. We will review it and contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={applicationData.fullName}
                        onChange={(e) => setApplicationData({ ...applicationData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                      <input
                        type="number"
                        required
                        value={applicationData.age}
                        onChange={(e) => setApplicationData({ ...applicationData, age: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={applicationData.mobileNumber}
                        onChange={(e) => setApplicationData({ ...applicationData, mobileNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={applicationData.email}
                        onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea
                      required
                      rows={2}
                      value={applicationData.address}
                      onChange={(e) => setApplicationData({ ...applicationData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <textarea
                      rows={2}
                      placeholder="List your educational background..."
                      value={applicationData.education}
                      onChange={(e) => setApplicationData({ ...applicationData, education: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience</label>
                    <textarea
                      rows={2}
                      placeholder="Describe your relevant work experience..."
                      value={applicationData.experience}
                      onChange={(e) => setApplicationData({ ...applicationData, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume/CV (PDF, DOC, DOCX) *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </button>
                      {resumeFile ? (
                        <span className="text-sm text-green-600 flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {resumeFile.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">No file selected</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !resumeFile}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vacancies List */}
      {vacancies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map((vacancy) => (
            <div key={vacancy.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Briefcase className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{vacancy.jobTitle}</h3>
                <p className="text-sm text-gray-600 mb-4">{vacancy.position}</p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    {vacancy.department}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {vacancy.employmentType}
                  </div>
                  {vacancy.estimatedSalary && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      {vacancy.estimatedSalary}
                    </div>
                  )}
                  {vacancy.closingDate && (
                    <div className="flex items-center text-orange-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Closes: {new Date(vacancy.closingDate).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-3 mb-4">{vacancy.jobDescription}</p>

                <button
                  onClick={() => handleApply(vacancy)}
                  className="w-full flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Apply Now
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Vacancies</h3>
          <p className="text-gray-500">There are currently no job openings. Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default VacanciesPage;
