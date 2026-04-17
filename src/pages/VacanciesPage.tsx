import React, { useState, useEffect, useRef } from 'react';
import { vacanciesApi, applicationsApi } from '../services/api';
import { Briefcase, Building2, DollarSign, Clock, MapPin, ChevronRight, Calendar, X, Upload, FileText, CheckCircle, AlertCircle, User, Phone, Mail, Home, GraduationCap, Building } from 'lucide-react';

interface Requirement {
  id: string;
  name: string;
  description: string;
}

interface Vacancy {
  id: string;
  jobTitle: string;
  position: string;
  department: string;
  employmentType: string;
  estimatedSalary: string;
  jobDescription: string;
  requirements?: Requirement[];
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
  const [requirementFiles, setRequirementFiles] = useState<Record<string, File | null>>({});
  const requirementInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
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
    setRequirementFiles({});
    setResumeFile(null);
  };

  const handleRequirementFileChange = (reqId: string, file: File | null) => {
    setRequirementFiles(prev => ({ ...prev, [reqId]: file }));
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
      
      // Append requirement files
      Object.entries(requirementFiles).forEach(([reqId, file]) => {
        if (file) {
          formData.append(`requirement_${reqId}`, file);
        }
      });
      
      // Append requirements metadata
      if (selectedVacancy.requirements) {
        formData.append('requirements', JSON.stringify(selectedVacancy.requirements));
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
      setRequirementFiles({});
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
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
                <div className="text-center py-8 sm:py-12">
                  <div className="bg-green-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Application Submitted!</h3>
                  <p className="text-gray-600 mb-2">Thank you for your application for <strong>{selectedVacancy.jobTitle}</strong>.</p>
                  <p className="text-gray-500 text-sm">We will review your application and contact you soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4 sm:space-y-6">
                  {/* Personal Information Section */}
                  <div className="bg-blue-50 rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4 flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={applicationData.fullName}
                            onChange={(e) => setApplicationData({ ...applicationData, fullName: e.target.value })}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                        <input
                          type="number"
                          required
                          min="18"
                          max="70"
                          value={applicationData.age}
                          onChange={(e) => setApplicationData({ ...applicationData, age: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter your age"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            required
                            value={applicationData.mobileNumber}
                            onChange={(e) => setApplicationData({ ...applicationData, mobileNumber: e.target.value })}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="09XX XXX XXXX"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={applicationData.email}
                            onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="your@email.com"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                          required
                          rows={2}
                          value={applicationData.address}
                          onChange={(e) => setApplicationData({ ...applicationData, address: e.target.value })}
                          className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter your complete address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Background Section */}
                  <div className="bg-green-50 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Background
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                        <textarea
                          rows={2}
                          placeholder="List your educational background (degrees, schools, etc.)"
                          value={applicationData.education}
                          onChange={(e) => setApplicationData({ ...applicationData, education: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience</label>
                        <textarea
                          rows={2}
                          placeholder="Describe your relevant work experience..."
                          value={applicationData.experience}
                          onChange={(e) => setApplicationData({ ...applicationData, experience: e.target.value })}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Required Documents Section */}
                  <div className="bg-orange-50 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Required Documents
                    </h3>

                    {/* Standard Resume Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resume/CV (PDF, DOC, DOCX) *
                      </label>
                      <div className="flex items-center gap-3">
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
                          className={`flex items-center px-4 py-2.5 border-2 border-dashed rounded-lg transition-colors ${
                            resumeFile ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          {resumeFile ? 'Change File' : 'Choose File'}
                        </button>
                        {resumeFile ? (
                          <span className="text-sm text-green-700 flex items-center font-medium">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {resumeFile.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                            Required
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Requirement Uploads */}
                    {selectedVacancy.requirements && selectedVacancy.requirements.length > 0 && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-orange-200">
                        <p className="text-sm font-medium text-orange-800 mb-3">
                          Additional Requirements for this position:
                        </p>
                        {selectedVacancy.requirements.map((req) => (
                          <div key={req.id} className="bg-white rounded-lg p-4 border border-orange-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <label className="block text-sm font-semibold text-gray-800 mb-1">
                                  {req.name} *
                                </label>
                                {req.description && (
                                  <p className="text-xs text-gray-500 mb-2">{req.description}</p>
                                )}
                                <div className="flex items-center gap-3">
                                  <input
                                    ref={(el) => { requirementInputRefs.current[req.id] = el; }}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,image/*"
                                    onChange={(e) => handleRequirementFileChange(req.id, e.target.files?.[0] || null)}
                                    className="hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => requirementInputRefs.current[req.id]?.click()}
                                    className={`flex items-center px-3 py-2 text-sm border-2 border-dashed rounded-lg transition-colors ${
                                      requirementFiles[req.id] ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                                    }`}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {requirementFiles[req.id] ? 'Change File' : 'Upload'}
                                  </button>
                                  {requirementFiles[req.id] ? (
                                    <span className="text-sm text-green-700 flex items-center">
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      {requirementFiles[req.id]?.name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-orange-600 flex items-center">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Required
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(false)}
                      className="flex-1 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !resumeFile}
                      className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-medium hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                          Submitting...
                        </span>
                      ) : (
                        'Submit Application'
                      )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {vacancies.map((vacancy) => (
            <div key={vacancy.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-4 sm:p-6">
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
                  <FileText className="h-4 w-4 mr-2" />
                  Apply for this Position
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
