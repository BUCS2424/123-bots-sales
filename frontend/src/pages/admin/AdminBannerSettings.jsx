import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Image, Plus, Trash2, GripVertical, Save, Loader2, Upload,
  ExternalLink, ToggleLeft, ToggleRight, Clock, ArrowUp, ArrowDown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminBannerSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    auto_scroll: true,
    scroll_interval: 5,
    banners: []
  });
  const [heroSettings, setHeroSettings] = useState({
    hero_background_image_url: 'https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png',
    hero_video_url: '/videos/butterfly_alpha.webm',
    hero_card_image_url: '',
    hero_card_title: 'CUSTOM EMPORIUM',
    hero_card_subtitle: 'Unique & Personalized',
    hero_card_description: 'Made with care, just for you'
  });
  const [savingHero, setSavingHero] = useState(false);
  const [newBanner, setNewBanner] = useState({
    image_url: '',
    alt_text: '',
    link_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const fileInputRef = useRef(null);
  const heroFileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const [bannerResponse, heroResponse] = await Promise.all([
        axios.get(`${API}/admin-settings/home-banners`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin-settings/hero-display`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setSettings(bannerResponse.data);
      setHeroSettings(heroResponse.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load banner settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin-settings/home-banners`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Settings Saved',
        description: 'Home banner settings have been updated.'
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save banner settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const saveHeroSettings = async () => {
    setSavingHero(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin-settings/hero-display`, heroSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Settings Saved',
        description: 'Hero display settings have been updated.'
      });
    } catch (error) {
      console.error('Failed to save hero settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save hero display settings',
        variant: 'destructive'
      });
    } finally {
      setSavingHero(false);
    }
  };

  const handleHeroFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploadingHero(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hero');

      const response = await axios.post(`${API}/storage/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.url) {
        setHeroSettings(prev => ({ ...prev, hero_card_image_url: response.data.url }));
        toast({
          title: 'Image Uploaded',
          description: 'Hero card image uploaded successfully.'
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. You can still paste an image URL.',
        variant: 'destructive'
      });
    } finally {
      setUploadingHero(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image must be less than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'banners');

      const response = await axios.post(`${API}/storage/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.url) {
        setNewBanner(prev => ({ ...prev, image_url: response.data.url }));
        toast({
          title: 'Image Uploaded',
          description: 'Banner image uploaded successfully.'
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload image. You can still paste an image URL.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addBanner = async () => {
    if (!newBanner.image_url) {
      toast({
        title: 'Missing Image',
        description: 'Please provide an image URL or upload an image.',
        variant: 'destructive'
      });
      return;
    }

    if (settings.banners.length >= 5) {
      toast({
        title: 'Maximum Banners',
        description: 'You can only have up to 5 banners.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/admin-settings/home-banners/add`, newBanner, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSettings(prev => ({
          ...prev,
          banners: [...prev.banners, response.data.banner]
        }));
        setNewBanner({ image_url: '', alt_text: '', link_url: '' });
        toast({
          title: 'Banner Added',
          description: 'New banner has been added to the homepage.'
        });
      }
    } catch (error) {
      console.error('Failed to add banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to add banner',
        variant: 'destructive'
      });
    }
  };

  const deleteBanner = async (bannerId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin-settings/home-banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSettings(prev => ({
        ...prev,
        banners: prev.banners.filter(b => b.id !== bannerId)
      }));
      toast({
        title: 'Banner Deleted',
        description: 'Banner has been removed from the homepage.'
      });
    } catch (error) {
      console.error('Failed to delete banner:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete banner',
        variant: 'destructive'
      });
    }
  };

  const moveBanner = (index, direction) => {
    const newBanners = [...settings.banners];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newBanners.length) return;
    
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
    
    // Update order values
    newBanners.forEach((b, i) => { b.order = i; });
    
    setSettings(prev => ({ ...prev, banners: newBanners }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-banner-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Image className="w-8 h-8 text-[#6e2ea8]" />
            Banner & Display Settings
          </h1>
          <p className="text-gray-500">Manage hero section and homepage banners</p>
        </div>
      </div>

      {/* Hero Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ff8c42]" />
            Hero Section Card
          </CardTitle>
          <CardDescription>Configure the promotional card displayed in the hero section</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-image-url">Card Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="hero-image-url"
                    placeholder="https://example.com/hero-image.jpg"
                    value={heroSettings.hero_card_image_url}
                    onChange={(e) => setHeroSettings(prev => ({ ...prev, hero_card_image_url: e.target.value }))}
                    data-testid="hero-image-url-input"
                  />
                  <input
                    type="file"
                    ref={heroFileInputRef}
                    accept="image/*"
                    onChange={handleHeroFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={uploadingHero}
                    data-testid="hero-upload-btn"
                  >
                    {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-title">Card Title</Label>
                <Input
                  id="hero-title"
                  placeholder="CUSTOM EMPORIUM"
                  value={heroSettings.hero_card_title}
                  onChange={(e) => setHeroSettings(prev => ({ ...prev, hero_card_title: e.target.value }))}
                  data-testid="hero-title-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Card Subtitle</Label>
                <Input
                  id="hero-subtitle"
                  placeholder="Unique & Personalized"
                  value={heroSettings.hero_card_subtitle}
                  onChange={(e) => setHeroSettings(prev => ({ ...prev, hero_card_subtitle: e.target.value }))}
                  data-testid="hero-subtitle-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-description">Card Description</Label>
                <Input
                  id="hero-description"
                  placeholder="Made with care, just for you"
                  value={heroSettings.hero_card_description}
                  onChange={(e) => setHeroSettings(prev => ({ ...prev, hero_card_description: e.target.value }))}
                  data-testid="hero-description-input"
                />
              </div>
            </div>
            
            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full max-w-[320px] h-80 rounded-3xl overflow-hidden border border-white/20 bg-white/10 shadow-2xl">
                {heroSettings.hero_card_image_url ? (
                  <img
                    src={heroSettings.hero_card_image_url}
                    alt="Hero card preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-mono text-xs text-[#ff8c42] mb-1">{heroSettings.hero_card_title || 'CUSTOM EMPORIUM'}</p>
                  <p className="font-bold text-white text-lg">{heroSettings.hero_card_subtitle || 'Unique & Personalized'}</p>
                  <p className="text-gray-300 text-sm">{heroSettings.hero_card_description || 'Made with care, just for you'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={saveHeroSettings} 
            disabled={savingHero}
            className="bg-[#ff8c42] hover:bg-[#ff6b1a]"
            data-testid="save-hero-settings-btn"
          >
            {savingHero ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Hero Settings
          </Button>
        </CardContent>
      </Card>

      {/* Banner Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Home Page Banners</CardTitle>
              <CardDescription>Manage scrolling banners on your homepage</CardDescription>
            </div>
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="bg-[#6e2ea8] hover:bg-[#a01830]"
              data-testid="save-banner-settings-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Banner Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Banners</Label>
              <p className="text-xs text-gray-500">Show banner section on homepage</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              data-testid="banner-enabled-switch"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Scroll</Label>
                <p className="text-xs text-gray-500">Automatically rotate through banners</p>
              </div>
              <Switch
                checked={settings.auto_scroll}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_scroll: checked }))}
                data-testid="banner-auto-scroll-switch"
              />
            </div>
          </div>

          {settings.auto_scroll && (
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Scroll Interval
                  </Label>
                  <p className="text-xs text-gray-500">Seconds between banner transitions</p>
                </div>
                <div className="w-full sm:w-40">
                  <Select 
                    value={settings.scroll_interval?.toString()} 
                    onValueChange={(val) => setSettings(prev => ({ ...prev, scroll_interval: parseInt(val) }))}
                  >
                    <SelectTrigger data-testid="scroll-interval-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 seconds</SelectItem>
                      <SelectItem value="5">5 seconds</SelectItem>
                      <SelectItem value="7">7 seconds</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="15">15 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Banner */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Banner
          </CardTitle>
          <CardDescription>Upload or link an image for the homepage banner (max 5 banners)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banner-url">Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="banner-url"
                  placeholder="https://example.com/banner.jpg"
                  value={newBanner.image_url}
                  onChange={(e) => setNewBanner(prev => ({ ...prev, image_url: e.target.value }))}
                  data-testid="banner-url-input"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  data-testid="banner-upload-btn"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner-alt">Alt Text (optional)</Label>
              <Input
                id="banner-alt"
                placeholder="Description of the banner"
                value={newBanner.alt_text}
                onChange={(e) => setNewBanner(prev => ({ ...prev, alt_text: e.target.value }))}
                data-testid="banner-alt-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner-link">Link URL (optional)</Label>
            <Input
              id="banner-link"
              placeholder="https://example.com/page"
              value={newBanner.link_url}
              onChange={(e) => setNewBanner(prev => ({ ...prev, link_url: e.target.value }))}
              data-testid="banner-link-input"
            />
            <p className="text-xs text-gray-500">Users will be taken to this URL when clicking the banner</p>
          </div>

          {/* Preview */}
          {newBanner.image_url && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm mb-2 block">Preview</Label>
              <img 
                src={newBanner.image_url} 
                alt={newBanner.alt_text || 'Banner preview'} 
                className="w-full max-h-40 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <Button 
            onClick={addBanner} 
            className="w-full bg-[#6e2ea8] hover:bg-[#152d4a]"
            disabled={!newBanner.image_url || settings.banners.length >= 5}
            data-testid="add-banner-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Banner ({settings.banners.length}/5)
          </Button>
        </CardContent>
      </Card>

      {/* Current Banners */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Banners</CardTitle>
          <CardDescription>
            {settings.banners.length === 0 
              ? 'No banners configured. Add your first banner above.'
              : `${settings.banners.length} banner${settings.banners.length > 1 ? 's' : ''} configured. ${settings.banners.length === 1 ? 'Banner will be static.' : 'Banners will auto-scroll.'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.banners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Image className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No banners yet. Add your first banner above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.banners.map((banner, index) => (
                <div 
                  key={banner.id} 
                  className="flex items-center gap-4 p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                  data-testid={`banner-item-${index}`}
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveBanner(index, 'up')}
                      disabled={index === 0}
                      data-testid={`move-up-${index}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveBanner(index, 'down')}
                      disabled={index === settings.banners.length - 1}
                      data-testid={`move-down-${index}`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg border">
                    <img 
                      src={banner.image_url} 
                      alt={banner.alt_text || `Banner ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">Banner {index + 1}</p>
                    <p className="text-sm text-gray-500 truncate">{banner.alt_text || 'No description'}</p>
                    {banner.link_url && (
                      <a 
                        href={banner.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-[#6e2ea8] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {banner.link_url}
                      </a>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteBanner(banner.id)}
                    data-testid={`delete-banner-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBannerSettings;
