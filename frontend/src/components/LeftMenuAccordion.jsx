import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LeftMenuAccordion = ({ onCategorySelect, currentCategory, categories = [] }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/mega-menu/navigation`);
        setMenuItems(response.data.menu || []);
        // Auto-expand first item with children
        const firstWithChildren = (response.data.menu || []).find(item => item.children && item.children.length > 0);
        if (firstWithChildren) {
          setExpandedItems(new Set([firstWithChildren.id]));
        }
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const toggleExpand = (itemId) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const isActive = (item) => {
    // Check if current category matches this item's linked category
    if (currentCategory && item.linked_category_name && currentCategory === item.linked_category_name) {
      return true;
    }
    
    // Check if current category matches the item label
    if (currentCategory && currentCategory === item.label) return true;
    
    // Check URL params
    const urlCategory = searchParams.get('category');
    if (urlCategory && item.url && item.url.includes(`category=${urlCategory}`)) return true;
    
    return location.pathname === item.url;
  };

  const handleItemClick = (e, item) => {
    // If this item is linked to a category (via mega menu admin), use the resolved category name
    if (onCategorySelect && item.link_type === 'category' && item.linked_category_name) {
      e.preventDefault(); // Prevent navigation, just filter
      onCategorySelect(item.linked_category_name);
      return;
    }
    
    // Fallback: try to extract category from URL for manually configured items
    if (onCategorySelect && item.url) {
      const urlParams = new URLSearchParams(item.url.split('?')[1] || '');
      const categorySlug = urlParams.get('category');
      
      if (categorySlug) {
        e.preventDefault(); // Prevent navigation, just filter
        
        // Try to find matching category name from the categories list
        const matchedCategory = categories.find(cat => {
          if (cat === 'All') return false;
          const catSlug = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          return catSlug === categorySlug || 
                 cat.toLowerCase() === categorySlug.toLowerCase() ||
                 cat.toLowerCase().replace(/\s+/g, '') === categorySlug.toLowerCase().replace(/-/g, '');
        });
        
        // Use matched category name, item label, or let it navigate
        if (matchedCategory) {
          onCategorySelect(matchedCategory);
        } else {
          // No match found - try the item label as category name
          onCategorySelect(item.label);
        }
      }
    }
  };

  const handleParentClick = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    if (hasChildren) {
      toggleExpand(item.id);
    } else if (onCategorySelect) {
      // For parent items without children, show all products
      onCategorySelect('All');
    }
  };

  const handleClearFilter = () => {
    if (onCategorySelect) {
      onCategorySelect('All');
    }
  };

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        <div className="h-12 bg-[#2c1810]/50 rounded mb-2"></div>
        <div className="h-48 bg-[#1a0f0a]/50 rounded mb-2"></div>
        <div className="h-12 bg-[#2c1810]/50 rounded mb-2"></div>
        <div className="h-12 bg-[#2c1810]/50 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full" data-testid="left-menu-accordion">
      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-white border border-[#ff8c42]/30 rounded text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#ff8c42] focus:ring-2 focus:ring-[#ff8c42]/20 transition-all text-base"
            data-testid="left-menu-search"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ff8c42]" />
        </div>
      </div>

      {/* Show All Products Button - when a category is selected */}
      {currentCategory && currentCategory !== 'All' && (
        <button
          onClick={handleClearFilter}
          className="w-full mb-3 px-4 py-2.5 bg-[#1a0f0a] hover:bg-[#2c1810] text-[#ff8c42] font-semibold text-sm rounded transition-colors flex items-center justify-center gap-2"
          data-testid="clear-category-filter"
        >
          <span>Show All Products</span>
          <span className="text-xs opacity-70">({currentCategory})</span>
        </button>
      )}

      {/* Accordion Menu */}
      <div className="overflow-hidden rounded-lg">
        {menuItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.has(item.id);

          return (
            <div key={item.id}>
              {/* Main Menu Item - Orange/Brown Header */}
              <button
                onClick={() => handleParentClick(item)}
                className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] hover:from-[#ff6b1a] hover:to-[#e55a0a] transition-all"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="text-white font-bold text-sm tracking-wider">
                  {item.label}
                </span>
                {hasChildren && (
                  <span className="text-white font-light text-xl">
                    {isExpanded ? '−' : '+'}
                  </span>
                )}
              </button>

              {/* Sub-items - Dark Brown Background */}
              {hasChildren && isExpanded && (
                <div className="bg-[#2c1810]">
                  {item.children
                    .filter(child => 
                      !searchQuery || child.label.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((child) => {
                      const isChildActive = isActive(child);
                      
                      return (
                        <Link
                          key={child.id}
                          to={child.url}
                          onClick={(e) => handleItemClick(e, child)}
                          className={`group block relative transition-all ${
                            isChildActive ? 'bg-[#3a1f12]' : 'hover:bg-[#3a1f12]'
                          }`}
                          data-testid={`submenu-item-${child.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {/* Orange Left Border */}
                          <span 
                            className={`absolute left-0 top-0 bottom-0 w-1.5 bg-[#ff8c42] transition-opacity ${
                              isChildActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          />
                          <span className={`block pl-6 pr-4 py-3.5 font-semibold text-sm tracking-wider transition-colors ${
                            isChildActive ? 'text-[#ff8c42]' : 'text-white group-hover:text-[#ff8c42]'
                          }`}>
                            {child.label}
                          </span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeftMenuAccordion;
