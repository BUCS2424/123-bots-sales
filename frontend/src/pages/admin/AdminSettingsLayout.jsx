import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
  Settings, BarChart3, Users, User, CreditCard, Bell, Building2, Receipt,
  ChevronDown, ArrowLeft, Timer, Globe, Truck, Package, HelpCircle,
  Home, LogOut, Code, Percent, Warehouse, Image, UserPlus, DollarSign, Sparkles, HardDriveDownload, FolderTree
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { Toaster } from '../../components/ui/toaster';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';

// Admin Settings Pages
import AdminSettingsOverview from './AdminSettingsOverview';
import AdminSettings from './AdminSettings';
import AdminStorageSettings from './AdminStorageSettings';
import AdminPaymentSettings from './AdminPaymentSettings';
import AdminNotificationSettings from './AdminNotificationSettings';
import AdminBusinessSettings from './AdminBusinessSettings';
import AdminTaxSettings from './AdminTaxSettings';
import AdminPeptidesSettings from './AdminPawnSettings';
import AdminBannerSettings from './AdminBannerSettings';
import AdminUsers from './AdminUsers';
import AdminAIKeysSettings from './AdminAIKeysSettings';
import AdminAccounting from './AdminAccountingOverview';
import AdminSystemBackup from './AdminSystemBackup';
import AdminShippingSettings from './AdminShippingSettings';
import AdminMegaMenu from './AdminMegaMenu';

const AdminSettingsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { logoUrl, siteName } = useSiteSettings();
  const [logoErrored, setLogoErrored] = useState(false);

  useEffect(() => {
    setLogoErrored(false);
  }, [logoUrl]);
  const [expandedSections, setExpandedSections] = useState(['overview']);
  const [featureFlags, setFeatureFlags] = useState({
    owner_chat_enabled: false,
    owner_chat_ai_enabled: false,
  });
  const [featureFlagsLoaded, setFeatureFlagsLoaded] = useState(false);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/settings/feature-flags`);
        setFeatureFlags({
          owner_chat_enabled: Boolean(response.data?.owner_chat_enabled),
          owner_chat_ai_enabled: Boolean(response.data?.owner_chat_ai_enabled),
        });
      } catch (error) {
        setFeatureFlags({ owner_chat_enabled: false, owner_chat_ai_enabled: false });
      } finally {
        setFeatureFlagsLoaded(true);
      }
    };

    loadFlags();
  }, []);

  const canManageAIKeys = featureFlags.owner_chat_enabled && featureFlags.owner_chat_ai_enabled;

  // Menu structure for admin settings
  const menuSections = [
    {
      id: 'overview',
      label: 'Overview',
      children: [
        { path: '/admin/settings/dashboard', label: 'Dashboard', icon: BarChart3, description: 'Financial overview' },
        { path: '/admin/settings/profile', label: 'Profile Settings', icon: Users, description: 'Account & preferences' },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      children: [
        { path: '/admin/settings/business', label: 'Business Info', icon: Building2, description: 'Company details & hours' },
        { path: '/admin/settings/tax', label: 'Tax Settings', icon: Receipt, description: 'Tax rates & rules' },
        { path: '/admin/settings/payments', label: 'Payment Settings', icon: CreditCard, description: 'Stripe & payment methods' },
        { path: '/admin/settings/shipping', label: 'Shipping Settings', icon: Truck, description: 'Carriers & local pickup' },
      ],
    },
    {
      id: 'pawn',
      label: 'Products',
      children: [
        { path: '/admin/settings/warehouse', label: 'Warehouse/Shelving', icon: Warehouse, description: 'Inventory locations' },
        { path: '/admin/settings/accounting', label: 'Catalog Accounting', icon: BarChart3, description: 'Financial reports & KPIs' },
      ],
    },
    {
      id: 'website',
      label: 'Website',
      children: [
        { path: '/admin/settings/mega-menu', label: 'Mega Menu', icon: FolderTree, description: 'Navigation & menu builder' },
        { path: '/admin/settings/banners', label: 'Home Page Banners', icon: Image, description: 'Scrolling banner images' },
      ],
    },
    {
      id: 'system',
      label: 'System',
      children: [
        { path: '/admin/settings/notifications', label: 'Notifications', icon: Bell, description: 'Email & SMS alerts' },
        { path: '/admin/settings/storage', label: 'Cloud Storage', icon: Globe, description: 'iDrive E2 configuration' },
        { path: '/admin/settings/system', label: 'System Backup', icon: HardDriveDownload, description: 'Full backup & restore' },
        { path: '/admin/settings/users', label: 'User Management', icon: UserPlus, description: 'Create & manage users' },
        ...(canManageAIKeys ? [{ path: '/admin/settings/ai-keys', label: 'AI Keys', icon: Sparkles, description: 'Manage API keys for AI features' }] : []),
      ],
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? []  // Close if clicking on already open section
        : [sectionId]  // Only open the clicked section, close all others
    );
  };

  const isActive = (path) => {
    if (path === '/admin/settings/dashboard') return location.pathname === '/admin/settings/dashboard';
    return location.pathname === path;
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/admin/settings/dashboard') return <AdminSettingsOverview />;
    if (path === '/admin/settings/profile') return <AdminSettings />;
    if (path === '/admin/settings/business') return <AdminBusinessSettings />;
    if (path === '/admin/settings/tax') return <AdminTaxSettings />;
    if (path === '/admin/settings/payments') return <AdminPaymentSettings />;
    if (path === '/admin/settings/shipping') return <AdminShippingSettings />;
    if (path === '/admin/settings/notifications') return <AdminNotificationSettings />;
    if (path === '/admin/settings/storage') return <AdminStorageSettings />;
    if (path === '/admin/settings/system') return <AdminSystemBackup />;
    if (path === '/admin/settings/pawn') return <Navigate to="/admin/settings/warehouse" replace />;
    if (path === '/admin/settings/warehouse') return <AdminPeptidesSettings />;
    if (path === '/admin/settings/mega-menu') return <AdminMegaMenu />;
    if (path === '/admin/settings/banners') return <AdminBannerSettings />;
    if (path === '/admin/settings/users') return <AdminUsers />;
    if (path === '/admin/settings/ai-keys') {
      if (featureFlagsLoaded && !canManageAIKeys) return <Navigate to="/admin/settings/dashboard" replace />;
      return <AdminAIKeysSettings />;
    }
    if (path === '/admin/settings/accounting') return <AdminAccounting />;
    return <AdminSettingsOverview />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/" replace />;
  }

  if (
    location.pathname === '/admin/settings/storage-units' ||
    location.pathname === '/admin/settings/storage-pricing' ||
    location.pathname === '/admin/settings/rv-services' ||
    location.pathname === '/admin/settings/rv-pricing'
  ) {
    return <Navigate to="/admin/settings/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" data-theme="light" data-testid="admin-settings-layout">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-gradient-to-r from-[#0a1929] to-[#0d2847]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Settings className="w-5 h-5 text-green-400" />
            </div>
            <span className="font-bold text-white">ADMIN SETTINGS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuSections.map((section) => {
            // Define colors for specific sections - blue/green theme
            const sectionColors = {
              overview: { bg: 'bg-blue-600', text: 'text-blue-600', hover: 'hover:bg-blue-50', activeBg: 'bg-blue-600', border: '#2563eb' },
              business: { bg: 'bg-green-600', text: 'text-green-600', hover: 'hover:bg-green-50', activeBg: 'bg-green-600', border: '#16a34a' },
              pawn: { bg: 'bg-teal-600', text: 'text-teal-600', hover: 'hover:bg-teal-50', activeBg: 'bg-teal-600', border: '#0d9488' },
              website: { bg: 'bg-cyan-600', text: 'text-cyan-600', hover: 'hover:bg-cyan-50', activeBg: 'bg-cyan-600', border: '#0891b2' },
              system: { bg: 'bg-slate-600', text: 'text-slate-600', hover: 'hover:bg-slate-50', activeBg: 'bg-slate-600', border: '#475569' },
            };
            const colors = sectionColors[section.id] || { bg: 'bg-blue-600', text: 'text-gray-500', hover: 'hover:bg-gray-100', activeBg: 'bg-blue-600', border: '#2563eb' };
            
            return (
            <div key={section.id} className="mb-4">
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  expandedSections.includes(section.id) 
                    ? `${colors.bg} text-white` 
                    : `${colors.text} ${colors.hover}`
                }`}
              >
                {section.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.includes(section.id) ? '' : '-rotate-90'}`} />
              </button>
              
              {expandedSections.includes(section.id) && (
                <div className="mt-2 space-y-1 ml-2 border-l-2 pl-2" style={{ borderColor: colors.border }}>
                  {section.children.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                        isActive(item.path)
                          ? `${colors.activeBg} text-white`
                          : `text-gray-700 ${colors.hover}`
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mt-0.5 ${isActive(item.path) ? 'text-white' : colors.text}`} />
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className={`text-xs ${isActive(item.path) ? 'text-white/70' : 'text-gray-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )})}
        </nav>

        {/* Back to Admin */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="back-to-admin-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Admin</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {logoUrl && !logoErrored ? (
              <img
                src={logoUrl}
                alt={siteName || 'Site logo'}
                className="h-8"
                data-testid="admin-settings-header-logo"
                onError={() => setLogoErrored(true)}
              />
            ) : (
              <span className="font-semibold text-gray-900" data-testid="admin-settings-header-logo-fallback">{siteName || '123Bots'}</span>
            )}
            <span className="text-gray-400">|</span>
            <p className="text-gray-500 text-sm">Configure your business settings</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg" title="View Store">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg" data-testid="profile-dropdown">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                {user?.role === 'super_admin' && (
                  <DropdownMenuItem asChild>
                    <Link to="/dev/settings" className="flex items-center gap-2 cursor-pointer text-blue-600">
                      <Code className="w-4 h-4" />
                      Dev Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <BarChart3 className="w-4 h-4" />
                    Admin Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); navigate('/'); }} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {getCurrentPage()}
        </main>
      </div>

      <Toaster />
    </div>
  );
};

export default AdminSettingsLayout;
