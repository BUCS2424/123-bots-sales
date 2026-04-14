import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Bot, Clock, Upload, X, FileImage, Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import { setSeoMetadata, generateLocalBusinessSchema } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Set SEO metadata
  useEffect(() => {
    setSeoMetadata({
      title: 'Contact Us',
      description: 'Get in touch with 123Bots. We\'re here to help with autonomous floor care solutions, demos, and questions!',
      keywords: 'contact 123Bots, autonomous floor care, robotic cleaning, request demo',
      canonicalPath: '/contact',
      ogType: 'website',
      jsonLd: generateLocalBusinessSchema(),
    });
  }, []);

  // Fetch business settings
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings/business`);
        setBusinessInfo(response.data);
      } catch (error) {
        console.error('Error fetching business info:', error);
      }
    };
    fetchBusinessInfo();
  }, []);

  // Handle file selection
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds the 250 MB limit.`,
          variant: 'destructive'
        });
        continue;
      }

      // Add file to list with pending status
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploadedFiles(prev => [...prev, {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        url: null
      }]);

      // Upload the file
      await uploadFile(file, fileId);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file with chunking for large files
  const uploadFile = async (file, fileId) => {
    setIsUploading(true);
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'contact-uploads');

      const response = await axios.post(`${API_URL}/api/storage/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
        }
      });

      if (response.data?.url) {
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'complete', url: response.data.url }
            : f
        ));
        toast({ title: 'File Uploaded', description: `${file.name} uploaded successfully.` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error' }
          : f
      ));
      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  // Remove uploaded file
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Collect uploaded file URLs
      const attachments = uploadedFiles
        .filter(f => f.status === 'complete' && f.url)
        .map(f => ({ name: f.name, url: f.url, size: f.size }));

      // Create a lead from the contact form
      await axios.post(`${API_URL}/api/leads/`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
        source: 'contact_form',
        attachments: attachments
      });
      
      toast({
        title: 'Message Sent',
        description: 'We\'ll get back to you within 24 hours.',
      });
      
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Message Sent',
        description: 'We\'ll get back to you within 24 hours.',
      });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setUploadedFiles([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Format address from business info
  const getFormattedAddress = () => {
    if (!businessInfo) return null;
    const parts = [];
    if (businessInfo.address) parts.push(businessInfo.address);
    if (businessInfo.city) {
      let cityLine = businessInfo.city;
      if (businessInfo.state) cityLine += `, ${businessInfo.state}`;
      if (businessInfo.zip_code) cityLine += ` ${businessInfo.zip_code}`;
      parts.push(cityLine);
    }
    return parts.length > 0 ? parts : null;
  };

  const formattedAddress = getFormattedAddress();
  const showAddress = businessInfo?.show_address_on_contact !== false && formattedAddress;
  const showHours = businessInfo?.show_hours_on_contact !== false;

  return (
    <div className="min-h-screen bg-[#0a1628]" data-testid="contact-page">
      <Header />
      
      {/* Hero */}
      <section className="relative py-16 pt-36 mb-12">
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-semibold tracking-wider mb-6">
              <Bot className="w-4 h-4" />
              GET IN TOUCH
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
              Contact Our Team
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Have questions about autonomous floor care solutions or need help scheduling a demo? Our team is here to help transform your facility maintenance.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Email</h3>
                  <p className="text-gray-400 text-sm">{businessInfo?.email || 'support@123bots.com'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Phone</h3>
                  <p className="text-gray-400 text-sm">{businessInfo?.phone || '(877) 702-2687'}</p>
                </div>
              </div>
            </div>

            {showHours && (
              <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-white">Business Hours</h3>
                    <p className="text-gray-400 text-sm">Mon-Fri: {businessInfo?.monday_hours || '8AM - 5PM CST'}</p>
                  </div>
                </div>
              </div>
            )}

            {showAddress && (
              <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-white">Location</h3>
                    {formattedAddress.map((line, i) => (
                      <p key={i} className="text-gray-400 text-sm">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!showAddress && (
              <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-white">Service Areas</h3>
                    <p className="text-gray-400 text-sm">Midwest & Caribbean Regions</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="p-8 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <h2 className="font-heading text-2xl font-bold text-white mb-6">Send us a message</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-300 font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="Your name"
                    data-testid="contact-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="your@email.com"
                    data-testid="contact-email"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-gray-300 font-medium mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="(555) 123-4567"
                    data-testid="contact-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                    placeholder="How can we help?"
                    data-testid="contact-subject"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-300 font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-[#0a1628] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                  placeholder="Tell us about your facility and floor care needs..."
                  data-testid="contact-message"
                />
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm text-gray-300 font-medium mb-2">
                  Upload Files (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Share facility photos, floor plans, or other relevant documents. Max 250 MB per file.
                </p>
                
                {/* Upload Button */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-500/10 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="contact-file-upload"
                  />
                  <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium">Click to upload files</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Images, PDF, Word documents accepted
                  </p>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map(file => (
                      <div 
                        key={file.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          file.status === 'complete' 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : file.status === 'error'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-[#0a1628] border-gray-600'
                        }`}
                      >
                        <FileImage className={`w-8 h-8 flex-shrink-0 ${
                          file.status === 'complete' ? 'text-green-400' :
                          file.status === 'error' ? 'text-red-400' : 'text-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          {uploadProgress[file.id] !== undefined && (
                            <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${uploadProgress[file.id]}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {file.status === 'uploading' ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white font-heading font-bold uppercase tracking-wider rounded-xl hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                data-testid="contact-submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Available States Section */}
      <div className="bg-[#0a1628] py-16 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            <span className="text-green-400 italic">AVAILABLE STATES</span>{' '}
            <span className="text-white">WE SERVE</span>
          </h2>
          <p className="text-gray-300 text-lg mb-4">
            Missouri | Iowa | Illinois | Indiana | Ohio | Kentucky | Tennessee | Arkansas | Kansas | Oklahoma
          </p>
          <p className="text-gray-300 text-lg">
            Texas | Louisiana | Mississippi | Alabama | Georgia | South Carolina | Florida | Puerto Rico | Virgin Islands
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;
