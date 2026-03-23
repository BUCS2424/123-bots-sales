import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Settings, Database, FileText, Globe, ToggleLeft, Mail, MessageSquare,
  Phone, ChevronRight, ChevronDown, ArrowLeft, Lock, Shield,
  Server, Key, Palette, Bell, Users, Webhook, Code, RefreshCw, MapPin, Home, LogOut, User, PiggyBank, Percent, Image, Monitor
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from '../../components/ui/toaster';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// Dev Settings Pages (lazy loaded to avoid circular imports)
import DevGeneralSettings from './DevGeneralConfig';
import DevApiSettings from './DevApiSettings';
import DevWebhookSettings from './DevWebhookSettings';
import DevFeatureFlags from './DevFeatureFlags';
import DevEmailSettings from './DevEmailSettings';
import DevSmsSettings from './DevSmsSettings';
import DevSecuritySettings from './DevSecuritySettings';
import DevBrandingSettings from './DevBrandingSettings';
import DevHeroMediaSettings from './DevHeroMediaSettings';
import DevScreensaverSettings from './DevScreensaverSettings';
import DevLocationGenerator from './DevLocationGenerator';
import DevCommissionSettings from './DevCommissionSettings';
import DevSitemapGenerator from './DevSitemapGenerator';
import AdminAccountingDashboard from '../admin/AdminAccountingDashboard';

const DevSettingsLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState(['platform', 'business']);

  // Menu structure for dev settings
  const menuSections = [
    {
      id: 'platform',
      label: 'Platform',
      children: [
        { path: '/dev/settings', label: 'General Settings', icon: Settings, description: 'Site configuration' },
        { path: '/dev/settings/branding', label: 'Branding', icon: Palette, description: 'Logo, colors & theme' },
        { path: '/dev/settings/hero-media', label: 'Hero Media', icon: Image, description: 'Hero background & video assets' },
        { path: '/dev/settings/screensaver', label: 'Screensaver', icon: Monitor, description: 'Idle overlay images, counts & video' },
        { path: '/dev/settings/features', label: 'Feature Flags', icon: ToggleLeft, description: 'Enable/disable features' },
        { path: '/dev/settings/location-generator', label: 'Location Generator', icon: MapPin, description: 'Generate state/county/city pages' },
        { path: '/dev/settings/sitemap-generator', label: 'Sitemap & SEO', icon: Globe, description: 'Generate & submit sitemaps' },
      ],
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure',
      children: [
        { path: '/dev/settings/api', label: 'API Keys', icon: Key, description: 'API key management' },
        { path: '/dev/settings/webhooks', label: 'Webhooks', icon: Webhook, description: 'Webhook endpoints' },
      ],
    },
    {
      id: 'communications',
      label: 'Communications',
      children: [
        { path: '/dev/settings/email', label: 'Email Settings', icon: Mail, description: 'SMTP & email templates' },
        { path: '/dev/settings/sms', label: 'SMS Settings', icon: MessageSquare, description: 'Twilio SMS configuration' },
      ],
    },
    {
      id: 'integrations',
      label: 'Integrations',
      children: [
        { path: '/dev/settings/security', label: 'Security', icon: Shield, description: 'Auth & security settings' },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      children: [
        { path: '/dev/settings/accounting', label: 'Accounting', icon: PiggyBank, description: 'Revenue, costs & profit analysis' },
        { path: '/dev/settings/commission', label: 'Commission', icon: Percent, description: 'Profit sharing settings' },
      ],
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (path) => {
    if (path === '/dev/settings') return location.pathname === '/dev/settings';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dev/settings') return <DevGeneralSettings />;
    if (path === '/dev/settings/branding') return <DevBrandingSettings />;
    if (path === '/dev/settings/hero-media') return <DevHeroMediaSettings />;
    if (path === '/dev/settings/screensaver') return <DevScreensaverSettings />;
    if (path === '/dev/settings/features') return <DevFeatureFlags />;
    if (path === '/dev/settings/location-generator') return <DevLocationGenerator />;
    if (path === '/dev/settings/sitemap-generator') return <DevSitemapGenerator />;
    if (path === '/dev/settings/api') return <DevApiSettings />;
    if (path === '/dev/settings/webhooks') return <DevWebhookSettings />;
    if (path === '/dev/settings/email') return <DevEmailSettings />;
    if (path === '/dev/settings/sms') return <DevSmsSettings />;
    if (path === '/dev/settings/payments') return <Navigate to="/admin/settings/payments" replace />;
    if (path === '/dev/settings/security') return <DevSecuritySettings />;
    if (path === '/dev/settings/accounting') return <AdminAccountingDashboard />;
    if (path === '/dev/settings/commission') return <DevCommissionSettings />;
    return <DevGeneralSettings />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-[#6e2ea8] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // Only super_admin can access dev settings
  if (user?.role !== 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" data-theme="light" data-testid="dev-settings-layout">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#6e2ea8] to-[#b9893d] rounded-lg">
              <Code className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">DEV TOOLS</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {menuSections.map((section) => (
            <div key={section.id} className="mb-4">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                {section.label}
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedSections.includes(section.id) ? '' : '-rotate-90'}`} />
              </button>
              
              {expandedSections.includes(section.id) && (
                <div className="mt-2 space-y-1">
                  {section.children.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      data-testid={`dev-settings-nav-${item.path.replace(/\//g, '-').replace(/^-+/, '')}`}
                      className={`flex items-start gap-3 px-3 py-3 rounded-lg transition-all ${
                        isActive(item.path)
                          ? 'bg-[#6e2ea8] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mt-0.5 ${isActive(item.path) ? 'text-white' : 'text-gray-500'}`} />
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
          ))}
        </nav>

        {/* Back to Admin */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/admin/cart"
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            data-testid="dev-settings-back-to-pawn-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#6e2ea8]" />
              Dev Settings
            </h1>
            <span className="text-gray-400">|</span>
            <p className="text-gray-500 text-sm">Developer tools and page generation</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="dev-settings-refresh-button"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Super Admin Only</span>
            </div>

            <Link
              to="/admin/cart"
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Dashboard"
              data-testid="dev-settings-home-button"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg"
                  data-testid="dev-settings-profile-dropdown"
                >
                  <div className="w-8 h-8 bg-[#6e2ea8] rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                <DropdownMenuItem asChild>
                  <Link to="/admin/cart" className="flex items-center gap-2 cursor-pointer">
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
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
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
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

export default DevSettingsLayout;
