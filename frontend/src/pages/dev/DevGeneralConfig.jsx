import React, { useState, useEffect, useRef } from 'react';
import { Settings, Globe, Lock, ChevronDown, ChevronUp, Edit, Loader2, Save, Upload, Image, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DevGeneralSettings = () => {
  const [expandedSections, setExpandedSections] = useState(['site']);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const [dragOverFavicon, setDragOverFavicon] = useState(false);
  
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  
  // Use individual state for each field to prevent re-render issues
  const [siteName, setSiteName] = useState('123Bots');
  const [siteUrl, setSiteUrl] = useState('https://123bots.com');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/admin-settings/site`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          const data = response.data;
          setSiteName(data.site_name || '123Bots');
          setSiteUrl(data.site_url || 'https://123bots.com');
          setLogoUrl(data.logo_url || '');
          setFaviconUrl(data.favicon_url || '');
          setAdminEmail(data.admin_email || '');
          setSupportEmail(data.support_email || '');
          setMaintenanceMode(data.maintenance_mode || false);
          setDebugMode(data.debug_mode || false);
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const uploadFile = async (file, type) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'site');
    formData.append('resize', type === 'favicon' ? '32' : '200');
    
    const response = await axios.post(`${API_URL}/api/storage/upload-site-asset`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.url;
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a PNG, JPG, WebP, GIF, or SVG image.', variant: 'destructive' });
      return;
    }
    
    setUploadingLogo(true);
    try {
      const url = await uploadFile(file, 'logo');
      setLogoUrl(url);
      toast({ title: 'Logo uploaded', description: 'Logo has been uploaded successfully.' });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload logo.', variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file) => {
    if (!file) return;
    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/ico', 'image/webp'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(file.type) && ext !== 'ico') {
      toast({ title: 'Invalid file type', description: 'Please upload a PNG, JPG, ICO, or WebP image.', variant: 'destructive' });
      return;
    }
    
    setUploadingFavicon(true);
    try {
      const url = await uploadFile(file, 'favicon');
      setFaviconUrl(url);
      toast({ title: 'Favicon uploaded', description: 'Favicon has been uploaded successfully.' });
    } catch (error) {
      console.error('Favicon upload error:', error);
      toast({ title: 'Upload failed', description: 'Failed to upload favicon.', variant: 'destructive' });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setDragOverLogo(true);
    else setDragOverFavicon(true);
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setDragOverLogo(false);
    else setDragOverFavicon(false);
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'logo') setDragOverLogo(false);
    else setDragOverFavicon(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (type === 'logo') handleLogoUpload(file);
      else handleFaviconUpload(file);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin-settings/site`, {
        site_name: siteName,
        site_url: siteUrl,
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        admin_email: adminEmail,
        support_email: supportEmail,
        maintenance_mode: maintenanceMode,
        debug_mode: debugMode,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Settings Saved', description: 'Site settings updated successfully.' });
      setIsEditing(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#ff8c42]" />
      </div>
    );
  }

  const inputClassName = "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-base text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ff8c42] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-6" data-testid="dev-general-settings">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Settings</h1>
          <p className="text-gray-500">Core site configuration and branding</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving} data-testid="general-settings-cancel-button">
                Cancel
              </Button>
              <Button onClick={saveSettings} disabled={saving} className="bg-[#ff8c42] hover:bg-[#e67a35]" data-testid="general-settings-save-button">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-[#ff8c42] hover:bg-[#e67a35]" data-testid="general-settings-edit-button">
              <Edit className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Site Information */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('site')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#ff8c42]" />
              <div>
                <CardTitle className="text-lg">Site Information</CardTitle>
                <CardDescription>Basic site details and branding</CardDescription>
              </div>
            </div>
            {expandedSections.includes('site') ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {expandedSections.includes('site') && (
          <CardContent className="space-y-6">
            {/* Site Name & URL */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <input
                  id="site-name"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  disabled={!isEditing}
                  className={`${inputClassName} mt-1`}
                  data-testid="site-name-input"
                />
                <p className="text-xs text-gray-500 mt-1">Displayed in browser tab and site header</p>
              </div>
              <div>
                <Label htmlFor="site-url">Site URL</Label>
                <input
                  id="site-url"
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  disabled={!isEditing}
                  className={`${inputClassName} mt-1`}
                  placeholder="https://123bots.com"
                  data-testid="site-url-input"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Logo</Label>
                <div 
                  className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragOverLogo ? 'border-[#ff8c42] bg-orange-50' : 'border-gray-300 hover:border-gray-400'
                  } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onDragOver={(e) => isEditing && handleDragOver(e, 'logo')}
                  onDragLeave={(e) => handleDragLeave(e, 'logo')}
                  onDrop={(e) => isEditing && handleDrop(e, 'logo')}
                  onClick={() => isEditing && logoInputRef.current?.click()}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e.target.files[0])}
                    disabled={!isEditing}
                  />
                  {uploadingLogo ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-[#ff8c42]" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Drag & drop or click to upload</span>
                      <span className="text-xs text-gray-400">PNG, JPG, WebP, GIF, SVG</span>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={!isEditing}
                  className={`${inputClassName} mt-2`}
                  placeholder="Or paste URL here"
                  data-testid="logo-url-input"
                />
              </div>
              <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[140px] relative">
                {logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo preview" className="max-h-20 max-w-full" />
                    {isEditing && (
                      <button 
                        onClick={() => setLogoUrl('')}
                        className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                    <span className="text-xs text-gray-500 mt-2">Current Logo</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Image className="w-10 h-10 text-gray-300" />
                    <span className="text-gray-400 text-sm">No logo set</span>
                  </div>
                )}
              </div>
            </div>

            {/* Favicon Upload */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Favicon</Label>
                <div 
                  className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    dragOverFavicon ? 'border-[#ff8c42] bg-orange-50' : 'border-gray-300 hover:border-gray-400'
                  } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onDragOver={(e) => isEditing && handleDragOver(e, 'favicon')}
                  onDragLeave={(e) => handleDragLeave(e, 'favicon')}
                  onDrop={(e) => isEditing && handleDrop(e, 'favicon')}
                  onClick={() => isEditing && faviconInputRef.current?.click()}
                >
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/x-icon,image/vnd.microsoft.icon,.ico,image/webp"
                    className="hidden"
                    onChange={(e) => handleFaviconUpload(e.target.files[0])}
                    disabled={!isEditing}
                  />
                  {uploadingFavicon ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 animate-spin text-[#ff8c42]" />
                      <span className="text-sm text-gray-500">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">Drag & drop or click to upload</span>
                      <span className="text-xs text-gray-400">PNG, JPG, ICO, WebP (auto-resized)</span>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  disabled={!isEditing}
                  className={`${inputClassName} mt-2`}
                  placeholder="Or paste URL here"
                  data-testid="favicon-url-input"
                />
              </div>
              <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[140px] relative">
                {faviconUrl ? (
                  <>
                    <img src={faviconUrl} alt="Favicon preview" className="w-16 h-16 object-contain" />
                    {isEditing && (
                      <button 
                        onClick={() => setFaviconUrl('')}
                        className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                    <span className="text-xs text-gray-500 mt-2">Current Favicon</span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Image className="w-10 h-10 text-gray-300" />
                    <span className="text-gray-400 text-sm">No favicon set</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Contact Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('contact')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-[#ff8c42]" />
              <div>
                <CardTitle className="text-lg">Contact Settings</CardTitle>
                <CardDescription>Email addresses for admin and support</CardDescription>
              </div>
            </div>
            {expandedSections.includes('contact') ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {expandedSections.includes('contact') && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="admin-email">Admin Email</Label>
                <input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`${inputClassName} mt-1`}
                  placeholder="admin@123bots.com"
                  data-testid="admin-email-input"
                />
              </div>
              <div>
                <Label htmlFor="support-email">Support Email</Label>
                <input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  disabled={!isEditing}
                  className={`${inputClassName} mt-1`}
                  placeholder="support@123bots.com"
                  data-testid="support-email-input"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('advanced')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#ff8c42]" />
              <div>
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
                <CardDescription>Maintenance and debug options</CardDescription>
              </div>
            </div>
            {expandedSections.includes('advanced') ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CardHeader>
        {expandedSections.includes('advanced') && (
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div>
                <h4 className="font-medium text-amber-900">Maintenance Mode</h4>
                <p className="text-sm text-amber-700">Show maintenance page to visitors</p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
                disabled={!isEditing}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
              <div>
                <h4 className="font-medium">Debug Mode</h4>
                <p className="text-sm text-gray-500">Enable verbose logging</p>
              </div>
              <Switch
                checked={debugMode}
                onCheckedChange={setDebugMode}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default DevGeneralSettings;
