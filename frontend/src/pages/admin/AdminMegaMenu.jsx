import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronRight, X, Save,
  Link as LinkIcon, FolderTree, FileText, Tag, Image, ExternalLink,
  Search, Eye, EyeOff, Columns, Settings
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { useToast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Icon options for menu items
const ICON_OPTIONS = [
  { value: 'Link', label: 'Link' },
  { value: 'Home', label: 'Home' },
  { value: 'ShoppingBag', label: 'Shopping Bag' },
  { value: 'Tag', label: 'Tag' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Star', label: 'Star' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Package', label: 'Package' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Mail', label: 'Mail' },
  { value: 'Info', label: 'Info' },
  { value: 'HelpCircle', label: 'Help' },
  { value: 'FileText', label: 'Document' },
  { value: 'Calendar', label: 'Calendar' },
  { value: 'Users', label: 'Users' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Percent', label: 'Percent' },
  { value: 'Sparkles', label: 'Sparkles' },
  { value: 'Flame', label: 'Flame' },
  { value: 'Coffee', label: 'Coffee' },
  { value: 'Shirt', label: 'Shirt' },
  { value: 'Image', label: 'Image' },
  { value: 'Palette', label: 'Palette' },
  { value: 'Flag', label: 'Flag' },
];

// Robots directive options
const ROBOTS_OPTIONS = [
  { value: 'index, follow', label: 'index, follow (Default)' },
  { value: 'noindex, follow', label: 'noindex, follow' },
  { value: 'index, nofollow', label: 'index, nofollow' },
  { value: 'noindex, nofollow', label: 'noindex, nofollow' },
];

const defaultFormData = {
  label: '',
  icon: 'Link',
  url: '',
  description: '',
  parent_id: null,
  column: 0,
  open_in_new_tab: false,
  is_active: true,
  link_type: 'custom',
  linked_entity_id: null,
  image_url: '',
  badge_text: '',
  badge_color: '',
  seo: {
    page_title: '',
    slug: '',
    meta_description: '',
    meta_keywords: '',
    canonical_url: '',
    og_title: '',
    og_image_url: '',
    og_description: '',
    robots_directive: 'index, follow',
  },
};

const AdminMegaMenu = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [showSeoFields, setShowSeoFields] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());

  const getToken = () => localStorage.getItem('token');

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mega-menu/items`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setMenuItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load menu items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mega-menu/categories`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchPages = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mega-menu/pages`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setPages(response.data.pages || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchPages();
  }, [fetchMenuItems, fetchCategories, fetchPages]);

  // Build tree structure from flat list
  const buildMenuTree = (items, parentId = null) => {
    return items
      .filter((item) => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        ...item,
        children: buildMenuTree(items, item.id),
      }));
  };

  const menuTree = buildMenuTree(menuItems);

  const openAddModal = (parentId = null) => {
    setEditingItem(null);
    setFormData({ ...defaultFormData, parent_id: parentId });
    setShowSeoFields(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      ...defaultFormData,
      ...item,
      seo: { ...defaultFormData.seo, ...(item.seo || {}) },
    });
    setShowSeoFields(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.label.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Label is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.url.trim()) {
      toast({
        title: 'Validation Error',
        description: 'URL is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingItem) {
        await axios.put(
          `${API_URL}/api/mega-menu/items/${editingItem.id}`,
          formData,
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        toast({ title: 'Success', description: 'Menu item updated' });
      } else {
        await axios.post(`${API_URL}/api/mega-menu/items`, formData, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        toast({ title: 'Success', description: 'Menu item created' });
      }
      setIsModalOpen(false);
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save menu item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item and all its sub-items?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/mega-menu/items/${itemId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast({ title: 'Success', description: 'Menu item deleted' });
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete menu item',
        variant: 'destructive',
      });
    }
  };

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

  const handleLinkTypeChange = (linkType) => {
    setFormData((prev) => ({
      ...prev,
      link_type: linkType,
      linked_entity_id: null,
      url: linkType === 'custom' ? prev.url : '',
    }));
  };

  const handleLinkedEntityChange = (entityId) => {
    let url = '';
    if (formData.link_type === 'category') {
      const category = categories.find((c) => c.id === entityId);
      url = category ? `/shop?category=${category.seo_url || category.name.toLowerCase().replace(/\s+/g, '-')}` : '';
    } else if (formData.link_type === 'page') {
      const page = pages.find((p) => p.id === entityId);
      url = page?.url || '';
    }
    setFormData((prev) => ({
      ...prev,
      linked_entity_id: entityId,
      url,
    }));
  };

  // Render a menu item row
  const renderMenuItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id} data-testid={`menu-item-${item.id}`}>
        <div
          className={`flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg mb-2 hover:border-[rgb(37, 99, 235)]/50 transition-colors`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab flex-shrink-0" />
          
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 truncate">{item.label}</span>
              {!item.is_active && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                  Hidden
                </span>
              )}
              {item.badge_text && (
                <span
                  className="px-2 py-0.5 text-xs text-white rounded"
                  style={{ backgroundColor: item.badge_color || 'rgb(37, 99, 235)' }}
                >
                  {item.badge_text}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="truncate">{item.url}</span>
              {item.open_in_new_tab && (
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openAddModal(item.id)}
              className="h-8 w-8 p-0"
              title="Add sub-menu"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditModal(item)}
              className="h-8 w-8 p-0"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Render children */}
        {hasChildren && isExpanded && (
          <div>
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get parent menu items for dropdown (exclude current item and its children)
  const getAvailableParents = () => {
    if (!editingItem) return menuItems.filter((item) => !item.parent_id);
    
    const excludeIds = new Set([editingItem.id]);
    const addChildIds = (parentId) => {
      menuItems
        .filter((item) => item.parent_id === parentId)
        .forEach((child) => {
          excludeIds.add(child.id);
          addChildIds(child.id);
        });
    };
    addChildIds(editingItem.id);

    return menuItems.filter((item) => !excludeIds.has(item.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-[rgb(37, 99, 235)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-mega-menu">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mega Menu Builder</h1>
          <p className="text-gray-500 mt-1">
            Create and manage your website navigation with support for multi-column mega menus
          </p>
        </div>
        <Button
          onClick={() => openAddModal()}
          className="bg-[rgb(37, 99, 235)] hover:bg-[rgb(29, 78, 216)] text-white"
          data-testid="add-menu-item-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Menu Items List */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        {menuTree.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-4">
              Click "Add Menu Item" to create your first navigation item
            </p>
            <Button
              onClick={() => openAddModal()}
              variant="outline"
              className="border-[rgb(37, 99, 235)] text-[rgb(37, 99, 235)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {menuTree.map((item) => renderMenuItem(item))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: e.target.value }))
                  }
                  placeholder="About Us"
                  data-testid="menu-item-label-input"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, icon: value }))
                  }
                >
                  <SelectTrigger id="icon">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Link Type */}
            <div>
              <Label>Link Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {[
                  { value: 'custom', label: 'Custom URL', icon: LinkIcon },
                  { value: 'category', label: 'Category', icon: Tag },
                  { value: 'page', label: 'Site Page', icon: FileText },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleLinkTypeChange(type.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                      formData.link_type === type.value
                        ? 'border-[rgb(37, 99, 235)] bg-[rgb(37, 99, 235)]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* URL / Entity Selection */}
            {formData.link_type === 'custom' ? (
              <div>
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="/about or https://example.com"
                  data-testid="menu-item-url-input"
                />
              </div>
            ) : formData.link_type === 'category' ? (
              <div>
                <Label>Select Category</Label>
                <Select
                  value={formData.linked_entity_id || ''}
                  onValueChange={handleLinkedEntityChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.url && (
                  <p className="text-sm text-gray-500 mt-1">URL: {formData.url}</p>
                )}
              </div>
            ) : (
              <div>
                <Label>Select Page</Label>
                <Select
                  value={formData.linked_entity_id || ''}
                  onValueChange={handleLinkedEntityChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.url && (
                  <p className="text-sm text-gray-500 mt-1">URL: {formData.url}</p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description for tooltip or footer"
                rows={2}
              />
            </div>

            {/* Parent Menu Item */}
            <div>
              <Label>Parent Menu Item (for sub-menus)</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    parent_id: value === 'none' ? null : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (top level)</SelectItem>
                  {getAvailableParents().map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column & Settings Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="column">Column (for mega menu)</Label>
                <Select
                  value={String(formData.column)}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, column: parseInt(value) }))
                  }
                >
                  <SelectTrigger id="column">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Column 1</SelectItem>
                    <SelectItem value="1">Column 2</SelectItem>
                    <SelectItem value="2">Column 3</SelectItem>
                    <SelectItem value="3">Column 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="open_in_new_tab" className="cursor-pointer">
                    Open in new tab
                  </Label>
                  <Switch
                    id="open_in_new_tab"
                    checked={formData.open_in_new_tab}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, open_in_new_tab: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Active
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* SEO Settings Collapsible */}
            <Collapsible open={showSeoFields} onOpenChange={setShowSeoFields}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">SEO Settings</span>
                  </div>
                  <span className="text-sm text-[rgb(37, 99, 235)]">
                    {showSeoFields ? 'Hide SEO Fields' : 'Show SEO Fields'}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seo_page_title">Page Title</Label>
                    <Input
                      id="seo_page_title"
                      value={formData.seo?.page_title || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, page_title: e.target.value },
                        }))
                      }
                      placeholder="SEO page title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo_slug">URL Alias / Slug</Label>
                    <Input
                      id="seo_slug"
                      value={formData.seo?.slug || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, slug: e.target.value },
                        }))
                      }
                      placeholder="custom-url-slug"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="seo_meta_description">Meta Description</Label>
                  <Textarea
                    id="seo_meta_description"
                    value={formData.seo?.meta_description || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, meta_description: e.target.value },
                      }))
                    }
                    placeholder="Brief description for search engines (150-160 chars)"
                    rows={2}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {(formData.seo?.meta_description || '').length}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="seo_meta_keywords">Meta Keywords</Label>
                  <Input
                    id="seo_meta_keywords"
                    value={formData.seo?.meta_keywords || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, meta_keywords: e.target.value },
                      }))
                    }
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_canonical_url">Canonical URL</Label>
                  <Input
                    id="seo_canonical_url"
                    value={formData.seo?.canonical_url || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, canonical_url: e.target.value },
                      }))
                    }
                    placeholder="https://example.com/canonical-page"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seo_og_title">OG Title (Social Share)</Label>
                    <Input
                      id="seo_og_title"
                      value={formData.seo?.og_title || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, og_title: e.target.value },
                        }))
                      }
                      placeholder="Title for social media"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seo_og_image_url">OG Image URL</Label>
                    <Input
                      id="seo_og_image_url"
                      value={formData.seo?.og_image_url || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          seo: { ...prev.seo, og_image_url: e.target.value },
                        }))
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="seo_og_description">OG Description</Label>
                  <Textarea
                    id="seo_og_description"
                    value={formData.seo?.og_description || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, og_description: e.target.value },
                      }))
                    }
                    placeholder="Description for social media shares"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="seo_robots">Robots Directive</Label>
                  <Select
                    value={formData.seo?.robots_directive || 'index, follow'}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        seo: { ...prev.seo, robots_directive: value },
                      }))
                    }
                  >
                    <SelectTrigger id="seo_robots">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROBOTS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[rgb(37, 99, 235)] hover:bg-[rgb(29, 78, 216)] text-white"
                data-testid="save-menu-item-btn"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMegaMenu;
