import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Warehouse, Plus, Edit, Trash2, Users, DollarSign, Package, BarChart3,
  Thermometer, Car, Building, Search, Filter, Eye, X, Loader2, CheckCircle,
  XCircle, Clock, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Storage Size Modal
const StorageSizeModal = ({ isOpen, onClose, size, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    width: 10,
    length: 10,
    monthly_price: 99.00,
    yearly_price: 999.00,
    description: '',
    climate_controlled: false,
    drive_up_access: true,
    floor_level: 'ground',
    total_units: 20,
    features: []
  });
  const [saving, setSaving] = useState(false);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (size) {
      setFormData({
        name: size.name || '',
        width: size.width || 10,
        length: size.length || 10,
        monthly_price: size.monthly_price || 99.00,
        yearly_price: size.yearly_price || 999.00,
        description: size.description || '',
        climate_controlled: size.climate_controlled || false,
        drive_up_access: size.drive_up_access || true,
        floor_level: size.floor_level || 'ground',
        total_units: size.total_units || 20,
        features: size.features || []
      });
    } else {
      setFormData({
        name: '',
        width: 10,
        length: 10,
        monthly_price: 99.00,
        yearly_price: 999.00,
        description: '',
        climate_controlled: false,
        drive_up_access: true,
        floor_level: 'ground',
        total_units: 20,
        features: []
      });
    }
  }, [size, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Size name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await onSave(formData, size?.id);
      onClose();
    } catch (error) {
      // Error handled in parent
    }
    setSaving(false);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {size ? 'Edit Storage Size' : 'Add New Storage Size'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Size Name & Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Size Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="10x10"
              />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Length (ft)</Label>
              <Input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData(prev => ({ ...prev, length: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Yearly Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.yearly_price}
                onChange={(e) => setFormData(prev => ({ ...prev, yearly_price: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Save ${((formData.monthly_price * 12) - formData.yearly_price).toFixed(2)}/year
              </p>
            </div>
          </div>

          {/* Total Units */}
          <div>
            <Label>Total Units Available</Label>
            <Input
              type="number"
              value={formData.total_units}
              onChange={(e) => setFormData(prev => ({ ...prev, total_units: parseInt(e.target.value) || 0 }))}
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Perfect for storing furniture, appliances, and boxes..."
              rows={3}
            />
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[#6e2ea8]" />
                <span className="text-sm">Climate Controlled</span>
              </div>
              <Switch
                checked={formData.climate_controlled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, climate_controlled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-green-500" />
                <span className="text-sm">Drive-Up Access</span>
              </div>
              <Switch
                checked={formData.drive_up_access}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, drive_up_access: checked }))}
              />
            </div>
            <div>
              <Label className="text-sm">Floor Level</Label>
              <Select
                value={formData.floor_level}
                onValueChange={(value) => setFormData(prev => ({ ...prev, floor_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ground">Ground Floor</SelectItem>
                  <SelectItem value="upper">Upper Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Features */}
          <div>
            <Label>Additional Features</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" variant="outline" onClick={addFeature}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {feature}
                  <button type="button" onClick={() => removeFeature(index)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#6e2ea8]" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {size ? 'Update Size' : 'Create Size'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Rental Details Modal
const RentalDetailsModal = ({ isOpen, onClose, rental, sizes }) => {
  if (!isOpen || !rental) return null;

  const size = sizes.find(s => s.id === rental.unit_size_id);
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Rental Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Unit Number</p>
              <p className="text-2xl font-bold">{rental.unit_number}</p>
            </div>
            <Badge className={statusColors[rental.status]}>{rental.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p className="font-medium">{size?.name} ({size?.square_feet} sq ft)</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Access Code</p>
              <p className="font-mono text-lg font-bold text-[#6e2ea8]">{rental.access_code}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Billing</p>
              <p className="font-medium capitalize">{rental.billing_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="font-bold text-lg">${rental.price.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Customer Information</p>
            <div className="space-y-1">
              <p className="font-medium">{rental.customer.first_name} {rental.customer.last_name}</p>
              <p className="text-sm text-gray-600">{rental.customer.email}</p>
              <p className="text-sm text-gray-600">{rental.customer.phone}</p>
              <p className="text-sm text-gray-600">
                {rental.customer.address}, {rental.customer.city}, {rental.customer.state} {rental.customer.zip_code}
              </p>
            </div>
          </div>

          {rental.customer.emergency_contact_name && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">Emergency Contact</p>
              <p className="font-medium">{rental.customer.emergency_contact_name}</p>
              <p className="text-sm text-gray-600">{rental.customer.emergency_contact_phone}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">{new Date(rental.start_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    </div>
  );
};

const AdminStorage = () => {
  const [stats, setStats] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, sizesRes, rentalsRes] = await Promise.all([
        axios.get(`${API}/storage-rentals/stats`, { headers }),
        axios.get(`${API}/storage-rentals/sizes`),
        axios.get(`${API}/storage-rentals/rentals`, { headers })
      ]);

      setStats(statsRes.data);
      setSizes(sizesRes.data);
      setRentals(rentalsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load storage data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSize = async (formData, sizeId) => {
    const token = localStorage.getItem('token');
    try {
      if (sizeId) {
        await axios.put(`${API}/storage-rentals/sizes/${sizeId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Storage size updated' });
      } else {
        await axios.post(`${API}/storage-rentals/sizes`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Storage size created' });
      }
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to save', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeleteSize = async (sizeId) => {
    if (!confirm('Are you sure you want to delete this storage size?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/storage-rentals/sizes/${sizeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Storage size deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleCancelRental = async (rentalId) => {
    if (!confirm('Are you sure you want to cancel this rental?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/storage-rentals/rentals/${rentalId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Rental cancelled' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to cancel rental', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Warehouse className="w-8 h-8 text-[#6e2ea8]" />
            Storage Management
          </h1>
          <p className="text-gray-500">Manage storage units, sizes, and rentals</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/storage/pos">
            <Button className="bg-[#6e2ea8]">
              <CreditCard className="w-4 h-4 mr-2" />
              Open POS
            </Button>
          </Link>
          <Button className="bg-[#6e2ea8]" onClick={() => { setSelectedSize(null); setShowSizeModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Size
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-[#6e2ea8]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Units</p>
                <p className="text-2xl font-bold">{stats?.total_units || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold">{stats?.available_units || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Rentals</p>
                <p className="text-2xl font-bold">{stats?.active_rentals || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">${(stats?.total_revenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Occupancy Rate</span>
            <span className="text-sm font-bold">{(stats?.occupancy_rate || 0).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-[#6e2ea8] to-[#e63950] h-3 rounded-full transition-all"
              style={{ width: `${stats?.occupancy_rate || 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview' ? 'border-b-2 border-[#6e2ea8] text-[#6e2ea8]' : 'text-gray-500'
          }`}
        >
          Unit Sizes
        </button>
        <button
          onClick={() => setActiveTab('rentals')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rentals' ? 'border-b-2 border-[#6e2ea8] text-[#6e2ea8]' : 'text-gray-500'
          }`}
        >
          Rentals ({rentals.length})
        </button>
      </div>

      {/* Unit Sizes Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sizes.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No storage sizes yet</h3>
                <p className="text-gray-500 mb-4">Create your first storage unit size to get started</p>
                <Button onClick={() => { setSelectedSize(null); setShowSizeModal(true); }} className="bg-[#6e2ea8]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Storage Size
                </Button>
              </CardContent>
            </Card>
          ) : (
            sizes.map((size) => (
              <Card key={size.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-[#6e2ea8] to-[#2d5a8f] text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{size.name}</CardTitle>
                      <CardDescription className="text-white/80">{size.square_feet} sq ft</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => { setSelectedSize(size); setShowSizeModal(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-red-500/50" onClick={() => handleDeleteSize(size.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Monthly</span>
                      <span className="font-bold text-lg">${size.monthly_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Yearly</span>
                      <span className="font-bold text-lg text-green-600">${size.yearly_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-500">Available</span>
                      <Badge variant={size.available_units > 0 ? 'default' : 'destructive'}>
                        {size.available_units} / {size.total_units}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-2">
                      {size.climate_controlled && (
                        <Badge variant="outline" className="text-xs">
                          <Thermometer className="w-3 h-3 mr-1" />Climate
                        </Badge>
                      )}
                      {size.drive_up_access && (
                        <Badge variant="outline" className="text-xs">
                          <Car className="w-3 h-3 mr-1" />Drive-Up
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        <Building className="w-3 h-3 mr-1" />{size.floor_level}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Rentals Tab */}
      {activeTab === 'rentals' && (
        <Card>
          <CardContent className="p-0">
            {rentals.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rentals yet</h3>
                <p className="text-gray-500">Rentals will appear here when customers reserve units</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rentals.map((rental) => {
                    const size = sizes.find(s => s.id === rental.unit_size_id);
                    return (
                      <tr key={rental.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{rental.unit_number}</p>
                            <p className="text-sm text-gray-500">{size?.name}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{rental.customer.first_name} {rental.customer.last_name}</p>
                          <p className="text-sm text-gray-500">{rental.customer.email}</p>
                        </td>
                        <td className="px-4 py-3 capitalize">{rental.billing_type}</td>
                        <td className="px-4 py-3 font-medium">${rental.price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <Badge className={
                            rental.status === 'active' ? 'bg-green-100 text-green-800' :
                            rental.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            rental.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {rental.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedRental(rental); setShowRentalModal(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {rental.status === 'active' && (
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleCancelRental(rental.id)}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <StorageSizeModal
        isOpen={showSizeModal}
        onClose={() => { setShowSizeModal(false); setSelectedSize(null); }}
        size={selectedSize}
        onSave={handleSaveSize}
      />

      <RentalDetailsModal
        isOpen={showRentalModal}
        onClose={() => { setShowRentalModal(false); setSelectedRental(null); }}
        rental={selectedRental}
        sizes={sizes}
      />
    </div>
  );
};

export default AdminStorage;
