import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera, ScanLine, Clock, LogIn, LogOut, PackageCheck, PackageX,
  Repeat, Loader2, AlertCircle, CheckCircle2, X, Wrench,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/service-repair`;
const WORKFLOW_API = `${BACKEND_URL}/api/workflows`;
const STORAGE_API = `${BACKEND_URL}/api/storage`;

// Only these two scan actions currently support a guided workflow -
// keep in sync with KNOWN_TRIGGER_EVENTS in backend/workflows.py.
const TRIGGER_FOR_ACTION = {
  'unit-received': 'service_repair.unit_received',
  'unit-returned': 'service_repair.unit_returned',
};

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

const ACTIVITY_LABELS = {
  clock_in: 'Clocked in',
  clock_out: 'Clocked out',
  unit_received: 'Unit received at shop',
  unit_returned: 'Unit returned to customer',
  loaner_out: 'Loaner checked out',
  loaner_in: 'Loaner checked in',
};

const AdminServiceScan = () => {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const [manualSerial, setManualSerial] = useState('');
  const [looking, setLooking] = useState(false);
  const [result, setResult] = useState(null); // lookup response
  const [acting, setActing] = useState(false);

  const [loanerPickerOpen, setLoanerPickerOpen] = useState(false);
  const [availableLoaners, setAvailableLoaners] = useState([]);
  const [loadingLoaners, setLoadingLoaners] = useState(false);

  // { workflow, path, body, successMessage, answers, index } while a guided step wizard is open
  const [wizard, setWizard] = useState(null);
  const [wizardUploading, setWizardUploading] = useState(false);

  const tokenHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const stopScan = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const doLookup = useCallback(async (serial) => {
    const value = (serial || '').trim();
    if (!value) return;
    setLooking(true);
    setResult(null);
    try {
      const res = await axios.get(`${API}/lookup/${encodeURIComponent(value)}`, { headers: tokenHeaders });
      setResult(res.data);
    } catch (error) {
      toast({
        title: 'Not Found',
        description: error.response?.data?.detail || 'No matching unit or service request for that serial.',
        variant: 'destructive',
      });
    } finally {
      setLooking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!scanning) return;
    let cancelled = false;
    const start = async () => {
      try {
        const html5 = new Html5Qrcode('service-scan-reader', { formatsToSupport: ALL_BARCODE_FORMATS, verbose: false });
        scannerRef.current = html5;
        await html5.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          async (decodedText) => {
            await stopScan();
            setManualSerial(decodedText);
            doLookup(decodedText);
          },
          () => {},
        );
        if (cancelled) await stopScan();
      } catch (e) {
        toast({ title: 'Camera error', description: 'Could not start camera. Use manual entry instead.', variant: 'destructive' });
        setScanning(false);
      }
    };
    start();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning, stopScan]);

  useEffect(() => () => { stopScan(); }, [stopScan]);

  const runAction = async (path, body, successMessage) => {
    setActing(true);
    try {
      await axios.post(`${API}/${path}`, body, { headers: tokenHeaders });
      toast({ title: 'Done', description: successMessage });
      const serial = result?.service_request?.serial_number || result?.loaner?.serial_number || manualSerial;
      await doLookup(serial);
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Action failed', variant: 'destructive' });
    } finally {
      setActing(false);
    }
  };

  // Mirrors _condition_met() in backend/workflows.py so the wizard can
  // decide which step to show next without a round-trip per step.
  const conditionMet = (condition, answers) => {
    if (!condition) return true;
    const actual = answers[condition.step_id];
    if (actual === undefined || actual === null) return false;
    const actualStr = String(actual).trim().toLowerCase();
    const expectedStr = String(condition.value).trim().toLowerCase();
    if (condition.operator === 'equals') return actualStr === expectedStr;
    if (condition.operator === 'not_equals') return actualStr !== expectedStr;
    if (condition.operator === 'contains') return actualStr.includes(expectedStr);
    return false;
  };

  const visibleWizardSteps = (workflow, answers) =>
    [...(workflow.steps || [])].sort((a, b) => a.order - b.order).filter((s) => conditionMet(s.condition, answers));

  const startAction = async (path, body, successMessage) => {
    const trigger = TRIGGER_FOR_ACTION[path];
    if (!trigger) {
      await runAction(path, body, successMessage);
      return;
    }
    try {
      const res = await axios.get(`${WORKFLOW_API}/for-trigger/${trigger}`, { headers: tokenHeaders });
      const workflow = res.data;
      if (!workflow || (workflow.steps || []).length === 0) {
        await runAction(path, body, successMessage);
        return;
      }
      setWizard({ workflow, path, body, successMessage, answers: {}, index: 0 });
    } catch {
      await runAction(path, body, successMessage);
    }
  };

  const setWizardAnswer = (stepId, value) => {
    setWizard((w) => (w ? { ...w, answers: { ...w.answers, [stepId]: value } } : w));
  };

  const handleWizardPhoto = async (stepId, file) => {
    if (!file) return;
    setWizardUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'service-repair-workflows');
      const res = await axios.post(`${STORAGE_API}/upload`, formData, { headers: tokenHeaders });
      setWizardAnswer(stepId, res.data.url);
    } catch {
      toast({ title: 'Upload failed', description: 'Could not upload photo', variant: 'destructive' });
    } finally {
      setWizardUploading(false);
    }
  };

  const finishWizard = async () => {
    const { path, body, successMessage, workflow, answers } = wizard;
    setWizard(null);
    await runAction(path, { ...body, workflow_id: workflow.id, workflow_answers: answers }, successMessage);
  };

  const openLoanerPicker = async (serviceRequestId) => {
    setLoanerPickerOpen(serviceRequestId);
    setLoadingLoaners(true);
    try {
      const res = await axios.get(`${API}/loaners`, { params: { status: 'available' }, headers: tokenHeaders });
      setAvailableLoaners(res.data || []);
    } catch {
      setAvailableLoaners([]);
    } finally {
      setLoadingLoaners(false);
    }
  };

  const assignLoaner = async (loanerUnitId) => {
    const serviceRequestId = loanerPickerOpen;
    setLoanerPickerOpen(false);
    await runAction('loaner-out', { service_request_id: serviceRequestId, loaner_unit_id: loanerUnitId }, 'Loaner unit checked out to customer');
  };

  const renderActivity = (log) => {
    if (!log || log.length === 0) {
      return <p className="text-sm text-gray-400">No activity logged yet</p>;
    }
    return (
      <div className="space-y-2">
        {[...log].reverse().map((item) => (
          <div key={item.id} className="flex items-start justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
            <div>
              <p className="font-medium text-gray-800">{ACTIVITY_LABELS[item.type] || item.type}</p>
              <p className="text-xs text-gray-500">
                {item.actor_name}
                {item.duration_minutes != null && ` • ${item.duration_minutes} min`}
                {item.loaner_serial && ` • ${item.loaner_model || ''} (${item.loaner_serial})`}
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
              {new Date(item.timestamp).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderCustomerUnit = () => {
    const req = result.service_request;
    const activeLoaner = result.active_loaner;
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{req.name}</h2>
            <p className="text-sm text-gray-500">{req.make} {req.model} &middot; SN: {req.serial_number}</p>
          </div>
          <Badge variant="outline">{req.status}</Badge>
        </div>
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{req.issue_description}</p>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" disabled={acting} onClick={() => runAction('clock-in', { service_request_id: req.id }, 'Clocked in')} data-testid="scan-clock-in">
            <LogIn className="w-4 h-4 mr-2" /> Clock In
          </Button>
          <Button variant="outline" disabled={acting} onClick={() => runAction('clock-out', { service_request_id: req.id }, 'Clocked out')} data-testid="scan-clock-out">
            <LogOut className="w-4 h-4 mr-2" /> Clock Out
          </Button>
          <Button variant="outline" disabled={acting} onClick={() => startAction('unit-received', { service_request_id: req.id }, 'Unit marked received')} data-testid="scan-unit-received">
            <PackageCheck className="w-4 h-4 mr-2" /> Unit Received
          </Button>
          <Button variant="outline" disabled={acting} onClick={() => startAction('unit-returned', { service_request_id: req.id }, 'Unit marked returned')} data-testid="scan-unit-returned">
            <PackageX className="w-4 h-4 mr-2" /> Unit Returned
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Loaner Unit</p>
          {activeLoaner ? (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{activeLoaner.model}</p>
                <p className="text-xs text-gray-500">SN: {activeLoaner.serial_number}</p>
              </div>
              <Button size="sm" disabled={acting} onClick={() => runAction('loaner-in', { service_request_id: req.id }, 'Loaner checked back in')} data-testid="scan-loaner-in">
                <Repeat className="w-4 h-4 mr-1.5" /> Check In Loaner
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full" disabled={acting} onClick={() => openLoanerPicker(req.id)} data-testid="scan-assign-loaner">
              <Repeat className="w-4 h-4 mr-2" /> Assign a Loaner
            </Button>
          )}
        </div>

        {loanerPickerOpen === req.id && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Available Loaners</p>
            {loadingLoaners ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            ) : availableLoaners.length === 0 ? (
              <p className="text-sm text-gray-400">No loaners available right now</p>
            ) : (
              <div className="space-y-2">
                {availableLoaners.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => assignLoaner(l.id)}
                    className="w-full flex items-center justify-between text-left bg-white border rounded-lg p-2.5 hover:border-blue-400"
                    data-testid={`loaner-option-${l.id}`}
                  >
                    <span className="text-sm">{l.model} &middot; SN: {l.serial_number}</span>
                    <CheckCircle2 className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setLoanerPickerOpen(false)}>Cancel</Button>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Activity Log</p>
          {renderActivity(req.activity_log)}
        </div>
      </div>
    );
  };

  const renderLoanerUnit = () => {
    const loaner = result.loaner;
    const linked = result.linked_service_request;
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{loaner.model}</h2>
            <p className="text-sm text-gray-500">SN: {loaner.serial_number} &middot; Loaner Unit</p>
          </div>
          <Badge variant="outline">{loaner.status}</Badge>
        </div>

        {linked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-gray-700">Currently out with <span className="font-semibold">{linked.name}</span> for {linked.make} {linked.model} (SN: {linked.serial_number})</p>
            <Button disabled={acting} onClick={() => runAction('loaner-in', { service_request_id: linked.id }, 'Loaner checked back in')} data-testid="scan-loaner-in-direct">
              <Repeat className="w-4 h-4 mr-2" /> Check In This Loaner
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> This loaner is available and not currently assigned. To check it out, scan the customer's unit first, then "Assign a Loaner."
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6" data-testid="service-scan-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-[#6e2ea8]" />
            Service Scan
          </h1>
          <p className="text-gray-500 text-sm mt-1">Scan a unit's manufacturer serial to clock in/out, log check-in, or swap a loaner</p>
        </div>
        <Link to="/admin/service-repair/loaners">
          <Button variant="outline" size="sm"><Wrench className="w-4 h-4 mr-2" />Manage Loaners</Button>
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Scan or type manufacturer serial number..."
            value={manualSerial}
            onChange={(e) => setManualSerial(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doLookup(manualSerial)}
            data-testid="scan-manual-input"
          />
          <Button onClick={() => doLookup(manualSerial)} disabled={looking}>
            {looking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look Up'}
          </Button>
          <Button variant="outline" onClick={() => (scanning ? stopScan() : setScanning(true))} data-testid="scan-camera-toggle">
            <Camera className="w-4 h-4 mr-2" /> {scanning ? 'Stop' : 'Scan'}
          </Button>
        </div>
        {scanning && (
          <div className="overflow-hidden rounded-lg border bg-black">
            <div id="service-scan-reader" className="mx-auto w-full max-w-sm" />
          </div>
        )}
      </div>

      {looking && (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      )}

      {result && (
        <div className="bg-white border rounded-xl p-5">
          {result.match_type === 'customer_unit' ? renderCustomerUnit() : renderLoanerUnit()}
        </div>
      )}

      {wizard && (() => {
        const steps = visibleWizardSteps(wizard.workflow, wizard.answers);
        const step = steps[wizard.index];
        if (!step) return null;
        const value = wizard.answers[step.id] ?? '';
        const isLast = wizard.index + 1 >= steps.length;
        const goNext = () => {
          if (step.required) {
            const blank = value === undefined || value === null || (typeof value === 'string' && !value.trim());
            if (blank) {
              toast({ title: 'Required', description: 'Please answer this step before continuing', variant: 'destructive' });
              return;
            }
          }
          if (isLast) {
            finishWizard();
          } else {
            setWizard((w) => ({ ...w, index: w.index + 1 }));
          }
        };
        return (
          <Dialog open onOpenChange={(open) => { if (!open) setWizard(null); }}>
            <DialogContent className="max-w-md" data-testid="workflow-wizard-modal">
              <DialogTitle>{wizard.workflow.name}</DialogTitle>
              <p className="text-xs text-gray-400 -mt-2">Step {wizard.index + 1} of {steps.length}</p>

              <div className="space-y-2 mt-2">
                <Label>{step.label}{step.required && <span className="text-red-500"> *</span>}</Label>
                {step.field_type === 'textarea' && (
                  <Textarea rows={4} value={value} onChange={(e) => setWizardAnswer(step.id, e.target.value)} data-testid="wizard-input" />
                )}
                {step.field_type === 'text' && (
                  <Input value={value} onChange={(e) => setWizardAnswer(step.id, e.target.value)} data-testid="wizard-input" />
                )}
                {step.field_type === 'number' && (
                  <Input type="number" value={value} onChange={(e) => setWizardAnswer(step.id, e.target.value)} data-testid="wizard-input" />
                )}
                {step.field_type === 'date' && (
                  <Input type="date" value={value} onChange={(e) => setWizardAnswer(step.id, e.target.value)} data-testid="wizard-input" />
                )}
                {step.field_type === 'select' && (
                  <Select value={value} onValueChange={(v) => setWizardAnswer(step.id, v)}>
                    <SelectTrigger data-testid="wizard-input"><SelectValue placeholder="Choose..." /></SelectTrigger>
                    <SelectContent>
                      {(step.options || []).filter(Boolean).map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {step.field_type === 'checkbox' && (
                  <div className="flex gap-2">
                    <Button type="button" variant={value === 'yes' ? 'default' : 'outline'} className="flex-1" onClick={() => setWizardAnswer(step.id, 'yes')}>Yes</Button>
                    <Button type="button" variant={value === 'no' ? 'default' : 'outline'} className="flex-1" onClick={() => setWizardAnswer(step.id, 'no')}>No</Button>
                  </div>
                )}
                {step.field_type === 'photo' && (
                  <div className="space-y-2">
                    {value && <img src={value} alt="Uploaded" className="w-full max-h-40 object-contain rounded-lg border" />}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={wizardUploading}
                      onChange={(e) => handleWizardPhoto(step.id, e.target.files?.[0])}
                      data-testid="wizard-input"
                    />
                    {wizardUploading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t mt-4">
                <Button variant="ghost" onClick={() => setWizard(null)}>Cancel</Button>
                <div className="flex gap-2">
                  {wizard.index > 0 && (
                    <Button variant="outline" onClick={() => setWizard((w) => ({ ...w, index: w.index - 1 }))}>Back</Button>
                  )}
                  <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]" onClick={goNext} disabled={wizardUploading} data-testid="wizard-next-btn">
                    {isLast ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
};

export default AdminServiceScan;
