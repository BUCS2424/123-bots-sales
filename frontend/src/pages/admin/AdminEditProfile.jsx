import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Save, Loader2, Mail, Phone, Lock, Eye, EyeOff,
  Camera, Shield, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { EmailTwoFactorSettingsCard } from '../../components/security/EmailTwoFactorSettingsCard';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminEditProfile = () => {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: profile.name,
        phone: profile.phone
      };

      await axios.put(`${API}/auth/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved.'
      });

      if (refreshUser) refreshUser();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (profile.new_password !== profile.confirm_password) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (profile.new_password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/auth/change-password`, {
        current_password: profile.current_password,
        new_password: profile.new_password
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.'
      });

      setProfile(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-edit-profile">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8 text-[rgb(37, 99, 235)]" />
            Edit Profile
          </h1>
          <p className="text-gray-500">Update your personal information and password</p>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-[rgb(37, 99, 235)] text-white text-3xl">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 bg-[rgb(37, 99, 235)] text-white rounded-full hover:bg-[#a01830] transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <Badge className="mt-2 bg-purple-100 text-purple-800">
                <Shield className="w-3 h-3 mr-1" />
                {user?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Update your name and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  data-testid="profile-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="pl-10 bg-gray-50"
                    data-testid="profile-email-input"
                  />
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed. Contact admin if needed.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 555-5555"
                  className="pl-10"
                  data-testid="profile-phone-input"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-[rgb(37, 99, 235)] hover:bg-[#a01830]"
              data-testid="save-profile-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={profile.current_password}
                  onChange={(e) => setProfile(prev => ({ ...prev, current_password: e.target.value }))}
                  placeholder="Enter current password"
                  className="pr-10"
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={profile.new_password}
                    onChange={(e) => setProfile(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Enter new password"
                    className="pr-10"
                    data-testid="new-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={profile.confirm_password}
                  onChange={(e) => setProfile(prev => ({ ...prev, confirm_password: e.target.value }))}
                  placeholder="Confirm new password"
                  data-testid="confirm-password-input"
                />
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Password Requirements:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>At least 8 characters long</li>
                  <li>Mix of letters and numbers recommended</li>
                </ul>
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={saving || !profile.current_password || !profile.new_password}
              variant="outline"
              className="border-[rgb(37, 99, 235)] text-[rgb(37, 99, 235)] hover:bg-[rgb(37, 99, 235)] hover:text-white"
              data-testid="change-password-btn"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <EmailTwoFactorSettingsCard
        testIdPrefix="admin-email-2fa"
        title="Protect My Admin Login"
        description="Require a fresh email code whenever you sign in, unless you trust the current browser for 30 days."
      />
    </div>
  );
};

export default AdminEditProfile;
