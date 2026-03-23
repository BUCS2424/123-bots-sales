import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FileText, Search, Eye, CheckCircle, XCircle, Clock, User,
  Mail, Phone, MapPin, Briefcase, Calendar, Download, Loader2,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminJobApplications = () => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await axios.get(`${API}/hr/applications`, { params });
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async (applicationId, status) => {
    try {
      await axios.put(`${API}/hr/applications/${applicationId}/status`, null, {
        params: { status, reviewer_id: currentUser?.id, notes: reviewNotes }
      });
      toast({ title: 'Success', description: `Application ${status}` });
      setIsViewOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
      fetchApplications();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-800">New</Badge>;
      case 'reviewing': return <Badge className="bg-amber-100 text-amber-800">Reviewing</Badge>;
      case 'interviewed': return <Badge className="bg-purple-100 text-purple-800">Interviewed</Badge>;
      case 'hired': return <Badge className="bg-green-100 text-green-800">Hired</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDepartmentBadges = (app) => {
    const badges = [];
    if (app.applying_for_pawn) badges.push(<Badge key="pawn" className="bg-amber-100 text-amber-800 mr-1">Products</Badge>);
    if (app.applying_for_storage) badges.push(<Badge key="storage" className="bg-red-100 text-red-800 mr-1">Storage</Badge>);
    if (app.applying_for_rv) badges.push(<Badge key="rv" className="bg-blue-100 text-blue-800 mr-1">RV</Badge>);
    return badges;
  };

  const filteredApplications = applications.filter(app =>
    `${app.first_name} ${app.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-applications-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-600" />
            Job Applications
          </h1>
          <p className="text-gray-500">Review and manage employment applications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['new', 'reviewing', 'interviewed', 'hired', 'rejected'].map(status => (
          <Card key={status} className="cursor-pointer hover:border-purple-300" onClick={() => setStatusFilter(status)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 capitalize">{status}</span>
                <span className="text-2xl font-bold">
                  {applications.filter(a => a.status === status).length}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>Click on an application to view details</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewing">Reviewing</option>
                <option value="interviewed">Interviewed</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedApplication(app); setIsViewOpen(true); }}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{app.first_name} {app.last_name}</p>
                      <p className="text-sm text-gray-500">{app.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentBadges(app)}</TableCell>
                  <TableCell>{app.desired_position || '-'}</TableCell>
                  <TableCell>{new Date(app.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredApplications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No applications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedApplication && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Application: {selectedApplication.first_name} {selectedApplication.last_name}</span>
                  {getStatusBadge(selectedApplication.status)}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedApplication.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedApplication.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedApplication.address}, {selectedApplication.city}, {selectedApplication.state} {selectedApplication.zip_code}</span>
                  </div>
                </div>

                {/* Departments Applied For */}
                <div>
                  <h4 className="font-semibold mb-2">Applying For:</h4>
                  <div className="flex gap-2">{getDepartmentBadges(selectedApplication)}</div>
                  {selectedApplication.desired_position && (
                    <p className="text-sm text-gray-600 mt-2">Desired Position: {selectedApplication.desired_position}</p>
                  )}
                  {selectedApplication.desired_pay && (
                    <p className="text-sm text-gray-600">Desired Pay: {selectedApplication.desired_pay}</p>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <h4 className="font-semibold mb-2">Availability:</h4>
                  <div className="flex gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <Badge key={day} className={selectedApplication[`available_${day}`] ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'}>
                        {day.slice(0, 3).toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Employment History */}
                {selectedApplication.employment_history?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Employment History:</h4>
                    <div className="space-y-2">
                      {selectedApplication.employment_history.filter(j => j.company).map((job, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-medium">{job.position} at {job.company}</p>
                          <p className="text-gray-500">{job.start_date} - {job.end_date || 'Present'}</p>
                          {job.reason_left && <p className="text-gray-500">Reason for leaving: {job.reason_left}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {selectedApplication.highest_education && (
                  <div>
                    <h4 className="font-semibold mb-2">Education:</h4>
                    <p className="text-sm">{selectedApplication.highest_education?.replace('_', ' ')} - {selectedApplication.school_name} ({selectedApplication.graduation_year})</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Authorized to work: </span>
                    <span className={selectedApplication.authorized_to_work ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.authorized_to_work ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Can lift 50 lbs: </span>
                    <span className={selectedApplication.can_lift_50_lbs ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.can_lift_50_lbs ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Driver's License: </span>
                    <span className={selectedApplication.valid_drivers_license ? 'text-green-600' : 'text-red-600'}>
                      {selectedApplication.valid_drivers_license ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Felony Conviction: </span>
                    <span className={selectedApplication.felony_conviction ? 'text-red-600' : 'text-green-600'}>
                      {selectedApplication.felony_conviction ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {selectedApplication.felony_conviction && selectedApplication.felony_explanation && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Felony Explanation:</p>
                    <p className="text-sm text-red-700">{selectedApplication.felony_explanation}</p>
                  </div>
                )}

                {/* References */}
                {selectedApplication.references?.some(r => r.name) && (
                  <div>
                    <h4 className="font-semibold mb-2">References:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {selectedApplication.references.filter(r => r.name).map((ref, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                          <p className="font-medium">{ref.name}</p>
                          <p className="text-gray-500">{ref.relationship}</p>
                          <p className="text-gray-500">{ref.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature */}
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500">
                    Signed: <span className="italic font-medium">{selectedApplication.signature}</span> on {new Date(selectedApplication.signature_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Review Section */}
                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Review Notes</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about this applicant..."
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                {selectedApplication.status !== 'rejected' && (
                  <Button variant="destructive" onClick={() => handleUpdateStatus(selectedApplication.id, 'rejected')}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                )}
                {selectedApplication.status === 'new' && (
                  <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => handleUpdateStatus(selectedApplication.id, 'reviewing')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Mark Reviewing
                  </Button>
                )}
                {selectedApplication.status === 'reviewing' && (
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handleUpdateStatus(selectedApplication.id, 'interviewed')}>
                    <User className="w-4 h-4 mr-2" />
                    Mark Interviewed
                  </Button>
                )}
                {(selectedApplication.status === 'reviewing' || selectedApplication.status === 'interviewed') && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus(selectedApplication.id, 'hired')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Hire
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobApplications;
