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
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/service-repair`;

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
          <Button variant="outline" disabled={acting} onClick={() => runAction('unit-received', { service_request_id: req.id }, 'Unit marked received')} data-testid="scan-unit-received">
            <PackageCheck className="w-4 h-4 mr-2" /> Unit Received
          </Button>
          <Button variant="outline" disabled={acting} onClick={() => runAction('unit-returned', { service_request_id: req.id }, 'Unit marked returned')} data-testid="scan-unit-returned">
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
    </div>
  );
};

export default AdminServiceScan;
