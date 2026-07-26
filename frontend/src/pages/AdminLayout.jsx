import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Tag, Warehouse,
  LogOut, Home, Settings, ChevronRight, ChevronDown, Menu, X, BarChart3,
  Bell, Search, DollarSign, ShoppingBag, Gift, FolderTree, Layers, Cloud, User, Sliders, Code,
  Store, Truck, CreditCard, CheckCircle, LayoutGrid, Clock, FileText, UserPlus, Briefcase,
  Calendar, CalendarOff, Wrench, Shield, BookOpen, PiggyBank, Star, Megaphone, Mail, Zap, MessageCircle, Building2, Box, Globe, Radio as RadioIcon, Key,
  Ticket, MapPin, CalendarDays, Plus, FileSignature, Compass, Sparkles, Anchor, Receipt
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Toaster } from '../components/ui/toaster';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';
import AdminScreensaver from '../components/AdminScreensaver';

// Admin Pages
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminProductEditor from './admin/AdminProductEditor';
import AdminOrders from './admin/AdminOrders';
import AdminCustomers from './admin/AdminCustomers';
import AdminInventory from './admin/AdminInventory';
import AdminDiscounts from './admin/AdminDiscounts';
import AdminSettings from './admin/AdminSettings';
import AdminBusinessSettings from './admin/AdminBusinessSettings';
import AdminCategories from './admin/AdminCategories';
import AdminAbandonedCarts from './admin/AdminAbandonedCarts';
import AdminGiftCards from './admin/AdminGiftCards';
import AdminStorageSettings from './admin/AdminStorageSettings';
import AdminStorage from './admin/AdminStorage';
import AdminRVDashboard from './admin/AdminRVDashboard';
import PointOfSalePage from './pos/PointOfSalePage';
import PeptidesPOSPage from './pos/PawnPOSPage';
import PeptidesContractPOS from './pos/PawnContractPOS';
import AdminSettingsOverview from './admin/AdminSettingsOverview';
import StorageCustomers from './admin/StorageCustomers';
import StorageCustomerDetail from './admin/StorageCustomerDetail';
import StorageRentalsDashboard from './admin/StorageRentalsDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminEditProfile from './admin/AdminEditProfile';
import AdminHumanResources from './admin/AdminHumanResources';
import AdminJobApplications from './admin/AdminJobApplications';
import AdminHRPortal from './admin/AdminHRPortal';
import AdminPeptidesExtended from './admin/AdminPawnExtended';
import AdminPeptidesCompliance from './admin/AdminPawnCompliance';
import AdminEmployeeDetail from './admin/AdminEmployeeDetail';
import AdminShippingSettings from './admin/AdminShippingSettings';
import AdminUserManagement from './admin/AdminUserManagement';
import AdminAccountingDashboard from './admin/AdminAccountingDashboard';
import AdminCustomerDashboard from './admin/AdminCustomerDashboard';
import AdminReviews from './admin/AdminReviews';
import AdminEmailTemplates from './admin/AdminEmailTemplates';
import AdminKnowledgeBase from './admin/AdminKnowledgeBase';
import AdminLeadsKanban from './admin/AdminLeadsKanban';
import AdminPrintfulSettings from './admin/AdminPrintfulSettings';
import AdminYoycolSettings from './admin/AdminYoycolSettings';
import A2GTasksPage from './A2GTasksPage';
import A2GContactsPage from './A2GContactsPage';
import A2GContactDetailPage from './A2GContactDetailPage';
import A2GCalendarPage from './A2GCalendarPage';
import A2GRadioPage from './A2GRadioPage';
import A2GAndGoPage from './A2GAndGoPage';
import A2GBookingSettingsPage from './A2GBookingSettingsPage';
import QuoteBuilderPage from './quotes/QuoteBuilderPage';
import AdminContractsPage from './quotes/AdminContractsPage';
import QuoteWorkspacePage from './quotes/QuoteWorkspacePage';
import QuoteCatalogSettingsPage from './quotes/QuoteCatalogSettingsPage';
import { AdminRadioMiniPlayer } from '../components/admin/AdminRadioMiniPlayer';

// Johnny 5 Portal
import Johnny5Dashboard from './admin/Johnny5Dashboard';
import Johnny5Stores from './admin/Johnny5Stores';
import Johnny5Orders from './admin/Johnny5Orders';
import Johnny5Billing from './admin/Johnny5Billing';
import Johnny5PricingStock from './admin/Johnny5PricingStock';
import Johnny5Products from './admin/Johnny5Products';

// Chat System
import ChatDashboard from './admin/ChatDashboard';
import Johnny5Fulfillment from './admin/Johnny5Fulfillment';
import Johnny5Invoice from './admin/Johnny5Invoice';

// Inventory Management System
import InventoryDashboard from './admin/InventoryDashboard';
import ManufacturersPage from './admin/ManufacturersPage';
import OrderRecommendationsPage from './admin/OrderRecommendationsPage';

// External Stack API
import ExternalApiSourcesPage from './admin/ExternalApiSourcesPage';
import PipelinesPage from './admin/PipelinesPage';

