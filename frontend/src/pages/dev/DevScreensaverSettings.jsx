import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Image, Video, Upload, Save, Loader2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_SETTINGS = {
  image_a_url: 'https://customer-assets.emergentagent.com/job_65c71db2-9245-43b1-9627-564f71a23c40/artifacts/2mxzmwy8_logo-bubble-for-sleep-screen.png',
  image_b_url: 'https://customer-assets.emergentagent.com/job_65c71db2-9245-43b1-9627-564f71a23c40/artifacts/71zcw0f9_logo-bubble-for-sleep-screen-2.png',
  image_a_count: 15,
  image_b_count: 15,
  video_url: 'https://cdn.coverr.co/videos/coverr-waves-in-slow-motion-1579/1080p.mp4',
};

const clampCount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(60, Math.floor(parsed)));
};

const DevScreensaverSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImageA, setUploadingImageA] = useState(false);
  const [uploadingImageB, setUploadingImageB] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const imageAInputRef = useRef(null);
  const imageBInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchScreensaverSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/admin-settings/screensaver`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) {
          setSettings((prev) => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        toast({
          title: 'Load Failed',
          description: 'Could not load screensaver settings. Using current defaults.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScreensaverSettings();
  }, []);

  const uploadMedia = async (file, target) => {
    if (!file) return;

    const isVideo = target === 'video_url';
    if (isVideo && !file.type.startsWith('video/')) {
      toast({ title: 'Invalid File', description: 'Screensaver video must be a video file.', variant: 'destructive' });
      return;
    }

    if (!isVideo && !file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Screensaver bubbles must be image files.', variant: 'destructive' });
      return;
    }

    if (isVideo && file.size > 250 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Screensaver video max size is 250MB.', variant: 'destructive' });
      return;
    }

    if (!isVideo && file.size > 20 * 1024 * 1024) {
      toast({ title: 'Too Large', description: 'Screensaver image max size is 20MB.', variant: 'destructive' });
      return;
    }

    if (target === 'image_a_url') setUploadingImageA(true);
    if (target === 'image_b_url') setUploadingImageB(true);
    if (target === 'video_url') setUploadingVideo(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', isVideo ? 'screensaver/video' : 'screensaver/images');

      const response = await axios.post(`${API}/storage/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const url = response.data?.url;
      if (!url) throw new Error('Upload response missing URL');

      setSettings((prev) => ({ ...prev, [target]: url }));

      toast({
        title: 'Uploaded',
        description: isVideo
          ? 'Screensaver video uploaded successfully.'
          : 'Screensaver bubble image uploaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Upload failed. You can still paste a direct URL.',
        variant: 'destructive',
      });
    } finally {
      setUploadingImageA(false);
      setUploadingImageB(false);
      setUploadingVideo(false);
      if (imageAInputRef.current) imageAInputRef.current.value = '';
      if (imageBInputRef.current) imageBInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin-settings/screensaver`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Saved', description: 'Screensaver settings updated.' });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error.response?.data?.detail || 'Could not save screensaver settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dev-screensaver-settings-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6" data-testid="dev-screensaver-settings-page">
      <div>
        <h2 className="text-2xl font-bold text-gray-900" data-testid="dev-screensaver-settings-title">Screensaver</h2>
        <p className="text-gray-500 mt-1" data-testid="dev-screensaver-settings-description">
          Replace two bouncing images, set their amounts, and choose the screensaver video.
        </p>
      </div>

      <Card data-testid="screensaver-image-a-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5 text-[#ff8c42]" /> Bouncing Image A</CardTitle>
          <CardDescription>Image uploads are stored in <strong>screensaver/images</strong>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="screensaver-image-a-url">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="screensaver-image-a-url"
              value={settings.image_a_url || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, image_a_url: e.target.value }))}
              placeholder="https://..."
              data-testid="screensaver-image-a-url-input"
            />
            <input
              ref={imageAInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadMedia(e.target.files?.[0], 'image_a_url')}
              data-testid="screensaver-image-a-upload-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageAInputRef.current?.click()}
              disabled={uploadingImageA}
              data-testid="screensaver-image-a-upload-button"
            >
              {uploadingImageA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>

          <div className="w-full sm:w-48">
            <Label htmlFor="screensaver-image-a-count">Amount</Label>
            <Input
              id="screensaver-image-a-count"
              type="number"
              min={0}
              max={60}
              value={settings.image_a_count}
              onChange={(e) => setSettings((prev) => ({ ...prev, image_a_count: clampCount(e.target.value) }))}
              data-testid="screensaver-image-a-count-input"
            />
          </div>

          <div className="rounded-lg border bg-gray-50 p-3" data-testid="screensaver-image-a-preview">
            {settings.image_a_url ? (
              <img src={settings.image_a_url} alt="Screensaver image A preview" className="w-full h-40 object-contain rounded-md bg-white" />
            ) : (
              <p className="text-sm text-gray-500" data-testid="screensaver-image-a-preview-empty">No image selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="screensaver-image-b-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5 text-[#6e2ea8]" /> Bouncing Image B</CardTitle>
          <CardDescription>Image uploads are stored in <strong>screensaver/images</strong>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="screensaver-image-b-url">Image URL</Label>
          <div className="flex gap-2">
            <Input
              id="screensaver-image-b-url"
              value={settings.image_b_url || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, image_b_url: e.target.value }))}
              placeholder="https://..."
              data-testid="screensaver-image-b-url-input"
            />
            <input
              ref={imageBInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => uploadMedia(e.target.files?.[0], 'image_b_url')}
              data-testid="screensaver-image-b-upload-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageBInputRef.current?.click()}
              disabled={uploadingImageB}
              data-testid="screensaver-image-b-upload-button"
            >
              {uploadingImageB ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>

          <div className="w-full sm:w-48">
            <Label htmlFor="screensaver-image-b-count">Amount</Label>
            <Input
              id="screensaver-image-b-count"
              type="number"
              min={0}
              max={60}
              value={settings.image_b_count}
              onChange={(e) => setSettings((prev) => ({ ...prev, image_b_count: clampCount(e.target.value) }))}
              data-testid="screensaver-image-b-count-input"
            />
          </div>

          <div className="rounded-lg border bg-gray-50 p-3" data-testid="screensaver-image-b-preview">
            {settings.image_b_url ? (
              <img src={settings.image_b_url} alt="Screensaver image B preview" className="w-full h-40 object-contain rounded-md bg-white" />
            ) : (
              <p className="text-sm text-gray-500" data-testid="screensaver-image-b-preview-empty">No image selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card data-testid="screensaver-video-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Video className="w-5 h-5 text-[#b9893d]" /> Screensaver Video</CardTitle>
          <CardDescription>Video uploads are stored in <strong>screensaver/video</strong>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label htmlFor="screensaver-video-url">Video URL</Label>
          <div className="flex gap-2">
            <Input
              id="screensaver-video-url"
              value={settings.video_url || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, video_url: e.target.value }))}
              placeholder="https://... or /videos/..."
              data-testid="screensaver-video-url-input"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => uploadMedia(e.target.files?.[0], 'video_url')}
              data-testid="screensaver-video-upload-input"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              data-testid="screensaver-video-upload-button"
            >
              {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3" data-testid="screensaver-video-preview">
            {settings.video_url ? (
              <video src={settings.video_url} className="w-full h-56 rounded-md bg-black" controls muted loop playsInline />
            ) : (
              <p className="text-sm text-gray-500" data-testid="screensaver-video-preview-empty">No video selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3" data-testid="screensaver-settings-actions-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSettings(DEFAULT_SETTINGS)}
          data-testid="screensaver-settings-reset-defaults-button"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Reset to Defaults
        </Button>
        <Button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="bg-[#6e2ea8] hover:bg-[#552483]"
          data-testid="screensaver-settings-save-button"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Screensaver Settings
        </Button>
      </div>
    </div>
  );
};

export default DevScreensaverSettings;
