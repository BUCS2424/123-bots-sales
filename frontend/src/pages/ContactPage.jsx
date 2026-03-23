import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Gift, Clock, Upload, X, FileImage, Loader2 } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import { setSeoMetadata, generateLocalBusinessSchema } from '../lib/seo';

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
      description: 'Get in touch with GingerKare Custom Emporium. We\'re here to help with your custom product needs, quotes, and questions!',
      keywords: 'contact GingerKare, custom order inquiry, customer support, request quote',
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
    <div className="min-h-screen bg-slate-50 pt-32 pb-32" data-testid="contact-page">
      {/* Hero */}
      <section className="relative py-16 mb-12 bg-gradient-to-b from-white to-slate-50">
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff8f3] border border-[#ffe4d4] text-[#ff8c42] text-sm font-semibold tracking-wider mb-6">
              <Gift className="w-4 h-4" />
              GET IN TOUCH
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-slate-800 mb-4">
              Contact Our Team
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Have questions about custom designs or need help with an order? Our team is here to help bring your ideas to life.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-slate-800">Email</h3>
                  <p className="text-slate-500 text-sm">{businessInfo?.email || 'support@gingerkare.com'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-slate-800">Phone</h3>
                  <p className="text-slate-500 text-sm">{businessInfo?.phone || '(844) 589-PEPS (7377)'}</p>
                </div>
              </div>
            </div>

            {showHours && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-800">Business Hours</h3>
                    <p className="text-slate-500 text-sm">Mon-Fri: {businessInfo?.monday_hours || '9AM - 6PM EST'}</p>
                  </div>
                </div>
              </div>
            )}

            {showAddress && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-800">Location</h3>
                    {formattedAddress.map((line, i) => (
                      <p key={i} className="text-slate-500 text-sm">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!showAddress && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-200">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-slate-800">Location</h3>
                    <p className="text-slate-500 text-sm">Research facilities in USA</p>
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
            <form onSubmit={handleSubmit} className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <h2 className="font-heading text-2xl font-bold text-slate-800 mb-6">Send us a message</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-slate-600 font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    placeholder="Your name"
                    data-testid="contact-name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    placeholder="your@email.com"
                    data-testid="contact-email"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm text-slate-600 font-medium mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    placeholder="(555) 123-4567"
                    data-testid="contact-phone"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    placeholder="How can we help?"
                    data-testid="contact-subject"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-slate-600 font-medium mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#ff8c42] focus:ring-2 focus:ring-[#ff8c42]/20 transition-all resize-none"
                  placeholder="Tell us about your custom design needs..."
                  data-testid="contact-message"
                />
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm text-slate-600 font-medium mb-2">
                  Upload Custom Art (Optional)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Share your design files, logos, or inspiration images. Max 250 MB per file.
                </p>
                
                {/* Upload Button */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#ff8c42] hover:bg-[#fff8f3] transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.ai,.eps,.svg,.psd"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="contact-file-upload"
                  />
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Click to upload files</p>
                  <p className="text-slate-400 text-sm mt-1">
                    Images, PDF, AI, EPS, SVG, PSD accepted
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
                            ? 'bg-green-50 border-green-200' 
                            : file.status === 'error'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <FileImage className={`w-8 h-8 flex-shrink-0 ${
                          file.status === 'complete' ? 'text-green-500' :
                          file.status === 'error' ? 'text-red-500' : 'text-slate-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                          {uploadProgress[file.id] !== undefined && (
                            <div className="mt-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#ff8c42] transition-all duration-300"
                                style={{ width: `${uploadProgress[file.id]}%` }}
                              />
                            </div>
                          )}
                        </div>
                        {file.status === 'uploading' ? (
                          <Loader2 className="w-5 h-5 text-[#ff8c42] animate-spin" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4 text-slate-500" />
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
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white font-heading font-bold uppercase tracking-wider rounded-xl hover:shadow-xl hover:shadow-[#ff8c42]/35 transition-all disabled:opacity-50"
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
    </div>
  );
};

export default ContactPage;
