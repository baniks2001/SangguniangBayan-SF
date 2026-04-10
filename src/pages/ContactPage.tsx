import React, { useState, useRef } from 'react';
import { Mail, MapPin, Phone, Clock, Send, Building2, CheckCircle, Upload, X } from 'lucide-react';

// Facebook icon component (not available in lucide-react)
const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

// Hardcoded contact information
const SYSTEM_NAME = 'Sangguniang Bayan';
const MUNICIPALITY = 'San Francisco';
const PROVINCE = 'Southern Leyte';
const OFFICE_ADDRESS = 'Municipal Compound, Poblacion, San Francisco, Southern Leyte 6210, Philippines';
const CONTACT_EMAIL = 'sb.sanfrancisco@gmail.com';
const CONTACT_PHONE = '0926-905-3859';
const OFFICE_HOURS = 'Monday - Friday, 8:00 AM - 5:00 PM';
const FACEBOOK_URL = 'https://web.facebook.com/profile.php?id=61578350702689';

// Google Maps embed URL for San Francisco, Southern Leyte Municipal Hall
// Using standard Google Maps embed format
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d980.8590714774128!2d125.15793428939061!3d10.055809788399877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3307290079d6e7c3%3A0x8df3c83604bbfdd8!2sSB%20Building%20-%20LGU%20San%20Francisco!5e1!3m2!1sen!2sph!4v1775544137684!5m2!1sen!2sph';

const SUBJECT_OPTIONS = [
  { value: '', label: 'Select a subject...' },
  { value: 'Inquire', label: 'Inquire' },
  { value: 'Appointment', label: 'Appointment' },
  { value: 'Complain', label: 'Complain' }
];

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjectType: '',
    message: ''
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isComplain = formData.subjectType === 'Complain';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 3) {
      alert('You can only upload up to 3 images');
      return;
    }
    
    const newImages = [...images, ...files].slice(0, 3);
    setImages(newImages);
    
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
    URL.revokeObjectURL(imagePreviews[index]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isComplain && images.length < 3) {
      alert('Please upload at least 3 images for your complaint');
      return;
    }

    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('subjectType', formData.subjectType);
      formDataToSend.append('message', formData.message);
      
      images.forEach((image, index) => {
        formDataToSend.append(`image${index + 1}`, image);
      });

      const response = await fetch('/api/submit?endpoint=contact', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }
      
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', subjectType: '', message: '' });
      setImages([]);
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto">
            Get in touch with the Sangguniang Bayan of San Francisco. We're here to serve you.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-6">
            {/* Office Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                Office Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address</h3>
                    <p className="mt-1 text-gray-600">{OFFICE_ADDRESS}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Email</h3>
                    <p className="mt-1 text-gray-600">{CONTACT_EMAIL}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Phone</h3>
                    <p className="mt-1 text-gray-600">{CONTACT_PHONE}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-orange-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Office Hours</h3>
                    <p className="mt-1 text-gray-600">{OFFICE_HOURS}</p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Follow Us</h3>
                <a 
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FacebookIcon className="h-5 w-5 mr-2" />
                  Facebook Page
                </a>
              </div>
            </div>

            {/* Google Map */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-6 w-6 mr-2 text-red-600" />
                Location Map
              </h2>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src={GOOGLE_MAPS_URL}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Municipal Hall Location"
                  className="w-full"
                />
              </div>
              <p className="mt-3 text-sm text-gray-500 text-center">
                Municipal Compound of San Francisco, Southern Leyte
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
            <p className="text-gray-600 mb-6">Fill out the form below and we'll get back to you as soon as possible.</p>
            
            {submitSuccess ? (
              <div className="text-center py-12">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="(053) xxx-xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    required
                    value={formData.subjectType}
                    onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
                  >
                    {SUBJECT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isComplain && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Images * <span className="text-red-500">(Required: 3 images)</span>
                    </label>
                    <div className="space-y-3">
                      {images.length < 3 && (
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">
                                Click to upload images ({images.length}/3)
                              </p>
                              <p className="text-xs text-gray-400">PNG, JPG, JPEG</p>
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                      
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {images.length < 3 && (
                        <p className="text-sm text-red-500">
                          Please upload at least {3 - images.length} more image{3 - images.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Write your message here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <section className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">Legislative Sessions</h3>
              <p className="text-blue-200">Every Monday at 9:00 AM</p>
              <p className="text-blue-300 text-sm mt-1">Session Hall, Municipal Hall</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Document Requests</h3>
              <p className="text-blue-200">Monday - Friday</p>
              <p className="text-blue-300 text-sm mt-1">8:00 AM - 5:00 PM</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Public Assistance</h3>
              <p className="text-blue-200">Walk-in or By Appointment</p>
              <p className="text-blue-300 text-sm mt-1">Contact us for scheduling</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
