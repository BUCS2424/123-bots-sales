import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bot,
  Loader2,
  MapPin,
  Wifi,
  WifiOff,
  ShieldCheck,
  Clock,
  Cpu,
  Hash,
  Router,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DESTINATION_LABEL = {
  new: 'New',
  service: 'In Service',
  sold: 'Owned',
};

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0 border-slate-100">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || '—'}</span>
    </div>
  );
}

export default function RobotDashboardPage() {
  const { unitId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [robot, setRobot] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [robotRes, locationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/portal/my-robots/${unitId}`, { headers }),
        axios.get(`${API_URL}/api/portal/locations`, { headers }).catch(() => ({ data: [] })),
      ]);
      setRobot(robotRes.data);
      setLocations(locationsRes.data || []);
    } catch (error) {
      toast.error('Robot not found on your account');
      navigate('/account?tab=robots');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token, fetchData, navigate]);

  const handleAssignLocation = async (locationId) => {
    setAssigning(true);
    try {
      await axios.put(`${API_URL}/api/portal/my-robots/${unitId}/location`, { location_id: locationId || null }, { headers });
      toast.success('Location updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update location');
    } finally {
      setAssigning(false);
    }
  };

  if (loading || !robot) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-[105px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  const connectivity = robot.connectivity || {};
  const isOnline = connectivity.connection_status === 'online';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-[105px]" data-testid="robot-dashboard-page">
      <div className="bg-gradient-to-r from-[#1a1625] to-[#2d2438] text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link to="/account?tab=robots" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to My Robots
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-7 h-7 text-[#b9893d]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{robot.model}</h1>
              <p className="text-slate-300 mt-1 font-mono text-sm">SN: {robot.serial_number}</p>
            </div>
            <Badge className="ml-auto bg-[#6e2ea8]">{DESTINATION_LABEL[robot.destination] || robot.destination}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-6">
        {/* Overview */}
        <Card data-testid="robot-overview-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Hash className="w-4 h-4 text-[#6e2ea8]" /> Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Manufacturer" value={robot.manufacturer_name} />
            <InfoRow label="Model" value={robot.model} />
            <InfoRow label="Serial Number" value={robot.serial_number} />
            <InfoRow label="MAC Address" value={robot.mac_address} />
            <InfoRow label="Owner on File" value={robot.sold_owner_name} />
            <InfoRow label="Owned Since" value={robot.sold_at ? new Date(robot.sold_at).toLocaleDateString() : null} />
          </CardContent>
        </Card>

        {/* Warranty & Usage */}
        <Card data-testid="robot-warranty-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#6e2ea8]" /> Warranty & Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Warranty Remaining" value={robot.warranty_remaining_days} />
            <InfoRow label="Usage Remaining" value={robot.usage_remaining_days} />
            <InfoRow label="Software Version" value={robot.software_version} />
            <InfoRow label="Firmware Version" value={robot.firmware_version} />
          </CardContent>
        </Card>

        {/* Connectivity */}
        <Card data-testid="robot-connectivity-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#6e2ea8]" /> Connectivity
            </CardTitle>
            <CardDescription>Device network status - will update live once direct bot connectivity is built.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              {isOnline ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-slate-400" />}
              <span className={`text-sm font-medium capitalize ${isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                {connectivity.connection_status || 'Unknown'}
              </span>
            </div>
            <InfoRow label="IP Address" value={connectivity.ip_address} />
            <InfoRow label="Network" value={connectivity.local_network_ssid} />
            <InfoRow label="Last Seen" value={connectivity.last_seen_at ? new Date(connectivity.last_seen_at).toLocaleString() : null} />
          </CardContent>
        </Card>

        {/* Location */}
        <Card data-testid="robot-location-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#6e2ea8]" /> Location</CardTitle>
            <CardDescription>Which of your saved sites this robot is deployed at.</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              value={robot.location_id || ''}
              onChange={(e) => handleAssignLocation(e.target.value)}
              disabled={assigning}
              className="w-full border rounded-md px-3 py-2 text-sm mb-4"
              data-testid="robot-location-select"
            >
              <option value="">No location assigned</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.location_name}</option>
              ))}
            </select>

            {robot.location_detail ? (
              <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                <p className="font-semibold text-slate-900">{robot.location_detail.location_name}</p>
                {robot.location_detail.address_line1 && <p className="text-sm text-slate-600">{robot.location_detail.address_line1}</p>}
                {(robot.location_detail.city || robot.location_detail.state) && (
                  <p className="text-sm text-slate-600">
                    {[robot.location_detail.city, robot.location_detail.state, robot.location_detail.zip_code].filter(Boolean).join(', ')}
                  </p>
                )}
                {robot.location_detail.floor_or_area && (
                  <p className="text-sm text-slate-600">{robot.location_detail.floor_or_area}</p>
                )}
                {robot.location_detail.site_contact_name && (
                  <p className="text-sm text-slate-500 pt-1">
                    Contact: {robot.location_detail.site_contact_name}
                    {robot.location_detail.site_contact_phone ? ` · ${robot.location_detail.site_contact_phone}` : ''}
                  </p>
                )}
                {robot.location_detail.wifi_network_name && (
                  <p className="text-sm text-slate-500 flex items-center gap-1.5"><Router className="w-3.5 h-3.5" /> {robot.location_detail.wifi_network_name}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No location assigned yet. Add one from the{' '}
                <Link to="/account?tab=robots" className="text-[#6e2ea8] underline">My Robots</Link> tab.
              </p>
            )}
          </CardContent>
        </Card>

        {robot.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#6e2ea8]" /> Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{robot.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
