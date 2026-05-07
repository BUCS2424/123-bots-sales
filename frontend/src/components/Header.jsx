import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Phone, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useSiteFeatureFlags } from '../hooks/useSiteFeatureFlags';
import CartDrawer from './CartDrawer';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { cartItems } = useCart();
  const { logoUrl } = useSiteSettings();
  const { cart_enabled, pawn_checkout } = useSiteFeatureFlags();

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location]);

  const forceDarkHeader = location.pathname === '/shop' || location.pathname.startsWith('/shop') || location.pathname === '/categories';

  const navigation = [
    {
      label: 'INDUSTRIES',
      items: [
        { label: 'HEALTHCARE', href: '/industries/healthcare' },
        { label: 'RETAIL', href: '/industries/retail-uses' },
        { label: 'WAREHOUSES', href: '/industries/warehouses' },
        { label: 'HOSPITALITY', href: '/industries/hospitality' },
        { label: 'EVENTS & STADIUMS', href: '/industries/events-stadiums' },
        { label: 'EDUCATION', href: '/industries/education' },
      ],
    },
    ...(cart_enabled ? [{ label: 'PARTS', href: '/shop/products?category=parts' }] : []),
    { label: 'SUPPORT', href: '/contact' },
    {
      label: 'PRODUCTS',
      href: '/products',
      twoColumn: true,
      columns: [
        {
          title: 'Commercial Cleaning Bots',
          items: [
            { label: 'PUDU BG1 PRO', href: '/products/pudu-bg1' },
            { label: 'AVIDBOTS NEO', href: '/products/avidbots-neo' },
            { label: 'AVIDBOT KAS', href: '/products/ab-kas' },
            { label: 'PUDU CC1 PRO', href: '/products/pudu-cc1-pro' },
            { label: 'PUDU MT1 MAX', href: '/products/pudu-mt1' },
            { label: 'PUDU MT1 VAC', href: '/products/pudu-mt1-vac' },
            { label: 'PUDU SH1', href: '/products/pudu-sh1' },
            { label: 'GAUSIUM MIRA', href: '/products/gausium-mira' },
          ],
        },
        {
          title: 'Industrial Delivery Bots',
          items: [
            { label: 'FLASHBOT MAX', href: '/products/flashbot-max' },
            { label: 'PUDU T300', href: '/products/pudu-t300' },
            { label: 'PUDU T600', href: '/products/pudu-t600' },
          ],
        },
      ],
    },
  ];

  const handleDropdownToggle = (label) => {
    setActiveDropdown(activeDropdown === label ? null : label);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || forceDarkHeader
            ? 'bg-bots-dark/95 backdrop-blur-md shadow-lg' 
            : 'bg-transparent'
        }`}
        data-testid="main-header"
      >
        {/* Top Bar */}
        <div className="bg-bots-surface/80 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-sm">
            <a 
              href="tel:8777022687" 
              className="flex items-center text-white hover:text-blue-400 transition-colors"
              data-testid="header-phone"
            >
              <Phone className="w-4 h-4 mr-2" />
              (877) 702-2687
            </a>
            <div className="flex items-center space-x-4">
              {cart_enabled && (
                <>
                  <Link
                    to="/shop"
                    className="text-gray-300 hover:text-white transition-colors"
                    data-testid="header-shop-link"
                  >
                    Shop
                  </Link>
                  <span className="text-gray-600">|</span>
                </>
              )}
              <Link 
                to="/123-bots-resources" 
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="header-resources-link"
              >
                Resources
              </Link>
              <span className="text-gray-600">|</span>
              <a
                href="https://www.facebook.com/123bots"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="header-facebook-link"
              >
                Facebook
              </a>
              <span className="text-gray-600">|</span>
              <Link 
                to="/login" 
                className="text-gray-300 hover:text-white transition-colors"
                data-testid="header-login-link"
              >
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center" data-testid="header-logo">
              {logoUrl ? (
                <img src={logoUrl} alt="123 Bots" className="h-10 md:h-12" />
              ) : (
                <span className="text-2xl font-bold text-white">123 Bots</span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <div key={item.label} className="relative group">
                  {(item.items || item.columns) ? (
                    <>
                      {item.href ? (
                        <Link
                          to={item.href}
                          className="flex items-center px-4 py-2 text-white hover:text-blue-400 transition-colors font-medium"
                          data-testid={`nav-${item.label.toLowerCase()}`}
                        >
                          {item.label}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </Link>
                      ) : (
                        <button
                          className="flex items-center px-4 py-2 text-white hover:text-blue-400 transition-colors font-medium"
                          onClick={() => handleDropdownToggle(item.label)}
                          data-testid={`nav-${item.label.toLowerCase()}`}
                        >
                          {item.label}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                      )}
                      {/* Dropdown */}
                      {item.twoColumn ? (
                        <div className="absolute top-full left-0 w-[500px] bg-bots-surface border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mt-1 p-4">
                          <div className="grid grid-cols-2 gap-6">
                            {item.columns.map((column, idx) => (
                              <div key={idx}>
                                <h3 className="text-blue-400 font-bold text-sm mb-3 pb-2 border-b border-gray-700 whitespace-nowrap">
                                  {column.title}
                                </h3>
                                {column.items.map((subItem) => (
                                  <Link
                                    key={subItem.label}
                                    to={subItem.href}
                                    className="block px-2 py-2 text-gray-300 hover:text-white hover:bg-blue-500/20 transition-colors rounded"
                                    data-testid={`nav-item-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                                  >
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="absolute top-full left-0 w-56 bg-bots-surface border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 mt-1">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.label}
                              to={subItem.href}
                              className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-blue-500/20 transition-colors first:rounded-t-lg last:rounded-b-lg"
                              data-testid={`nav-item-${subItem.label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className="px-4 py-2 text-white hover:text-blue-400 transition-colors font-medium"
                      data-testid={`nav-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Schedule Demo Button */}
              <Link
                to="/schedule-a-demo"
                className="hidden md:inline-flex px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-500 transition-colors"
                data-testid="nav-schedule-demo"
              >
                SCHEDULE A DEMO
              </Link>

              {/* Buy or Lease Button */}
              <Link
                to="/rent-or-buy-a-cleaning-bot"
                className="hidden lg:inline-flex px-6 py-2 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition-colors"
                data-testid="nav-buy-lease"
              >
                BUY OR LEASE
              </Link>

              {/* Cart Button */}
              {cart_enabled && pawn_checkout && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-white hover:text-blue-400 transition-colors"
                  data-testid="cart-button"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-white"
                data-testid="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-bots-dark border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
              {navigation.map((item) => (
                <div key={item.label} className="border-b border-gray-800 last:border-b-0">
                  {(item.items || item.columns) ? (
                    <>
                      <button
                        className="flex items-center justify-between w-full py-3 text-white font-medium"
                        onClick={() => handleDropdownToggle(item.label)}
                      >
                        {item.label}
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${
                            activeDropdown === item.label ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      {activeDropdown === item.label && (
                        <div className="pb-3 pl-4 space-y-2">
                          {item.twoColumn ? (
                            item.columns.map((column, idx) => (
                              <div key={idx} className="mb-4">
                                <h3 className="text-blue-400 font-bold text-sm mb-2">
                                  {column.title}
                                </h3>
                                {column.items.map((subItem) => (
                                  <Link
                                    key={subItem.label}
                                    to={subItem.href}
                                    className="block py-2 text-gray-400 hover:text-white transition-colors"
                                  >
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            ))
                          ) : (
                            item.items.map((subItem) => (
                              <Link
                                key={subItem.label}
                                to={subItem.href}
                                className="block py-2 text-gray-400 hover:text-white transition-colors"
                              >
                                {subItem.label}
                              </Link>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className="block py-3 text-white font-medium"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile CTA Buttons */}
              <div className="mt-4 space-y-3">
                <Link
                  to="/schedule-a-demo"
                  className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-full text-center hover:bg-blue-500 transition-colors"
                >
                  SCHEDULE A DEMO
                </Link>
                <Link
                  to="/rent-or-buy-a-cleaning-bot"
                  className="block w-full py-3 bg-green-500 text-black font-semibold rounded-full text-center hover:bg-green-400 transition-colors"
                >
                  BUY OR LEASE
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;
