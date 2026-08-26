import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Wrench, Phone, Send, Clock, ShieldCheck, Upload, X, FileImage, Loader2, Camera, ScanLine } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import axios from 'axios';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSiteFeatureFlags } from '../hooks/useSiteFeatureFlags';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250 MB

// Manufacturer serials show up as anything from a QR code to a Code128 or
// UPC label - scan for every format the library supports, not just QR.
const ALL_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.MAXICODE,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.RSS_14,
  Html5QrcodeSupportedFormats.RSS_EXPANDED,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
];

const emptyForm = {
  name: '', email: '', phone: '',
  make: '', model: '', serial_number: '',
  purchase_date: '', warranty_status: '', service_contract: '',
  issue_description: '', urgency: 'normal', service_method: '', preferred_service_date: '',
  site_address: '', city: '', state: '', zip_code: '',
};

const ServiceRequestPage = () => {
  const { service_crm_enabled: enabled, service_crm_product_name: productName, _loaded } = useSiteFeatureFlags();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [scanningSerial, setScanningSerial] = useState(false);
  const serialScannerRef = useRef(null);

  useEffect(() => {
    setSeoMetadata({
      title: `Get Your ${productName || 'Robot'} Serviced`,
      description: `Request service or repair for your ${(productName || 'Robot').toLowerCase()}. Tell us the make, model, and issue and our team will get back to you.`,
      keywords: `${productName || 'robot'} service, ${productName || 'robot'} repair, maintenance request`,
      canonicalPath: '/service-request',
      ogType: 'website',
    });
  }, [productName]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'File Too Large', description: `${file.name} exceeds the 250 MB limit.`, variant: 'destructive' });
        continue;
      }
      const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploadedFiles((prev) => [...prev, { id: fileId, name: file.name, size: file.size, status: 'uploading', url: null }]);
      await uploadFile(file, fileId);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file, fileId) => {
    setIsUploading(true);
    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'service-request-uploads');

      const response = await axios.post(`${API_URL}/api/storage/upload`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
        },
      });
      if (response.data?.url) {
        setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'complete', url: response.data.url } : f)));
      }
    } catch (error) {
      setUploadedFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, status: 'error' } : f)));
      toast({ title: 'Upload Failed', description: `Failed to upload ${file.name}.`, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
  };

  const removeFile = (fileId) => setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const stopSerialScan = useCallback(async () => {
    if (serialScannerRef.current) {
      try { await serialScannerRef.current.stop(); serialScannerRef.current.clear(); } catch { /* ignore */ }
      serialScannerRef.current = null;
    }
    setScanningSerial(false);
  }, []);

  useEffect(() => {
    if (!scanningSerial) return;
    let cancelled = false;
    const start = async () => {
      try {
        const html5 = new Html5Qrcode('service-request-serial-reader', { formatsToSupport: ALL_BARCODE_FORMATS, verbose: false });
        serialScannerRef.current = html5;
        await html5.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          async (decodedText) => {
            await stopSerialScan();
            setFormData((prev) => ({ ...prev, serial_number: decodedText }));
            toast({ title: 'Serial Captured', description: decodedText });
          },
          () => {},
        );
        if (cancelled) await stopSerialScan();
      } catch (e) {
        toast({ title: 'Camera error', description: 'Could not start camera. Enter the serial manually instead.', variant: 'destructive' });
        setScanningSerial(false);
      }
    };
    start();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanningSerial, stopSerialScan]);

  useEffect(() => () => { stopSerialScan(); }, [stopSerialScan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const attachments = uploadedFiles
        .filter((f) => f.status === 'complete' && f.url)
        .map((f) => ({ name: f.name, url: f.url, size: f.size }));

      await axios.post(`${API_URL}/api/service-crm/`, {
        ...formData,
        attachments,
        source: 'service_request_form',
      });

      setSubmitted(true);
      toast({ title: 'Request Submitted', description: "We'll be in touch shortly to schedule service." });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit your request. Please try again or call us.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wait for flags to load before deciding to redirect, so a direct hard
  // refresh doesn't briefly bounce a visitor before flags arrive.
  if (_loaded && !enabled) {
    return <Navigate to="/" replace />;
  }

  const inputClass = 'w-full px-4 py-3 bg-bots-dark border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all';
  const labelClass = 'block text-sm text-gray-300 font-medium mb-2';

  if (submitted) {
    return (
      <div className="min-h-screen bg-bots-dark">
        <Header />
        <section className="pt-40 pb-24">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white mb-4">Request Received</h1>
            <p className="text-gray-300 text-lg">
              Thanks{formData.name ? `, ${formData.name}` : ''} - our team will review your {(productName || 'robot').toLowerCase()} service request and reach out shortly.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bots-dark" data-testid="service-request-page">
      <Header />

      {/* Hero */}
      <section className="relative py-16 pt-36 mb-12">
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-semibold tracking-wider mb-6">
              <Wrench className="w-4 h-4" />
              SERVICE &amp; REPAIR
            </span>
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4">
              Get Your {productName || 'Robot'} Serviced
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Tell us about your {(productName || 'robot').toLowerCase()} and the issue you're experiencing. Our service team will follow up to get it back up and running.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Info column */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Fast Response</h3>
                  <p className="text-gray-400 text-sm">We typically follow up within one business day</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Warranty &amp; Contract Aware</h3>
                  <p className="text-gray-400 text-sm">Let us know your warranty or service contract status</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-white">Prefer to Call?</h3>
                  <p className="text-gray-400 text-sm">(877) 702-2687</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="p-8 bg-[#111d2e] border border-gray-700 rounded-2xl">
              <h2 className="font-heading text-2xl font-bold text-white mb-6">Service Request Details</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Your name" data-testid="service-request-name" />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="your@email.com" data-testid="service-request-email" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="(555) 123-4567" data-testid="service-request-phone" />
                </div>
                <div>
                  <label className={labelClass}>Urgency</label>
                  <select name="urgency" value={formData.urgency} onChange={handleChange} className={inputClass} data-testid="service-request-urgency">
                    <option value="low">Low - no rush</option>
                    <option value="normal">Normal</option>
                    <option value="high">High - impacting operations</option>
                    <option value="urgent">Urgent - unit is down</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>{productName || 'Robot'} Make</label>
                  <input type="text" name="make" value={formData.make} onChange={handleChange} required className={inputClass} placeholder="e.g. PUDU, Avidbots" data-testid="service-request-make" />
                </div>
                <div>
                  <label className={labelClass}>{productName || 'Robot'} Model</label>
                  <input type="text" name="model" value={formData.model} onChange={handleChange} required className={inputClass} placeholder="e.g. CC1 Pro" data-testid="service-request-model" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Serial Number (Optional)</label>
                  <div className="flex gap-2">
                    <input type="text" name="serial_number" value={formData.serial_number} onChange={handleChange} className={inputClass} data-testid="service-request-serial" />
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => (scanningSerial ? stopSerialScan() : setScanningSerial(true))}
                        className="flex-shrink-0 px-3 rounded-xl border border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
                        title="Scan your unit's serial number"
                        data-testid="service-request-scan-serial-toggle"
                      >
                        {scanningSerial ? <ScanLine className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                  {scanningSerial && (
                    <div className="mt-2 overflow-hidden rounded-xl border border-gray-600 bg-black">
                      <div id="service-request-serial-reader" className="mx-auto w-full max-w-xs" />
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Purchase / Install Date (Optional)</label>
                  <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} className={inputClass} data-testid="service-request-purchase-date" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Warranty Status (Optional)</label>
                  <select name="warranty_status" value={formData.warranty_status} onChange={handleChange} className={inputClass} data-testid="service-request-warranty-status">
                    <option value="">Not sure</option>
                    <option value="in_warranty">In Warranty</option>
                    <option value="out_of_warranty">Out of Warranty</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Service Contract # (Optional)</label>
                  <input type="text" name="service_contract" value={formData.service_contract} onChange={handleChange} className={inputClass} placeholder="If applicable" data-testid="service-request-service-contract" />
                </div>
              </div>

              <div className="mb-6">
                <label className={labelClass}>What's going on with your {(productName || 'robot').toLowerCase()}?</label>
                <textarea name="issue_description" value={formData.issue_description} onChange={handleChange} required rows={4} className={`${inputClass} resize-none`} placeholder="Describe the issue in as much detail as you can..." data-testid="service-request-issue" />
              </div>

              <div className="mb-6">
                <label className={labelClass}>How would you like this serviced?</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${formData.service_method === 'ship_in' ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 bg-bots-dark'}`}>
                    <input type="radio" name="service_method" value="ship_in" checked={formData.service_method === 'ship_in'} onChange={handleChange} className="accent-blue-500" data-testid="service-request-method-ship" />
                    <span className="text-white text-sm font-medium">Ship It In</span>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${formData.service_method === 'on_site' ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 bg-bots-dark'}`}>
                    <input type="radio" name="service_method" value="on_site" checked={formData.service_method === 'on_site'} onChange={handleChange} className="accent-blue-500" data-testid="service-request-method-onsite" />
                    <span className="text-white text-sm font-medium">On-Site Service Visit</span>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Preferred Service Date (Optional)</label>
                  <input type="date" name="preferred_service_date" value={formData.preferred_service_date} onChange={handleChange} className={inputClass} data-testid="service-request-preferred-date" />
                </div>
                <div>
                  <label className={labelClass}>{formData.service_method === 'ship_in' ? 'Return Shipping Address' : 'Site Address'} {formData.service_method !== 'on_site' && '(Optional)'}</label>
                  <input type="text" name="site_address" value={formData.site_address} onChange={handleChange} required={formData.service_method === 'on_site'} className={inputClass} placeholder={formData.service_method === 'ship_in' ? 'Where should we ship it back to?' : 'If on-site service is needed'} data-testid="service-request-site-address" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} data-testid="service-request-city" />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className={inputClass} data-testid="service-request-state" />
                </div>
                <div>
                  <label className={labelClass}>Zip Code</label>
                  <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} className={inputClass} data-testid="service-request-zip" />
                </div>
              </div>

              {/* File upload */}
              <div className="mb-6">
                <label className={labelClass}>Photos or Video (Optional)</label>
                <p className="text-xs text-gray-500 mb-3">Share photos or a short video of the issue - it helps our technicians diagnose faster. Max 250 MB per file.</p>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-500/10 transition-all">
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,.pdf" onChange={handleFileSelect} className="hidden" data-testid="service-request-file-upload" />
                  <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-300 font-medium">Click to upload files</p>
                  <p className="text-gray-500 text-sm mt-1">Images, video, or PDF accepted</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className={`flex items-center gap-3 p-3 rounded-lg border ${file.status === 'complete' ? 'bg-green-500/10 border-green-500/30' : file.status === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-bots-dark border-gray-600'}`}>
                        <FileImage className={`w-8 h-8 flex-shrink-0 ${file.status === 'complete' ? 'text-green-400' : file.status === 'error' ? 'text-red-400' : 'text-gray-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          {uploadProgress[file.id] !== undefined && (
                            <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress[file.id]}%` }} />
                            </div>
                          )}
                        </div>
                        {file.status === 'uploading' ? (
                          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        ) : (
                          <button type="button" onClick={() => removeFile(file.id)} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
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
                data-testid="service-request-submit"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Service Request
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ServiceRequestPage;
