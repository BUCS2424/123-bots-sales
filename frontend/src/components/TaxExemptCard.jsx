import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from '../hooks/use-toast';
import { ShieldCheck, Info, UploadCloud, Eye, Printer, Download, FileText, X, Loader2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;
const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const TaxExemptCard = ({ entityType, entityId, initialExempt = false, initialInfo = null, onSaved }) => {
  const [taxExempt, setTaxExempt] = useState(Boolean(initialExempt));
  const [certificateNumber, setCertificateNumber] = useState(initialInfo?.certificate_number || '');
  const [reason, setReason] = useState(initialInfo?.reason || '');
  const [expirationDate, setExpirationDate] = useState(initialInfo?.expiration_date || '');
  const [certFile, setCertFile] = useState(initialInfo?.cert_file || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setTaxExempt(Boolean(initialExempt));
    setCertificateNumber(initialInfo?.certificate_number || '');
    setReason(initialInfo?.reason || '');
    setExpirationDate(initialInfo?.expiration_date || '');
    setCertFile(initialInfo?.cert_file || null);
    // Only reset when switching to a different entity, so parent re-renders
    // (new object identity) don't wipe the admin's in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  const fullUrl = (url) => (url?.startsWith('http') ? url : `${API}${url}`);

  const uploadCert = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axios.post(`${API}/api/tax-exempt/upload-cert`, form, {
        headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
      });
      setCertFile(res.data);
      toast({ title: 'Certificate uploaded', description: res.data.name });
    } catch (err) {
      toast({ title: 'Upload failed', description: err.response?.data?.detail || 'Could not upload certificate', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadCert(file);
  };

  const printCert = () => {
    if (!certFile?.url) return;
    const w = window.open(fullUrl(certFile.url), '_blank');
    if (w) w.addEventListener('load', () => { try { w.print(); } catch (e) {} });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        tax_exempt: taxExempt,
        certificate_number: certificateNumber,
        reason,
        expiration_date: expirationDate,
        cert_file: certFile,
      };
      const res = await axios.put(`${API}/api/tax-exempt/${entityType}/${entityId}`, payload, { headers: authHeaders() });
      toast({ title: 'Tax settings saved', description: taxExempt ? 'This account is now tax exempt.' : 'Tax exemption disabled.' });
      if (onSaved) onSaved(res.data[entityType] || res.data.customer || res.data.lead);
    } catch (err) {
      toast({ title: 'Save failed', description: err.response?.data?.detail || 'Could not save tax settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isImage = certFile?.content_type?.startsWith('image/');

  return (
    <Card className="border-emerald-200" data-testid="tax-exempt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-800">
          <ShieldCheck className="w-5 h-5" /> Tax Exemption
        </CardTitle>
        <CardDescription>
          When enabled, sales tax is set to $0 on this {entityType === 'lead' ? "lead's quotes" : "customer's quotes, invoices and store orders"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Info box */}
        <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-900" data-testid="tax-exempt-info-box">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="font-semibold">Keep exemption records for audits</p>
            <p className="text-blue-800/90 mt-1">Record the certificate number, reason and expiration, and upload a copy of the certificate. You can view, print or download it anytime should a tax auditor request proof.</p>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50">
          <div>
            <Label className="text-sm font-semibold text-gray-800">Tax Exempt</Label>
            <p className="text-xs text-gray-500 mt-0.5">Do not charge sales tax on this account</p>
          </div>
          <Switch checked={taxExempt} onCheckedChange={setTaxExempt} data-testid="tax-exempt-toggle" />
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700">Certificate Number</Label>
            <Input value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} placeholder="e.g. AL-EXMPT-00123" className="mt-2" data-testid="tax-exempt-cert-number-input" />
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700">Expiration Date</Label>
            <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-2" data-testid="tax-exempt-expiration-input" />
          </div>
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700">Reason / Notes</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder='e.g. "Reseller", "Non-profit 501(c)(3)", government entity' className="mt-2" rows={2} data-testid="tax-exempt-reason-input" />
        </div>

        {/* Certificate upload */}
        <div>
          <Label className="text-sm font-semibold text-gray-700">Exemption Certificate Copy</Label>
          {!certFile ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-2 flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}`}
              data-testid="tax-exempt-cert-dropzone"
            >
              {uploading ? (
                <><Loader2 className="w-6 h-6 text-emerald-600 animate-spin" /><span className="text-sm text-gray-500">Uploading…</span></>
              ) : (
                <><UploadCloud className="w-6 h-6 text-gray-400" /><span className="text-sm text-gray-600 font-medium">Drag & drop or click to upload</span><span className="text-xs text-gray-400">Image or PDF, up to 25MB</span></>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => uploadCert(e.target.files?.[0])} data-testid="tax-exempt-cert-file-input" />
            </div>
          ) : (
            <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden" data-testid="tax-exempt-cert-preview">
              {isImage && (
                <a href={fullUrl(certFile.url)} target="_blank" rel="noopener noreferrer">
                  <img src={fullUrl(certFile.url)} alt="Tax exemption certificate" className="w-full max-h-56 object-contain bg-gray-50" />
                </a>
              )}
              <div className="flex items-center justify-between gap-2 p-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate" data-testid="tax-exempt-cert-name">{certFile.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <a href={fullUrl(certFile.url)} target="_blank" rel="noopener noreferrer" data-testid="tax-exempt-cert-view">
                    <Button type="button" size="sm" variant="outline" className="h-8"><Eye className="w-3.5 h-3.5 mr-1" />View</Button>
                  </a>
                  <Button type="button" size="sm" variant="outline" className="h-8" onClick={printCert} data-testid="tax-exempt-cert-print"><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>
                  <a href={fullUrl(certFile.url)} download={certFile.name} data-testid="tax-exempt-cert-download">
                    <Button type="button" size="sm" variant="outline" className="h-8"><Download className="w-3.5 h-3.5 mr-1" />Download</Button>
                  </a>
                  <Button type="button" size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700" onClick={() => setCertFile(null)} data-testid="tax-exempt-cert-remove"><X className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="tax-exempt-save-button">
            {saving ? 'Saving…' : 'Save Tax Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxExemptCard;
