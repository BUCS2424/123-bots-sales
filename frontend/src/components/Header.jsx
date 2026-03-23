import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, Phone, Mail, LogIn, User, Facebook, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { Button } from './ui/button';
import CartDrawer from './CartDrawer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Default static menu as fallback - URLs must match actual routes
const defaultNavLinks = [
  { path: '/shop', label: 'PRINTABLES', hasDropdown: true, items: [
    { path: '/shop?category=coffee-mugs', label: 'Coffee Mugs' },
    { path: '/shop?category=t-shirts', label: 'T-Shirts' },
    { path: '/shop?category=on-canvas', label: 'On Canvas' },
    { path: '/shop?category=patches', label: 'Patches' },
    { path: '/shop?category=stickers', label: 'Stickers' },
    { path: '/shop?category=flags', label: 'Flags' },
    { path: '/shop?category=tumblers', label: 'Tumblers' },
  ]},
  { path: '/shop?category=special', label: 'SPECIAL', hasDropdown: false },
  { path: '/shop?category=collections', label: 'COLLECTIONS', hasDropdown: true, items: [
    { path: '/shop?category=cancer-support-group', label: 'Cancer Support' },
    { path: '/shop?category=hawaiian-prints', label: 'Hawaiian Prints' },
    { path: '/shop?category=vision-of-the-seas', label: 'Vision Of The Seas' },
  ]},
  { path: '/shop?category=holidays', label: 'HOLIDAYS', hasDropdown: false },
  { path: '/contact', label: 'CONTACT' },
];

// Convert API menu structure to Header format
const convertApiMenuToNavLinks = (apiMenu) => {
  if (!apiMenu || apiMenu.length === 0) return null;
  
  return apiMenu.map(item => ({
    path: item.url,
    label: item.label,
    hasDropdown: item.children && item.children.length > 0,
    items: item.children ? item.children.map(child => ({
      path: child.url,
      label: child.label,
    })) : [],
    openInNewTab: item.open_in_new_tab,
  }));
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dynamicMenu, setDynamicMenu] = useState(null);
  const { getCartCount, toggleCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const siteSettings = useSiteSettings();
  const location = useLocation();
  const cartCount = getCartCount();
  const supportEmail = siteSettings.supportEmail || 'info@gingerkare.com';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch dynamic menu from API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/mega-menu/navigation`);
        const converted = convertApiMenuToNavLinks(response.data.menu);
        if (converted && converted.length > 0) {
          setDynamicMenu(converted);
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
        // Silently fail - will use default menu
      }
    };
    fetchMenu();
  }, []);

  // Use dynamic menu if available, otherwise fall back to static
  const navLinks = dynamicMenu || defaultNavLinks;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      {/* Top Bar - Warm themed */}
      <div className="bg-gradient-to-r from-[#2c1810] to-[#3a1f12] text-white py-2.5 px-4" data-testid="top-bar">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <a 
              href={`mailto:${supportEmail}`} 
              className="flex items-center gap-2 hover:text-[#ff8c42] transition-colors group"
              data-testid="email-link"
            >
              <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-[#ff8c42] transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium">{supportEmail}</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://www.facebook.com/gingerkare.collectibles" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-300 hover:text-[#00bfff] transition-colors"
            >
              <Facebook className="w-4 h-4" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
            <span className="hidden sm:inline text-slate-600">|</span>
            {isAuthenticated ? (
              <Link 
                to="/admin" 
                className="flex items-center gap-2 hover:text-[#ff8c42] transition-colors"
                data-testid="admin-link"
              >
                <div className="w-7 h-7 bg-[#ff8c42] rounded-full flex items-center justify-center text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:inline font-medium">{user?.name || 'Dashboard'}</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center gap-2 hover:text-[#ff8c42] transition-colors"
                data-testid="login-link"
              >
                <LogIn className="w-4 h-4" />
                <span className="font-medium">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header 
        className={`bg-[#1a0f0a] sticky top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'shadow-lg py-2' : 'shadow-sm py-3'
        }`}
        data-testid="main-header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center group" data-testid="logo-link">
              <img
                src={siteSettings.logoUrl}
                alt={siteSettings.siteName}
                className={`transition-all duration-300 ${isScrolled ? 'h-14 md:h-16' : 'h-16 md:h-20'}`}
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <div key={link.path} className="relative group">
                  {link.openInNewTab ? (
                    <a
                      href={link.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative px-4 py-2.5 font-medium text-[14px] transition-all duration-200 rounded-lg flex items-center gap-1 text-white hover:text-[#00bfff]`}
                      data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                      {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                    </a>
                  ) : (
                    <Link
                      to={link.path}
                      className={`relative px-4 py-2.5 font-medium text-[14px] transition-all duration-200 rounded-lg flex items-center gap-1 ${
                        isActive(link.path)
                          ? 'text-[#ff8c42]'
                          : 'text-white hover:text-[#00bfff]'
                      }`}
                      data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                      {link.hasDropdown && <ChevronDown className="w-4 h-4" />}
                      <span 
                        className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-[#ff8c42] transition-all duration-300 rounded-full ${
                          isActive(link.path) ? 'w-6' : 'w-0 group-hover:w-4'
                        }`}
                      />
                    </Link>
                  )}
                  {/* Dropdown menu */}
                  {link.hasDropdown && link.items && link.items.length > 0 && (
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-[#2c1810] border border-[#ff8c42]/20 rounded-xl shadow-xl py-2 min-w-[200px]">
                        {link.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="block px-4 py-2 text-white hover:text-[#ff8c42] hover:bg-white/5 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Get Quote Button - Desktop */}
              <Link to="/contact" className="hidden lg:block">
                <Button 
                  className="bg-[#ff8c42] hover:bg-[#ff6b1a] text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  data-testid="cta-button"
                >
                  Get a Quote
                </Button>
              </Link>

              {/* Cart Button */}
              <Button
                variant="outline"
                size="icon"
                className="relative border-[#ff8c42]/30 text-white hover:border-[#ff8c42] hover:text-[#ff8c42] rounded-lg w-11 h-11 transition-all bg-transparent"
                onClick={toggleCart}
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#ff8c42] text-white text-xs font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full shadow-sm animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/10 rounded-lg w-11 h-11"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div 
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              isMobileMenuOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <nav className="pb-4 border-t border-[#ff8c42]/20 pt-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-[#ff8c42] text-white'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  )}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-[#ff8c42]/20">
                <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#ff8c42] hover:bg-[#ff6b1a] text-white py-3 rounded-xl font-semibold">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </header>

      <CartDrawer />
    </>
  );
};

export default Header;
