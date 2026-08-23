import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Image, Video, Upload, Save, Loader2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_BACKGROUND_IMAGE = '/legacy-assets/legacy-hero-background.png';
const DEFAULT_HERO_VIDEO = '/videos/butterfly_alpha.webm';

const DevHeroMediaSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const backgroundInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [heroSettings, setHeroSettings] = useState({
    hero_background_image_url: DEFAULT_BACKGROUND_IMAGE,
    hero_video_url: DEFAULT_HERO_VIDEO,
    hero_card_image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1000&q=80',
    hero_card_title: 'AI-Powered',
    hero_card_subtitle: 'Commercial Cleaning',
    hero_card_description: 'Cutting-Edge Cleaning Technology',
  });

  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/admin-settings/hero-display`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setHeroSettings((prev) => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        toast({
          title: 'Load Failed',
          description: 'Could not load hero media settings. Using current defaults.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSettings();
  }, []);

  const saveHeroMediaSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin-settings/hero-display`, heroSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Saved', description: 'Hero background and video settings updated.' });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error.response?.data?.detail || 'Could not save hero media settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadMedia = async (file, kind) => {
    if (!file) return;

    if (kind === 'background' && !file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Background must be an image file.', variant: 'destructive' });
      return;
    }

    if (kind === 'video' && !file.type.startsWith('video/')) {
      toast({ title: 'Invalid File', description: 'Hero video must be a video file.', variant: 'destructive' });
      return;
    }

    if (kind === 'background' && file.size > 20 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Background image max size is 20MB.', variant: 'destructive' });
      return;
    }

    if (kind === 'video' && file.size > 250 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Hero video max size is 250MB.', variant: 'destructive' });
      return;
    }

    kind === 'background' ? setUploadingBackground(true) : setUploadingVideo(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', kind === 'background' ? 'hero/background' : 'hero/video');

      const response = await axios.post(`${API}/storage/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data?.url;
      if (!url) throw new Error('Upload response missing URL');

      if (kind === 'background') {
        setHeroSettings((prev) => ({ ...prev, hero_background_image_url: url }));
      } else {
        setHeroSettings((prev) => ({ ...prev, hero_video_url: url }));
      }

      toast({
        title: 'Uploaded',
        description: `${kind === 'background' ? 'Background image' : 'Hero video'} uploaded to iDrive folder successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Upload failed. You can still paste a direct URL.',
        variant: 'destructive',
      });
    } finally {
      setUploadingBackground(false);
      setUploadingVideo(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dev-hero-media-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6" data-testid="dev-hero-media-settings-page">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hero Media Assets</h2>
        <p className="text-gray-500 mt-1">Manage homepage hero background image and overlay video.</p>
      </div>

      <Card data-testid="dev-hero-background-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5 text-[#ff8c42]" /> Hero Background Image</CardTitle>
          <CardDescription>Uploads are placed in folder: <strong>hero/background</strong></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="hero-background-url">Background Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="hero-background-url"
              value={heroSettings.hero_background_image_url || ''}
              onChange={(e) => setHeroSettings((prev) => ({ ...prev, hero_background_image_url: e.target.value }))}
              placeholder="https://..."
              data-testid="hero-media-background-url-input"
            />
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadMedia(e.target.files?.[0], 'background')}
              data-testid="hero-media-background-upload-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => backgroundInputRef.current?.click()}
              disabled={uploadingBackground}
              data-testid="hero-media-background-upload-button"
            >
              {uploadingBackground ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3" data-testid="hero-media-background-preview">
            {heroSettings.hero_background_image_url ? (
              <img src={heroSettings.hero_background_image_url} alt="Hero background preview" className="w-full h-48 object-cover rounded-md" />
            ) : (
              <p className="text-sm text-gray-500">No background image selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="dev-hero-video-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Video className="w-5 h-5 text-[#6e2ea8]" /> Hero Overlay Video</CardTitle>
          <CardDescription>Uploads are placed in folder: <strong>hero/video</strong></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="hero-video-url">Hero Video URL</Label>
          <div className="flex gap-2">
            <Input
              id="hero-video-url"
              value={heroSettings.hero_video_url || ''}
              onChange={(e) => setHeroSettings((prev) => ({ ...prev, hero_video_url: e.target.value }))}
              placeholder="https://... or /videos/..."
              data-testid="hero-media-video-url-input"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => uploadMedia(e.target.files?.[0], 'video')}
              data-testid="hero-media-video-upload-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              data-testid="hero-media-video-upload-button"
            >
              {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3" data-testid="hero-media-video-preview">
            {heroSettings.hero_video_url ? (
              <video src={heroSettings.hero_video_url} className="w-full h-56 rounded-md bg-black" controls muted loop playsInline />
            ) : (
              <p className="text-sm text-gray-500">No hero video selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3" data-testid="hero-media-actions-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setHeroSettings((prev) => ({
            ...prev,
            hero_background_image_url: DEFAULT_BACKGROUND_IMAGE,
            hero_video_url: DEFAULT_HERO_VIDEO,
          }))}
          data-testid="hero-media-reset-defaults-button"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset to Current Defaults
        </Button>
        <Button
          type="button"
          onClick={saveHeroMediaSettings}
          disabled={saving}
          className="bg-[#6e2ea8] hover:bg-[#552483]"
          data-testid="hero-media-save-button"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Hero Media
        </Button>
      </div>
    </div>
  );
};

export default DevHeroMediaSettings;