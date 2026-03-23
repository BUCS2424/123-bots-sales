import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Plus, Trash2, Loader2, Warehouse } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPeptidesSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouseSettings, setWarehouseSettings] = useState({
    aisles: ['A', 'B', 'C', 'D'],
    shelves_per_aisle: 5,
    bins_per_shelf: 4,
  });
  const [warehouseLocations, setWarehouseLocations] = useState([]);
  const [newAisle, setNewAisle] = useState('');

  const fetchWarehouseSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/pawn-settings/warehouse`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWarehouseSettings({
        aisles: response.data.aisles || ['A', 'B', 'C', 'D'],
        shelves_per_aisle: response.data.shelves_per_aisle || 5,
        bins_per_shelf: response.data.bins_per_shelf || 4,
      });

      const locResponse = await axios.get(`${API}/pawn-settings/warehouse/locations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWarehouseLocations(locResponse.data.locations || []);
    } catch (error) {
      console.error('Failed to fetch warehouse settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseSettings();
  }, []);

  const saveWarehouseSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/pawn-settings/warehouse`, warehouseSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({ title: 'Success', description: 'Warehouse settings saved successfully' });
      fetchWarehouseSettings();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save warehouse settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addAisle = () => {
    if (!newAisle.trim()) return;
    const aisle = newAisle.toUpperCase();
    if (warehouseSettings.aisles.includes(aisle)) {
      toast({ title: 'Error', description: 'Aisle already exists', variant: 'destructive' });
      return;
    }

    setWarehouseSettings((prev) => ({
      ...prev,
      aisles: [...prev.aisles, aisle],
    }));
    setNewAisle('');
  };

  const removeAisle = (aisle) => {
    setWarehouseSettings((prev) => ({
      ...prev,
      aisles: prev.aisles.filter((a) => a !== aisle),
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="warehouse-settings-loading">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="warehouse-settings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Product Settings</h1>
          <p className="text-gray-500">Configure warehouse and shelving locations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" /> Warehouse Configuration
          </CardTitle>
          <CardDescription>Define aisles, shelves, and bins for inventory location tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Aisles</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {warehouseSettings.aisles.map((aisle) => (
                <Badge
                  key={aisle}
                  variant="secondary"
                  className="text-lg px-3 py-1 cursor-pointer hover:bg-red-100"
                  onClick={() => removeAisle(aisle)}
                  data-testid={`warehouse-aisle-${aisle}`}
                >
                  {aisle} <Trash2 className="w-3 h-3 ml-1 text-red-500" />
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newAisle}
                onChange={(e) => setNewAisle(e.target.value.toUpperCase())}
                placeholder="New aisle (e.g., E)"
                className="w-32"
                maxLength={2}
                data-testid="new-aisle-input"
              />
              <Button variant="outline" onClick={addAisle} data-testid="add-aisle-button">
                <Plus className="w-4 h-4 mr-1" /> Add Aisle
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Shelves per Aisle</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={warehouseSettings.shelves_per_aisle}
                onChange={(e) => setWarehouseSettings({ ...warehouseSettings, shelves_per_aisle: parseInt(e.target.value, 10) || 1 })}
                data-testid="shelves-per-aisle"
              />
            </div>
            <div>
              <Label>Bins per Shelf</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={warehouseSettings.bins_per_shelf}
                onChange={(e) => setWarehouseSettings({ ...warehouseSettings, bins_per_shelf: parseInt(e.target.value, 10) || 1 })}
                data-testid="bins-per-shelf"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg" data-testid="warehouse-location-preview">
            <p className="text-sm font-medium text-blue-800 mb-2">Location Format Preview:</p>
            <div className="flex items-center gap-2 text-blue-700">
              <code className="bg-white px-2 py-1 rounded">{warehouseSettings.aisles[0] || 'A'}-1-01</code>
              <span>to</span>
              <code className="bg-white px-2 py-1 rounded">
                {warehouseSettings.aisles[warehouseSettings.aisles.length - 1] || 'D'}-{warehouseSettings.shelves_per_aisle}-{String(warehouseSettings.bins_per_shelf).padStart(2, '0')}
              </code>
            </div>
            <p className="text-xs text-[#6e2ea8] mt-2">
              Total locations: {warehouseSettings.aisles.length * warehouseSettings.shelves_per_aisle * warehouseSettings.bins_per_shelf}
            </p>
          </div>

          <Button
            onClick={saveWarehouseSettings}
            disabled={saving}
            className="bg-[#6e2ea8] hover:bg-[#a01830]"
            data-testid="save-generate-locations-button"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save & Generate Locations
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse Locations ({warehouseLocations.length})</CardTitle>
          <CardDescription>Click on a location to view items stored there</CardDescription>
        </CardHeader>
        <CardContent>
          {warehouseLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500" data-testid="warehouse-no-locations-state">
              <Warehouse className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No locations generated yet</p>
              <p className="text-sm">Configure aisles and save to generate locations</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="warehouse-locations-grid">
              {warehouseSettings.aisles.map((aisle) => (
                <div key={aisle}>
                  <h3 className="font-semibold mb-2">Aisle {aisle}</h3>
                  <div className="grid grid-cols-10 gap-1">
                    {warehouseLocations
                      .filter((loc) => loc.aisle === aisle)
                      .slice(0, 20)
                      .map((loc) => (
                        <div
                          key={loc.code}
                          className={`p-2 text-center text-xs rounded border cursor-pointer transition-colors ${
                            loc.current_count > 0
                              ? 'bg-green-100 border-green-300 hover:bg-green-200'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          title={`${loc.code}: ${loc.current_count} items`}
                        >
                          <div className="font-mono">{loc.code}</div>
                          {loc.current_count > 0 && <div className="text-green-700">{loc.current_count}</div>}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPeptidesSettings;