// Event Center
import EventDashboard from './admin/events/EventDashboard';
import EventsList from './admin/events/EventsList';
import EventEditor from './admin/events/EventEditor';
import EventCategories from './admin/events/EventCategories';
import EventVenues from './admin/events/EventVenues';
import EventAttendees from './admin/events/EventAttendees';
import EventTicketsSales from './admin/events/EventTicketsSales';
import EventRevenue from './admin/events/EventRevenue';

// Tours / Charters (Activity & Charter Marketplace)
import ToursChartersDashboard from './admin/tours-charters/ToursChartersDashboard';
import ActivityCategories from './admin/tours-charters/ActivityCategories';
import Activities from './admin/tours-charters/Activities';
import CharterCompanies from './admin/tours-charters/CharterCompanies';
import ToursChartersInvoices from './admin/tours-charters/ToursChartersInvoices';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isAdmin, loading } = useAuth();
  const { logoUrl, siteName } = useSiteSettings();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [expandedSections, setExpandedSections] = useState([]);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [johnny5Settings, setJohnny5Settings] = useState({ show_menu: false, integration_enabled: false });
  const [featureFlagsLoaded, setFeatureFlagsLoaded] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    cart_enabled: true,
    quotes_enabled: true,
    printful_enabled: false,
    yoycol_enabled: false,
    owner_chat_enabled: false,
    owner_chat_ai_enabled: false,
    external_api_enabled: true,
    inventory_enabled: false,
    events_enabled: false,
    events_center_name: 'Event Center',
    activity_marketplace_enabled: false,
  });

  // Fetch business settings for Analytics URL
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [businessRes, johnny5Res, featureFlagsRes] = await Promise.all([
          axios.get(`${API}/settings/business`),
          axios.get(`${API}/settings/johnny5`),
          axios.get(`${API}/settings/feature-flags`),
        ]);

        setBusinessSettings(businessRes.data);
        setJohnny5Settings(johnny5Res.data);
        setFeatureFlags({
          cart_enabled: featureFlagsRes?.data?.cart_enabled !== false,
          quotes_enabled: featureFlagsRes?.data?.quotes_enabled !== false,
          printful_enabled: Boolean(featureFlagsRes?.data?.printful_enabled),
          yoycol_enabled: Boolean(featureFlagsRes?.data?.yoycol_enabled),
          owner_chat_enabled: Boolean(featureFlagsRes?.data?.owner_chat_enabled),
          owner_chat_ai_enabled: Boolean(featureFlagsRes?.data?.owner_chat_ai_enabled),
          external_api_enabled: featureFlagsRes?.data?.external_api_enabled !== false,
          inventory_enabled: Boolean(featureFlagsRes?.data?.inventory_enabled),
          events_enabled: Boolean(featureFlagsRes?.data?.events_enabled),
          events_center_name: featureFlagsRes?.data?.events_center_name || 'Event Center',
          activity_marketplace_enabled: Boolean(featureFlagsRes?.data?.activity_marketplace_enabled),
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setFeatureFlagsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // Construct Analytics URL from business domain
  const getAnalyticsUrl = () => {
    if (!businessSettings?.website) return 'https://a2ganalytics.com';
    // Extract domain from website (remove www., http://, https://)
    let domain = businessSettings.website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
    return `https://a2ganalytics.com/${domain}`;
  };

  // Inactivity timeout hook
  const { showWarning, remainingSeconds, dismissWarning, showScreensaver, dismissScreensaver } = useInactivityTimeout('/admin');

  // Determine which section we're in based on route
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/admin') return 'pawn';
    if (path.startsWith('/admin/cart')) return 'pawn';
    return 'pawn';
  };

  const currentSection = getCurrentSection();
  const cartEnabled = featureFlags.cart_enabled !== false;
  const quotesEnabled = featureFlags.quotes_enabled !== false;

  // Peptides menu structure
  const pawnMenuSections = [
    ...(cartEnabled ? [
      {
        id: 'dashboard',
        type: 'single',
        path: '/admin/cart',
        label: 'Dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'pos',
        type: 'single',
        path: '/admin/cart/pos',
        label: 'POS',
        icon: CreditCard,
      },
      {
        id: 'sales',
        type: 'accordion',
        label: 'Sales',
        icon: DollarSign,
        children: [
          { path: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: stats?.pending_orders },
          { path: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: ShoppingBag },
        ],
      },
      {
        id: 'catalog',
        type: 'accordion',
        label: 'Catalog',
        icon: Layers,
        children: [
          { path: '/admin/products', label: 'Products', icon: Package },
          { path: '/admin/categories', label: 'Categories', icon: FolderTree },
          { path: '/admin/inventory', label: 'Inventory', icon: Warehouse, badge: stats?.low_stock_count },
          { path: '/admin/gift-cards', label: 'Gift Cards', icon: Gift },
        ],
      },
      {
        id: 'shipping',
        type: 'single',
        path: '/admin/shipping',
        label: 'Shipping',
        icon: Truck,
      },
      ...((featureFlags.printful_enabled || featureFlags.yoycol_enabled) ? [{
        id: 'fulfillment',
        type: 'accordion',
        label: 'Fulfillment',
        icon: Box,
        children: [
          ...(featureFlags.printful_enabled ? [{ path: '/admin/fulfillment/printful', label: 'Printful', icon: Store }] : []),
          ...(featureFlags.yoycol_enabled ? [{ path: '/admin/fulfillment/yoycol', label: 'YOYCOL', icon: Globe }] : []),
        ],
      }] : []),
      {
        id: 'marketing',
        type: 'accordion',
        label: 'Marketing',
        icon: Megaphone,
        children: [
          { path: '/admin/discounts', label: 'Discounts', icon: Tag },
          { path: '/admin/reviews', label: 'Reviews', icon: Star },
          { path: '/admin/emails', label: 'System Emails', icon: Mail },
          { href: getAnalyticsUrl(), label: 'Analytics', icon: BarChart3, external: true },
        ],
      },
    ] : []),
    {
      id: 'crm',
      type: 'accordion',
      label: 'CRM',
      icon: Users,
      children: [
        { path: '/admin/leads', label: 'Opportunities', icon: Users },
        { path: '/admin/tasks', label: 'Tasks', icon: CheckCircle },
        ...(cartEnabled ? [{ path: '/admin/user-management/customers', label: 'Customers', icon: Users }] : []),
      ],
    },
    {
      id: 'contacts',
      type: 'single',
      path: '/admin/contacts',
      label: 'Contacts',
      icon: User,
    },
    ...(featureFlags.inventory_enabled ? [{
      id: 'inventory-management',
      type: 'accordion',
      label: 'Inventory Mgmt',
      icon: Warehouse,
      children: [
        { path: '/admin/inventory-management', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/inventory/items', label: 'Stock Levels', icon: Package },
        { path: '/admin/inventory/manufacturers', label: 'Manufacturers', icon: Building2 },
        { path: '/admin/inventory/recommendations', label: 'Order Recs', icon: Truck },
      ],
    }] : []),
    ...(featureFlags.external_api_enabled ? [{
      id: 'external-api',
      type: 'accordion',
      label: 'External API',
      icon: Globe,
      children: [
        { path: '/admin/external-api/sources', label: 'API Sources', icon: Key },
        { path: '/admin/external-api/pipelines', label: 'Pipelines', icon: Layers },
      ],
    }] : []),
    ...(featureFlags.events_enabled ? [{
      id: 'event-center',
      type: 'accordion',
      label: featureFlags.events_center_name || 'Event Center',
      icon: Ticket,
      children: [
        { path: '/admin/events', label: `${featureFlags.events_center_name || 'Event'} Dashboard`, icon: LayoutDashboard },
        { path: '/admin/events/tickets-sales', label: 'Tickets & Sales', icon: Ticket },
        { path: '/admin/events/attendees', label: 'Attendees', icon: Users },
        { path: '/admin/events/list', label: 'Events', icon: CalendarDays },
        { path: '/admin/events/categories', label: 'Event Categories', icon: Tag },
        { path: '/admin/events/new', label: 'Create An Event', icon: Plus },
        { path: '/admin/events/venues', label: 'Venues / Locations', icon: MapPin },
        { path: '/admin/events/revenue', label: 'Revenues & Reports', icon: BarChart3 },
      ],
    }] : []),
    ...(featureFlags.activity_marketplace_enabled ? [{
      id: 'tours-charters',
      type: 'accordion',
      label: 'Tours / Charters',
      icon: Compass,
      children: [
        { path: '/admin/tours-charters', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/tours-charters/categories', label: 'Categories', icon: Tag },
        { path: '/admin/tours-charters/activities', label: 'Activities', icon: Sparkles },
        { path: '/admin/tours-charters/charter-companies', label: 'Charter Companies', icon: Building2 },
        { path: '/admin/tours-charters/invoices', label: 'Invoices', icon: Receipt },
        { external: true, href: 'https://partner.fareharbor.com/login', label: 'Fare Harbor', icon: Anchor },
      ],
    }] : []),
    {
      id: 'calendar',
      type: 'single',
      path: '/admin/calendar',
      label: 'Calendar',
      icon: Calendar,
    },
    {
      id: 'radio',
      type: 'single',
      path: '/admin/radio',
      label: 'Radio',
      icon: RadioIcon,
    },
    {
      id: 'andgo',
      type: 'single',
      path: '/admin/andgo',
      label: 'And...Go',
      icon: Globe,
    },
    {
      id: 'booking',
      type: 'single',
      path: '/admin/booking',
      label: 'Booking',
      icon: Clock,
    },
    ...(quotesEnabled ? [{
      id: 'quotes-contracts-esign',
      type: 'accordion',
      label: 'Quotes',
      icon: FileText,
      children: [
        { path: '/admin/quotes-contracts-esign', label: 'Quote Builder', icon: FileText },
        { path: '/admin/quotes-contracts-esign/contracts', label: 'Contract Documents', icon: FileSignature },
        { path: '/admin/quotes/settings', label: 'Quote Settings', icon: Settings },
      ],
    }] : []),
    {
      id: 'user-management',
      type: 'accordion',
      label: 'User Management',
      icon: Shield,
      children: [
        { path: '/admin/user-management', label: 'Staff', icon: Shield },
        { path: '/admin/user-management/customers', label: 'Customers', icon: Users },
      ],
    },
    {
      id: 'accounting',
      type: 'single',
      path: '/admin/accounting',
      label: 'Accounting',
      icon: PiggyBank,
    },
    // Johnny 5 Portal - conditionally shown based on settings
    ...(cartEnabled && johnny5Settings.show_menu ? [{
      id: 'johnny5',
      type: 'accordion',
      label: 'Johnny 5 Portal',
      icon: Zap,
      children: [
        { path: '/admin/johnny5', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/johnny5/products', label: 'Products', icon: Box },
        { path: '/admin/johnny5/stores', label: 'Connected Stores', icon: Store },
        { path: '/admin/johnny5/orders', label: 'All Orders', icon: Package },
        { path: '/admin/johnny5/fulfillment', label: 'Fulfillment', icon: Truck },
        { path: '/admin/johnny5/pricing-stock', label: 'Pricing & Stock Sheet', icon: FileText },
        { path: '/admin/johnny5/billing', label: 'Store Billing', icon: DollarSign },
      ],
    }] : []),
  ];

  // Bottom menu items (Live Chat & Knowledgebase) - shown above profile
  const bottomMenuItems = [
    ...(featureFlagsLoaded && featureFlags.owner_chat_enabled ? [{
      id: 'chat',
      path: '/admin/chat',
      label: 'Live Chat',
      icon: MessageCircle,
    }] : []),
    {
      id: 'knowledgebase',
      path: '/admin/knowledgebase',
      label: 'Knowledgebase',
      icon: BookOpen,
    },
  ];

  // HR menu structure (separate from other entities)
  const hrMenuSections = [
    {
      id: 'dashboard',
      type: 'single',
      path: '/admin/hr',
      label: 'HR Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'employees',
      type: 'single',
      path: '/admin/hr/employees',
      label: 'Employees',
      icon: Users,
    },
    {
      id: 'timeclock',
      type: 'single',
      path: '/admin/hr/timeclock',
      label: 'Time Clock',
      icon: Clock,
    },
    {
      id: 'schedule',
      type: 'single',
      path: '/admin/hr/schedule',
      label: 'Schedule',
      icon: Calendar,
    },
    {
      id: 'timeoff',
      type: 'single',
      path: '/admin/hr/timeoff',
      label: 'Time Off',
      icon: CalendarOff,
    },
    {
      id: 'payroll',
      type: 'single',
      path: '/admin/hr/payroll',
      label: 'Payroll',
      icon: DollarSign,
    },
    {
      id: 'documents',
      type: 'single',
      path: '/admin/hr/documents',
      label: 'Documents',
      icon: FileText,
    },
    {
      id: 'applications',
      type: 'single',
      path: '/admin/hr/applications',
      label: 'Job Applications',
      icon: UserPlus,
    },
    {
      id: 'portal',
      type: 'single',
      path: '/admin/hr/portal',
      label: 'Employment Portal',
      icon: Briefcase,
    },
  ];

  // Storage menu structure
  const storageMenuSections = [
    {
      id: 'dashboard',
      type: 'single',
      path: '/admin/storage',
      label: 'Storage Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'pos',
      type: 'single',
      path: '/admin/storage/pos',
      label: 'Point of Sale',
      icon: CreditCard,
    },
    {
      id: 'units',
      type: 'accordion',
      label: 'Units',
      icon: Warehouse,
      children: [
        { path: '/admin/storage/sizes', label: 'Unit Sizes', icon: Package },
        { path: '/admin/storage/availability', label: 'Availability', icon: CheckCircle },
      ],
    },
    {
      id: 'rentals',
      type: 'accordion',
      label: 'Rentals',
      icon: DollarSign,
      children: [
        { path: '/admin/storage/rentals', label: 'Active Rentals', icon: ShoppingCart },
        { path: '/admin/storage/customers', label: 'Customers', icon: Users },
      ],
    },
    {
      id: 'reports',
      type: 'single',
      path: '/admin/storage/reports',
      label: 'Reports',
      icon: BarChart3,
    },
  ];

  // RV menu structure
  const rvMenuSections = [
    {
      id: 'dashboard',
      type: 'single',
      path: '/admin/rv',
      label: 'RV Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'jobs',
      type: 'single',
      path: '/admin/rv/jobs',
      label: 'Jobs',
      icon: Wrench,
    },
    {
      id: 'estimates',
      type: 'single',
      path: '/admin/rv/estimates',
      label: 'Estimates',
      icon: FileText,
    },
    {
      id: 'invoices',
      type: 'single',
      path: '/admin/rv/invoices',
      label: 'Invoices',
      icon: DollarSign,
    },
    {
      id: 'services',
      type: 'single',
      path: '/admin/rv/services',
      label: 'Service Catalog',
      icon: Package,
    },
    {
      id: 'customers',
      type: 'single',
      path: '/admin/rv/customers',
      label: 'Customers',
      icon: Users,
    },
  ];

  // Get current menu based on section
  const getMenuSections = () => {
    switch (currentSection) {
      case 'storage': return storageMenuSections;
      case 'rv': return rvMenuSections;
      case 'hr': return hrMenuSections;
      default: return pawnMenuSections;
    }
  };

  const menuSections = getMenuSections();

  // Section colors and titles
  const sectionConfig = {
    pawn: { title: 'Cart Dashboard', color: 'from-blue-600 to-blue-700', icon: Store },
    storage: { title: 'STORAGE', color: 'from-blue-600 to-blue-700', icon: Warehouse },
    rv: { title: 'RV CENTER', color: 'from-blue-600 to-blue-700', icon: Truck },
    hr: { title: 'HUMAN RESOURCES', color: 'from-blue-600 to-blue-700', icon: Briefcase },
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchStats();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/store/analytics/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/admin/cart') return location.pathname === '/admin/cart';
    if (path === '/admin') return location.pathname === '/admin';
    if (path === '/admin/events') return location.pathname === '/admin/events';
    if (path === '/admin/quotes-contracts-esign') return location.pathname === '/admin/quotes-contracts-esign';
    if (path === '/admin/events/new') return location.pathname === '/admin/events/new';
    return location.pathname.startsWith(path);
  };

  const isSectionActive = (section) => {
    if (section.type === 'single') return isActive(section.path);
    return section.children?.some(child => isActive(child.path));
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/admin') return <AdminDashboard />;
    if (path === '/admin/cart') return <AdminDashboard />;
    if (path === '/admin/orders') return <AdminOrders />;
    if (path === '/admin/leads') return <AdminLeadsKanban />;
    if (path === '/admin/tasks') return <A2GTasksPage />;
    if (path === '/admin/contacts') return <A2GContactsPage />;
    if (path.match(/^\/admin\/contacts\/[^/]+$/)) {
      const contactId = path.split('/').pop();
      return <A2GContactDetailPage contactId={contactId} />;
    }
    if (path === '/admin/calendar') return <A2GCalendarPage />;
    if (path === '/admin/radio') return <A2GRadioPage />;
    if (path === '/admin/andgo') return <A2GAndGoPage />;
    if (path === '/admin/booking') return <A2GBookingSettingsPage />;
    if (path === '/admin/quotes-contracts-esign') {
      if (!quotesEnabled) return <div className="p-6 text-sm text-gray-500" data-testid="quotes-disabled-message">Quotes feature is disabled.</div>;
      return <QuoteWorkspacePage />;
    }
    if (path === '/admin/quotes-contracts-esign/contracts') {
      if (!quotesEnabled) return <div className="p-6 text-sm text-gray-500" data-testid="quotes-disabled-contracts-message">Quotes feature is disabled.</div>;
      return <AdminContractsPage />;
    }
    if (path === '/admin/quotes/settings') {
      if (!quotesEnabled) return <div className="p-6 text-sm text-gray-500" data-testid="quotes-disabled-settings-message">Quotes feature is disabled.</div>;
      return <QuoteCatalogSettingsPage />;
    }
    if (path.match(/^\/admin\/leads\/[^/]+\/quote\/new$/)) {
      if (!quotesEnabled) return <div className="p-6 text-sm text-gray-500" data-testid="quotes-disabled-builder-message">Quotes feature is disabled.</div>;
      const segments = path.split('/');
      const leadId = segments[3];
      return <QuoteBuilderPage leadId={leadId} quoteId="new" />;
    }
    if (path.match(/^\/admin\/leads\/[^/]+\/quote\/[^/]+$/)) {
      if (!quotesEnabled) return <div className="p-6 text-sm text-gray-500" data-testid="quotes-disabled-builder-message">Quotes feature is disabled.</div>;
      const segments = path.split('/');
      const leadId = segments[3];
      const quoteId = segments[5];
      return <QuoteBuilderPage leadId={leadId} quoteId={quoteId} />;
    }
    if (path === '/admin/products') return <AdminProducts />;
    if (path === '/admin/products/new') return <AdminProductEditor />;
    if (path.match(/^\/admin\/products\/[^/]+$/)) {
      const productId = path.split('/').pop();
      return <AdminProductEditor productId={productId} />;
    }
    if (path === '/admin/inventory') return <AdminInventory />;
    // Inventory Management System routes
    if (path === '/admin/inventory-management') return <InventoryDashboard />;
    if (path === '/admin/inventory/items') return <AdminInventory />;
    if (path === '/admin/inventory/manufacturers') return <ManufacturersPage />;
    if (path === '/admin/inventory/recommendations') return <OrderRecommendationsPage />;
    if (path === '/admin/inventory/purchase-orders') return <InventoryDashboard />; // Placeholder for now
    if (path === '/admin/inventory/settings') return <InventoryDashboard />; // Placeholder for now
    if (path === '/admin/external-api/sources') return <ExternalApiSourcesPage />;
    if (path === '/admin/external-api/pipelines') return <PipelinesPage />;
    // Event Center routes
    if (path.startsWith('/admin/events')) {
      if (!featureFlagsLoaded) {
        return (
          <div className="flex items-center justify-center min-h-[300px]" data-testid="events-feature-flags-loading">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
          </div>
        );
      }
      if (!featureFlags.events_enabled) return <Navigate to="/admin/cart" replace />;
      if (path === '/admin/events') return <EventDashboard />;
      if (path === '/admin/events/list') return <EventsList />;
      if (path === '/admin/events/new') return <EventEditor />;
      if (path === '/admin/events/tickets-sales') return <EventTicketsSales />;
      if (path === '/admin/events/attendees') return <EventAttendees />;
      if (path === '/admin/events/categories') return <EventCategories />;
      if (path === '/admin/events/venues') return <EventVenues />;
      if (path === '/admin/events/revenue') return <EventRevenue />;
      if (path.match(/^\/admin\/events\/[^/]+$/)) {
        const eventId = path.split('/').pop();
        return <EventEditor key={eventId} eventId={eventId} />;
      }
      return <EventDashboard />;
    }
    // Tours / Charters (Activity & Charter Marketplace) routes
    if (path.startsWith('/admin/tours-charters')) {
      if (!featureFlagsLoaded) {
        return (
          <div className="flex items-center justify-center min-h-[300px]" data-testid="tours-charters-feature-flags-loading">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        );
      }
      if (!featureFlags.activity_marketplace_enabled) return <Navigate to="/admin/cart" replace />;
      if (path === '/admin/tours-charters/categories') return <ActivityCategories />;
      if (path === '/admin/tours-charters/activities') return <Activities />;
      if (path === '/admin/tours-charters/charter-companies') return <CharterCompanies />;
      if (path === '/admin/tours-charters/invoices') return <ToursChartersInvoices />;
      return <ToursChartersDashboard />;
    }
    if (path === '/admin/user-management/customers') return <AdminCustomers />;
    if (path.match(/^\/admin\/user-management\/customers\/[^/]+$/)) {
      const customerId = path.split('/').pop();
      return <AdminCustomerDashboard key={customerId} customerId={customerId} />;
    }
    if (path === '/admin/customers') return <Navigate to="/admin/user-management/customers" replace />;
    if (path.match(/^\/admin\/customers\/[^/]+$/)) {
      const customerId = path.split('/').pop();
      return <Navigate to={`/admin/user-management/customers/${customerId}`} replace />;
    }
    if (path === '/admin/discounts') return <AdminDiscounts />;
    if (path === '/admin/user-management') return <AdminUserManagement />;
    if (path === '/admin/reviews') return <AdminReviews />;
    if (path === '/admin/emails') return <AdminEmailTemplates />;
    if (path === '/admin/accounting') return <AdminAccountingDashboard />;
    // Johnny 5 Portal routes
    if (path === '/admin/johnny5') return <Johnny5Dashboard />;
    if (path === '/admin/johnny5/products') return <Johnny5Products />;
    if (path === '/admin/johnny5/stores') return <Johnny5Stores />;
    if (path === '/admin/johnny5/orders') return <Johnny5Orders />;
    if (path === '/admin/johnny5/fulfillment') return <Johnny5Fulfillment />;
    if (path === '/admin/johnny5/pricing-stock') return <Johnny5PricingStock />;
    if (path === '/admin/johnny5/billing') return <Johnny5Billing />;
    if (path.match(/^\/admin\/johnny5\/invoice\/[^/]+$/)) {
      const orderId = path.split('/').pop();
      return <Johnny5Invoice key={orderId} />;
    }
    // Chat System route
    if (path === '/admin/chat') {
      if (!featureFlagsLoaded) {
        return (
          <div className="flex items-center justify-center min-h-[300px]" data-testid="chat-feature-flags-loading">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        );
      }
      if (!featureFlags.owner_chat_enabled) {
        return <Navigate to="/admin/cart" replace />;
      }
      return <ChatDashboard />;
    }
    if (path === '/admin/knowledgebase') return <AdminKnowledgeBase />;
    if (path === '/admin/settings') return <AdminSettings />;
    if (path === '/admin/settings/dashboard') return <AdminSettingsOverview />;
    if (path === '/admin/settings/storage') return <AdminStorageSettings />;
    if (path === '/admin/business-settings') return <AdminBusinessSettings />;
    if (path === '/admin/categories') return <AdminCategories />;
    if (path === '/admin/abandoned-carts') return <AdminAbandonedCarts />;
    if (path === '/admin/gift-cards') return <AdminGiftCards />;
    if (path === '/admin/shipping') return <AdminShippingSettings />;
    if (path === '/admin/fulfillment/printful') return <AdminPrintfulSettings />;
    if (path === '/admin/fulfillment/yoycol') return <AdminYoycolSettings />;
    if (path === '/admin/users') return <AdminUsers />;
    if (path === '/admin/profile') return <AdminEditProfile />;
    if (path.match(/^\/admin\/hr\/employees\/[^/]+$/)) {
      const empId = path.split('/').pop();
      return <AdminEmployeeDetail key={empId} employeeId={empId} />;
    }
    if (path === '/admin/hr') return <AdminHumanResources initialTab="employees" />;
    if (path === '/admin/hr/employees') return <AdminHumanResources initialTab="employees" />;
    if (path === '/admin/hr/timeclock') return <AdminHumanResources initialTab="timeclock" />;
    if (path === '/admin/hr/schedule') return <AdminHumanResources initialTab="schedule" />;
    if (path === '/admin/hr/timeoff') return <AdminHumanResources initialTab="timeoff" />;
    if (path === '/admin/hr/payroll') return <AdminHumanResources initialTab="payroll" />;
    if (path === '/admin/hr/documents') return <AdminHumanResources initialTab="documents" />;
    if (path === '/admin/hr/applications') return <AdminJobApplications />;
    if (path === '/admin/hr/portal') return <AdminHRPortal />;
    if (path.startsWith('/admin/hr/portal/')) return <AdminHRPortal />;
    if (path === '/admin/storage') return <AdminStorage />;
    if (path === '/admin/storage/rentals') return <StorageRentalsDashboard />;
    if (path === '/admin/storage/pos') return <PointOfSalePage />;
    if (path === '/admin/storage/customers') return <StorageCustomers />;
    if (path.match(/^\/admin\/storage\/customers\/[^/]+$/)) {
      const customerId = path.split('/').pop();
      return <StorageCustomerDetail />;
    }
    if (path === '/admin/cart/pos') return <PeptidesPOSPage />;
    if (path === '/admin/cart/contracts') return <PeptidesContractPOS />;
    // Peptides Extended Services
    if (path === '/admin/cart/loans') return <Navigate to="/admin/cart" replace />;
    if (path === '/admin/cart/check-cashing') return <Navigate to="/admin/cart" replace />;
    if (path === '/admin/cart/layaways') return <AdminPeptidesExtended initialTab="layaways" />;
    if (path === '/admin/cart/resale') return <Navigate to="/admin/cart" replace />;
    if (path === '/admin/cart/atf-holds') return <AdminPeptidesExtended initialTab="atf" />;
    if (path === '/admin/cart/leads') return <AdminPeptidesExtended initialTab="leads" />;
    // Peptides Compliance Features
    if (path === '/admin/cart/gun-log') return <AdminPeptidesCompliance initialTab="gun-log" />;
    if (path === '/admin/cart/dl-scan') return <AdminPeptidesCompliance initialTab="dl-scan" />;
    if (path === '/admin/cart/labels') return <AdminPeptidesCompliance initialTab="labels" />;
    if (path === '/admin/cart/knowledge') return <AdminPeptidesCompliance initialTab="knowledge" />;
    if (path === '/admin/cart/acknowledgments') return <AdminPeptidesCompliance initialTab="acknowledgments" />;
    if (path === '/admin/rv') return <AdminRVDashboard initialTab="dashboard" />;
    if (path === '/admin/rv/jobs') return <AdminRVDashboard initialTab="jobs" />;
    if (path === '/admin/rv/estimates') return <AdminRVDashboard initialTab="estimates" />;
    if (path === '/admin/rv/invoices') return <AdminRVDashboard initialTab="invoices" />;
    if (path === '/admin/rv/services') return <AdminRVDashboard initialTab="services" />;
    if (path.startsWith('/admin/rv/')) return <AdminRVDashboard />;
    return <AdminDashboard />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (
    location.pathname.startsWith('/admin/storage') ||
    location.pathname.startsWith('/admin/rv') ||
    location.pathname.startsWith('/admin/hr')
  ) {
    return <Navigate to="/admin/cart" replace />;
  }

  if (location.pathname === '/admin') {
    return <Navigate to="/admin/cart" replace />;
  }

  // Check if we're on a POS page or landing page - render without sidebar
  const isPosPage = location.pathname === '/admin/cart/pos' || location.pathname === '/admin/cart/contracts';
  const isLandingPage = false;
  
  if (isPosPage || isLandingPage) {
    return (
      <>
        {getCurrentPage()}
        <Toaster />
      </>
    );
  }

  // Inactivity Warning Modal
  const InactivityWarningModal = () => {
    if (!showWarning) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Timeout Warning</h2>
          <p className="text-gray-600 mb-4">
            You've been inactive. The screen will go to sleep in:
          </p>
          <div className="text-5xl font-bold text-blue-600 mb-6">{remainingSeconds}s</div>
          <Button 
            onClick={dismissWarning}
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 hover:opacity-90 text-white"
            data-testid="stay-active-button"
          >
            Stay Active
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex" data-theme="light">
      {/* Screensaver */}
      {showScreensaver && <AdminScreensaver onDismiss={dismissScreensaver} />}
      
      {/* Inactivity Warning Modal */}
      <InactivityWarningModal />

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#0a1929] to-[#0d2847] text-white transition-all duration-300 hidden lg:flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Section Header */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-white/10 bg-gradient-to-r from-blue-600 to-green-500 flex-shrink-0`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              {React.createElement(sectionConfig[currentSection].icon, { className: "w-6 h-6" })}
              <span className="font-bold text-lg">{sectionConfig[currentSection].title}</span>
            </div>
          ) : (
            React.createElement(sectionConfig[currentSection].icon, { className: "w-6 h-6 mx-auto" })
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto flex-1 pb-4">
          {menuSections.map((section) => {
            const activeColor = 'bg-gradient-to-r from-blue-600 to-green-500';
            return (
            <div key={section.id}>
              {section.type === 'single' ? (
                <Link
                  to={section.path}
                  data-testid={`admin-sidebar-link-${section.path.replace(/\//g, '-').replace(/^-+/, '')}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(section.path)
                      ? `${activeColor} text-white shadow-lg shadow-blue-500/30`
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <section.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{section.label}</span>
                      {section.badge > 0 && (
                        <Badge className="bg-green-500 text-white text-xs">{section.badge}</Badge>
                      )}
                    </>
                  )}
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isSectionActive(section)
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <section.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left font-medium">{section.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          expandedSections.includes(section.id) ? 'rotate-180' : ''
                        }`} />
                      </>
                    )}
                  </button>
                  {sidebarOpen && expandedSections.includes(section.id) && (
                    <div className="mt-1 ml-4 pl-4 border-l border-blue-500/40 space-y-1">
                      {section.children.map((child) => (
                        child.external ? (
                          <a
                            key={child.href}
                            href={child.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`admin-sidebar-external-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-gray-400 hover:bg-white/10 hover:text-white"
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{child.label}</span>
                            <ChevronRight className="w-3 h-3 rotate-[-45deg]" />
                          </a>
                        ) : (
                          <Link
                            key={child.path}
                            to={child.path}
                            data-testid={`admin-sidebar-link-${child.path.replace(/\//g, '-').replace(/^-+/, '')}`}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                              isActive(child.path)
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <child.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{child.label}</span>
                            {child.badge > 0 && (
                              <Badge className="bg-red-500 text-white text-xs px-1.5">{child.badge}</Badge>
                            )}
                          </Link>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </nav>

        {/* Bottom Menu Items (Live Chat & Knowledgebase) */}
        <div className="px-4 pb-2 space-y-1 border-t border-white/10 pt-3">
          {bottomMenuItems.map((item) => {
            const activeColor = 'bg-gradient-to-r from-blue-600 to-green-500';
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? `${activeColor} text-white shadow-lg shadow-blue-500/30`
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center mx-auto">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#0a1929] to-[#0d2847] text-white z-50 flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 bg-gradient-to-r from-blue-600 to-green-500">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName || 'Site logo'}
                  className="h-10"
                  data-testid="admin-mobile-header-logo"
                />
              ) : (
                <span className="text-white font-semibold" data-testid="admin-mobile-header-logo-fallback">{siteName || '123Bots'}</span>
              )}
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-1 overflow-y-auto flex-1">
              {menuSections.map((section) => (
                <div key={section.id}>
                  {section.type === 'single' ? (
                    <Link
                      to={section.path}
                      data-testid={`admin-mobile-sidebar-link-${section.path.replace(/\//g, '-').replace(/^-+/, '')}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive(section.path)
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <section.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{section.label}</span>
                      {section.badge > 0 && (
                        <Badge className="bg-green-500 text-white text-xs">{section.badge}</Badge>
                      )}
                    </Link>
                  ) : (
                    <div>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isSectionActive(section)
                            ? 'bg-white/10 text-white'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <section.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left font-medium">{section.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          expandedSections.includes(section.id) ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSections.includes(section.id) && (
                        <div className="mt-1 ml-4 pl-4 border-l border-white/20 space-y-1">
                          {section.children.map((child) => (
                            child.external ? (
                              <a
                                key={child.href}
                                href={child.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileMenuOpen(false)}
                                data-testid={`admin-mobile-sidebar-external-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm text-gray-400 hover:bg-white/10 hover:text-white"
                              >
                                <child.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1">{child.label}</span>
                                <ChevronRight className="w-3 h-3 rotate-[-45deg]" />
                              </a>
                            ) : (
                              <Link
                                key={child.path}
                                to={child.path}
                                data-testid={`admin-mobile-sidebar-link-${child.path.replace(/\//g, '-').replace(/^-+/, '')}`}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                                  isActive(child.path)
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <child.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1">{child.label}</span>
                                {child.badge > 0 && (
                                  <Badge className="bg-green-500 text-white text-xs px-1.5">{child.badge}</Badge>
                                )}
                              </Link>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            {/* Mobile Bottom Menu Items */}
            <div className="px-4 pb-2 space-y-1 border-t border-white/10 pt-3">
              {bottomMenuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              ))}
            </div>
            {/* Mobile User Info */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 min-w-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg" title="View Store">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {stats?.pending_orders > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg" data-testid="profile-dropdown">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                  <Link to="/admin/business-settings" className="flex items-center gap-2 cursor-pointer">
                    <Building2 className="w-4 h-4" />
                    Business Information
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
        <main className="p-4 lg:p-6 overflow-x-hidden">
          {getCurrentPage()}
        </main>
      </div>

      <AdminRadioMiniPlayer />

      <Toaster />
    </div>
  );
};

export default AdminLayout;
