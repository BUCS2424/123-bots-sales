import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Search, Mail, Facebook, User, LogIn, UserPlus, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Top utility bar component
const TopBar = ({ businessInfo }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const emailDisplay = businessInfo?.email || 'info@gingerkare.com';

  return (
    <div className="bg-gradient-to-r from-[#2c1810] to-[#3a1f12] border-b border-[#ff8c42]/20 py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        {/* Left side - Contact info */}
        <div className="flex items-center gap-6">
          <a href={`mailto:${emailDisplay}`} className="flex items-center gap-2 text-slate-300 hover:text-[#ff8c42] transition-colors duration-300">
            <Mail className="w-4 h-4 text-[#ff8c42]" />
            <span className="hidden sm:inline">{emailDisplay}</span>
          </a>
        </div>

        {/* Center - Social */}
        <div className="hidden lg:flex items-center gap-6 text-slate-300">
          <a 
            href="https://www.facebook.com/gingerkare.collectibles" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#00bfff] transition-colors"
          >
            <Facebook className="w-4 h-4" />
            <span>Follow Us</span>
          </a>
        </div>

        {/* Right side - Auth */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link 
                to={user?.role === 'super_admin' || user?.role === 'admin' ? '/admin' : '/account'}
                className="hidden sm:flex items-center gap-2 text-slate-300 hover:text-[#ff8c42] transition-colors duration-300"
                data-testid="topbar-user-link"
              >
                <User className="w-4 h-4 text-[#ff8c42]" />
                <span className="hover:underline">{user?.name || user?.email}</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-slate-300 hover:text-red-400 transition-colors duration-300"
                data-testid="topbar-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="flex items-center gap-2 text-slate-300 hover:text-[#ff8c42] transition-colors duration-300"
                data-testid="topbar-login"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link 
                to="/register" 
                className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white rounded-full hover:shadow-lg hover:shadow-[#ff8c42]/20 transition-all duration-300 font-medium text-xs uppercase tracking-wider"
                data-testid="topbar-register"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const FloatingNav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dynamicNavLinks, setDynamicNavLinks] = useState(null);
  const location = useLocation();
  const { cartItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const siteSettings = useSiteSettings();
  
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch business settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const businessRes = await axios.get(`${API_URL}/api/settings/business`);
        setBusinessInfo(businessRes.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Fetch dynamic menu from mega menu API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/mega-menu/navigation`);
        const menu = response.data.menu || [];
        if (menu.length > 0) {
          // Convert API menu structure to FloatingNav format
          const converted = menu.map(item => ({
            name: item.label,
            href: item.url,
            hasDropdown: item.children && item.children.length > 0,
            items: item.children ? item.children.map(child => ({
              name: child.label,
              href: child.url,
            })) : [],
          }));
          setDynamicNavLinks(converted);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      }
    };
    fetchMenu();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Default nav links (fallback)
  const defaultNavLinks = [
    { 
      name: 'Printables', 
      href: '/shop',
      hasDropdown: true,
      items: [
        { name: 'Coffee Mugs', href: '/shop?category=coffee-mugs' },
        { name: 'T-Shirts', href: '/shop?category=t-shirts' },
        { name: 'On Canvas', href: '/shop?category=on-canvas' },
        { name: 'Patches', href: '/shop?category=patches' },
        { name: 'Stickers', href: '/shop?category=stickers' },
        { name: 'Flags', href: '/shop?category=flags' },
        { name: 'Tumblers', href: '/shop?category=tumblers' },
      ]
    },
    { 
      name: 'Special', 
      href: '/shop?category=special',
      hasDropdown: false,
      items: []
    },
    { 
      name: 'Collections', 
      href: '/shop?category=collections',
      hasDropdown: true,
      items: [
        { name: 'Cancer Support', href: '/shop?category=cancer-support-group' },
        { name: 'Hawaiian Prints', href: '/shop?category=hawaiian-prints' },
        { name: 'Vision Of The Seas', href: '/shop?category=vision-of-the-seas' },
      ]
    },
    { 
      name: 'Holidays', 
      href: '/shop?category=holidays',
      hasDropdown: false,
      items: []
    },
    { name: 'Contact', href: '/contact' },
  ];

  // Use dynamic menu if available, otherwise fallback
  const navLinks = dynamicNavLinks || defaultNavLinks;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/') || location.search.includes(path.split('?')[1] || '___');

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* Top utility bar - fixed at very top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBar businessInfo={businessInfo} />
      </div>

      {/* Main navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-[41px] left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled 
            ? 'bg-[#1a0f0a]/95 backdrop-blur-xl shadow-lg shadow-[#ff8c42]/10 border-b border-[#ff8c42]/20' 
            : 'bg-[#1a0f0a]/80 backdrop-blur-xl border-b border-white/5'
        }`}
        data-testid="floating-nav"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group"
            data-testid="nav-logo"
          >
            <img
              src={siteSettings.logoUrl}
              alt={siteSettings.siteName}
              className="h-12 md:h-16 w-auto object-contain group-hover:drop-shadow-[0_0_15px_rgba(255,140,66,0.4)] transition-all duration-300"
              data-testid="nav-logo-image"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div 
                key={link.name} 
                className="relative group"
                onMouseEnter={() => link.hasDropdown && setOpenDropdown(link.name)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to={link.href}
                  data-testid={`nav-link-${link.name.toLowerCase()}`}
                  className={`relative px-4 py-2.5 text-sm font-semibold tracking-wide uppercase transition-all duration-300 flex items-center gap-1 ${
                    isActive(link.href)
                      ? 'text-[#ff8c42]'
                      : 'text-slate-300 hover:text-[#00bfff]'
                  }`}
                >
                  {link.name}
                  {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                  {isActive(link.href) && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent via-[#ff8c42] to-transparent"
                    />
                  )}
                </Link>
                
                {/* Dropdown menu */}
                {link.hasDropdown && (
                  <AnimatePresence>
                    {openDropdown === link.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 pt-2"
                      >
                        <div className="bg-[#2c1810] border border-[#ff8c42]/20 rounded-xl shadow-xl py-2 min-w-[200px]">
                          {link.items.map((item) => (
                            <Link
                              key={item.href}
                              to={item.href}
                              className="block px-4 py-2 text-white hover:text-[#ff8c42] hover:bg-white/5 transition-colors"
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button 
              className="p-2.5 rounded-lg text-slate-400 hover:text-[#ff8c42] hover:bg-white/5 transition-all duration-300"
              data-testid="nav-search-btn"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link
              to="/checkout"
              className="relative p-2.5 rounded-lg text-slate-400 hover:text-[#ff8c42] hover:bg-white/5 transition-all duration-300"
              data-testid="nav-cart-btn"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#ff8c42] to-[#ff6b1a] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg shadow-[#ff8c42]/30"
                >
                  {cartCount}
                </motion.span>
              )}
            </Link>

            {/* Get Quote Button - Desktop */}
            <Link
              to="/contact"
              className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-[#ff8c42]/30 transition-all duration-300"
            >
              Get a Quote
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg text-slate-400 hover:text-[#ff8c42] hover:bg-white/5 transition-all duration-300"
              data-testid="nav-mobile-menu-btn"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-[105px] left-4 right-4 z-30 bg-[#2c1810]/95 backdrop-blur-xl border border-[#ff8c42]/20 rounded-lg p-4 md:hidden shadow-2xl"
            data-testid="mobile-menu"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all duration-300 ${
                    isActive(link.href)
                      ? 'bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white'
                      : 'text-slate-300 hover:text-[#ff8c42] hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-[#ff8c42]/20 mt-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-sm text-slate-300">
                      Signed in as {user?.name || user?.email}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-slate-300 hover:text-[#ff8c42] hover:bg-white/5 transition-colors duration-300"
                    >
                      <LogIn className="w-4 h-4" />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white mt-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Emporium Banner - Elegant warm tone */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0f0a]/95 backdrop-blur-md border-t border-[#ff8c42]/30 py-2.5 px-4">
        <p className="text-center text-xs font-mono text-[#ff8c42] tracking-[0.15em] uppercase">
          Custom Printables • Unique Gifts • Made with ❤️
        </p>
      </div>
    </>
  );
};

export default FloatingNav;
