import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Factory, Plus, Edit2, Trash2, X, Save, Clock, Mail, Phone, Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ManufacturersPage = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    lead_time_days: 14,
    minimum_order_value: '',
    minimum_order_quantity: '',
    notes: '',
    is_active: true
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const response = await axios.get(`${API}/inventory/manufacturers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManufacturers(response.data.manufacturers || []);
    } catch (error) {
      console.error('Failed to fetch manufacturers:', error);
      toast({ title: 'Error', description: 'Failed to load manufacturers', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleOpenModal = (manufacturer = null) => {
    if (manufacturer) {
      setEditingId(manufacturer.id);
      setFormData({
        name: manufacturer.name || '',
        code: manufacturer.code || '',
        contact_name: manufacturer.contact_name || '',
        contact_email: manufacturer.contact_email || '',
        contact_phone: manufacturer.contact_phone || '',
        website: manufacturer.website || '',
        lead_time_days: manufacturer.lead_time_days || 14,
        minimum_order_value: manufacturer.minimum_order_value || '',
        minimum_order_quantity: manufacturer.minimum_order_quantity || '',
        notes: manufacturer.notes || '',
        is_active: manufacturer.is_active !== false
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        code: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        lead_time_days: 14,
        minimum_order_value: '',
        minimum_order_quantity: '',
        notes: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast({ title: 'Error', description: 'Name and Code are required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        ...formData,
        minimum_order_value: formData.minimum_order_value ? parseFloat(formData.minimum_order_value) : null,
        minimum_order_quantity: formData.minimum_order_quantity ? parseInt(formData.minimum_order_quantity) : null
      };

      if (editingId) {
        await axios.put(`${API}/inventory/manufacturers/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Manufacturer updated' });
      } else {
        await axios.post(`${API}/inventory/manufacturers`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Manufacturer created' });
      }
      setShowModal(false);
      fetchManufacturers();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to save manufacturer', 
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this manufacturer?')) return;

    try {
      await axios.delete(`${API}/inventory/manufacturers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Manufacturer deleted' });
      fetchManufacturers();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to delete manufacturer', 
        variant: 'destructive' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6" data-testid="manufacturers-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Factory className="w-8 h-8 text-purple-500" />
              Manufacturers
            </h1>
            <p className="text-gray-400 mt-1">Manage your suppliers and their lead times</p>
          </div>
          <Button onClick={() => handleOpenModal()} data-testid="add-manufacturer-btn">
            <Plus className="w-4 h-4 mr-2" />
            Add Manufacturer
          </Button>
        </div>

        {/* Manufacturers Grid */}
        {manufacturers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manufacturers.map((mfr) => (
              <Card key={mfr.id} className="bg-gray-800 border-gray-700" data-testid={`manufacturer-${mfr.code}`}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {mfr.name}
                      {!mfr.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </CardTitle>
                    <Badge variant="outline" className="mt-2">{mfr.code}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(mfr)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(mfr.id)} className="text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Lead Time: <strong className="text-white">{mfr.lead_time_days} days</strong></span>
                  </div>
                  
                  {mfr.contact_name && (
                    <p className="text-sm text-gray-400">Contact: {mfr.contact_name}</p>
                  )}
                  
                  {mfr.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${mfr.contact_email}`} className="hover:text-blue-400">{mfr.contact_email}</a>
                    </div>
                  )}
                  
                  {mfr.contact_phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{mfr.contact_phone}</span>
                    </div>
                  )}
                  
                  {mfr.website && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Globe className="w-4 h-4" />
                      <a href={mfr.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                        {mfr.website}
                      </a>
                    </div>
                  )}

                  {(mfr.minimum_order_value || mfr.minimum_order_quantity) && (
                    <div className="pt-3 border-t border-gray-700">
                      {mfr.minimum_order_value && (
                        <p className="text-xs text-gray-400">Min. Order Value: ${mfr.minimum_order_value.toLocaleString()}</p>
                      )}
                      {mfr.minimum_order_quantity && (
                        <p className="text-xs text-gray-400">Min. Order Qty: {mfr.minimum_order_quantity} units</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-12 text-center">
              <Factory className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No Manufacturers Yet</h3>
              <p className="text-gray-400 mb-6">Add your first manufacturer to start tracking inventory by supplier</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Manufacturer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Manufacturer' : 'Add Manufacturer'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="PUDU Robotics"
                    className="bg-gray-900 border-gray-600"
                  />
                </div>
                <div>
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PUDU"
                    className="bg-gray-900 border-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Short identifier (e.g., PUDU, AVID)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lead Time (Days) *</Label>
                  <Input
                    type="number"
                    value={formData.lead_time_days}
                    onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 0 })}
                    className="bg-gray-900 border-gray-600"
                  />
                  <p className="text-xs text-gray-400 mt-1">Average delivery time after ordering</p>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="bg-gray-900 border-gray-600"
                  />
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-2">
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="bg-gray-900 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="bg-gray-900 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="bg-gray-900 border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-2">
                <h4 className="font-medium mb-3">Order Requirements</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Order Value ($)</Label>
                    <Input
                      type="number"
                      value={formData.minimum_order_value}
                      onChange={(e) => setFormData({ ...formData, minimum_order_value: e.target.value })}
                      placeholder="Optional"
                      className="bg-gray-900 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label>Minimum Order Quantity</Label>
                    <Input
                      type="number"
                      value={formData.minimum_order_quantity}
                      onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                      placeholder="Optional"
                      className="bg-gray-900 border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Internal notes about this manufacturer..."
                  className="bg-gray-900 border-gray-600"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active (show in dropdowns)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManufacturersPage;
