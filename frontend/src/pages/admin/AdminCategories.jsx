import React, { useMemo, useRef, useState, useEffect } from 'react';
import axios from 'axios';
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Plus,
  Trash2,
  Search,
  Upload,
  Image as ImageIcon,
  GripVertical,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const defaultForm = {
  id: null,
  name: '',
  description: '',
  image: '',
  parent_id: null,
  sort_order: 0,
  is_enabled: true,
  seo_title: '',
  seo_description: '',
  seo_url: '',
  custom_fields: []
};

const asParentId = (value) => value || null;

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [editorMode, setEditorMode] = useState('edit');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [draggingCategoryId, setDraggingCategoryId] = useState(null);
  const [storageConfigured, setStorageConfigured] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const fileInputRef = useRef(null);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeCategories = (rawCategories = []) => {
    return rawCategories.map((category) => ({
      ...category,
      parent_id: asParentId(category.parent_id),
      sort_order: Number.isFinite(category.sort_order) ? category.sort_order : 0,
      is_enabled: category.is_enabled !== false,
      seo_title: category.seo_title || '',
      seo_description: category.seo_description || '',
      seo_url: category.seo_url || '',
      custom_fields: category.custom_fields || []
    }));
  };

  const buildTree = (items) => {
    const grouped = items.reduce((acc, item) => {
      const key = asParentId(item.parent_id);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    const sortNodes = (nodes = []) => [...nodes].sort((a, b) => {
      if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      }
      return a.name.localeCompare(b.name);
    });

    const visit = (parentId = null) => {
      return sortNodes(grouped[parentId]).map((node) => ({
        ...node,
        children: visit(node.id)
      }));
    };

    return visit(null);
  };

  const allTreeNodes = useMemo(() => buildTree(categories), [categories]);

  const filteredTreeNodes = useMemo(() => {
    if (!searchTerm.trim()) {
      return allTreeNodes;
    }

    const query = searchTerm.toLowerCase();

    const filterNode = (node) => {
      const matchingChildren = (node.children || []).map(filterNode).filter(Boolean);
      const isMatch = node.name.toLowerCase().includes(query);
      if (isMatch || matchingChildren.length > 0) {
        return { ...node, children: matchingChildren };
      }
      return null;
    };

    return allTreeNodes.map(filterNode).filter(Boolean);
  }, [allTreeNodes, searchTerm]);

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/store/categories`);
      const normalized = normalizeCategories(response.data);
      setCategories(normalized);

      if (!selectedCategoryId && normalized.length > 0) {
        setSelectedCategoryId(normalized[0].id);
        setEditorMode('edit');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkStorageConfig = async () => {
    try {
      const response = await axios.get(`${API}/storage/settings`, { headers: getHeaders() });
      setStorageConfigured(Boolean(response.data?.bucket_name));
    } catch (error) {
      setStorageConfigured(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    checkStorageConfig();
  }, []);

  useEffect(() => {
    if (editorMode === 'edit' && selectedCategory) {
      setFormData({
        ...defaultForm,
        ...selectedCategory,
        parent_id: asParentId(selectedCategory.parent_id),
        custom_fields: selectedCategory.custom_fields || []
      });
    }
  }, [editorMode, selectedCategory]);

  const flattenIds = (nodes) => {
    const ids = [];
    const walk = (list) => {
      list.forEach((node) => {
        ids.push(node.id);
        walk(node.children || []);
      });
    };
    walk(nodes);
    return ids;
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(flattenIds(allTreeNodes)));
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const toggleExpanded = (categoryId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const selectCategory = (category) => {
    setEditorMode('edit');
    setSelectedCategoryId(category.id);
    setActiveTab('general');
  };

  const startNewCategory = (parentId = null) => {
    setEditorMode('new');
    setSelectedCategoryId(null);
    setActiveTab('general');
    setFormData({
      ...defaultForm,
      parent_id: parentId,
      sort_order: categories.filter((item) => asParentId(item.parent_id) === asParentId(parentId)).length
    });
  };

  const handleAddRootCategory = () => {
    startNewCategory(null);
  };

  const handleAddSubcategory = () => {
    if (!selectedCategory && editorMode !== 'new') {
      toast({ title: 'Select Category', description: 'Select a parent category first.', variant: 'destructive' });
      return;
    }

    const parentId = editorMode === 'new' ? formData.parent_id : selectedCategory?.id;
    startNewCategory(parentId || null);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) {
      toast({ title: 'Select Category', description: 'Select a category to delete.', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(`Delete category "${selectedCategory.name}"? Child categories will move up one level.`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API}/store/categories/${selectedCategory.id}`, { headers: getHeaders() });
      toast({ title: 'Deleted', description: 'Category deleted successfully.' });
      await fetchCategories();
      setSelectedCategoryId(null);
    } catch (error) {
      toast({ title: 'Delete Failed', description: error.response?.data?.detail || 'Could not delete category.', variant: 'destructive' });
    }
  };

  const uploadCategoryImage = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid File', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    if (!storageConfigured) {
      toast({ title: 'Storage Not Configured', description: 'Storage is not configured. Please use image URL.', variant: 'destructive' });
      return;
    }

    setImageUploading(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('folder', 'categories');

      const response = await axios.post(`${API}/storage/upload`, payload, {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData((prev) => ({ ...prev, image: response.data.url }));
      toast({ title: 'Image Uploaded', description: 'Category image uploaded successfully.' });
    } catch (error) {
      toast({ title: 'Upload Failed', description: error.response?.data?.detail || 'Could not upload image.', variant: 'destructive' });
    }
    setImageUploading(false);
  };

  const handleImageDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      uploadCategoryImage(file);
    }
  };

  const persistReorder = async (updatedCategories) => {
    try {
      await axios.post(`${API}/store/categories/reorder`, {
        items: updatedCategories.map((item) => ({
          id: item.id,
          parent_id: asParentId(item.parent_id),
          sort_order: item.sort_order ?? 0
        }))
      }, { headers: getHeaders() });
    } catch (error) {
      toast({ title: 'Reorder Failed', description: 'Could not persist category order.', variant: 'destructive' });
      await fetchCategories();
    }
  };

  const handleDropOnCategory = async (targetCategoryId) => {
    if (!draggingCategoryId || draggingCategoryId === targetCategoryId) return;

    const source = categories.find((item) => item.id === draggingCategoryId);
    const target = categories.find((item) => item.id === targetCategoryId);
    if (!source || !target) return;

    const sourceParentId = asParentId(source.parent_id);
    const targetParentId = asParentId(target.parent_id);

    const updated = categories.map((item) => ({ ...item }));
    const updatedSource = updated.find((item) => item.id === source.id);
    updatedSource.parent_id = targetParentId;

    const resequence = (parentId, insertSource = false) => {
      const siblings = updated
        .filter((item) => asParentId(item.parent_id) === parentId && item.id !== updatedSource.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      if (insertSource) {
        const targetIndex = siblings.findIndex((item) => item.id === target.id);
        const insertAt = targetIndex >= 0 ? targetIndex : siblings.length;
        siblings.splice(insertAt, 0, updatedSource);
      }

      siblings.forEach((item, index) => {
        item.parent_id = parentId;
        item.sort_order = index;
      });
    };

    if (sourceParentId !== targetParentId) {
      resequence(sourceParentId, false);
    }
    resequence(targetParentId, true);

    setCategories(updated);
    setDraggingCategoryId(null);
    await persistReorder(updated);
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Name Required', description: 'Category name is required.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      description: formData.description,
      image: formData.image,
      parent_id: asParentId(formData.parent_id),
      sort_order: formData.sort_order ?? 0,
      is_enabled: formData.is_enabled,
      seo_title: formData.seo_title,
      seo_description: formData.seo_description,
      seo_url: formData.seo_url,
      custom_fields: formData.custom_fields || []
    };

    try {
      if (editorMode === 'new') {
        const response = await axios.post(`${API}/store/categories`, payload, { headers: getHeaders() });
        toast({ title: 'Created', description: 'Category created successfully.' });
        setSelectedCategoryId(response.data.id);
        setEditorMode('edit');
      } else if (selectedCategoryId) {
        await axios.put(`${API}/store/categories/${selectedCategoryId}`, payload, { headers: getHeaders() });
        toast({ title: 'Saved', description: 'Category updated successfully.' });
      }

      await fetchCategories();
    } catch (error) {
      toast({ title: 'Save Failed', description: error.response?.data?.detail || 'Could not save category.', variant: 'destructive' });
    }

    setSaving(false);
  };

  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedCategoryId === node.id && editorMode === 'edit';

    return (
      <div key={node.id} className="space-y-1">
        <div
          draggable
          onDragStart={() => setDraggingCategoryId(node.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDropOnCategory(node.id)}
          onClick={() => selectCategory(node)}
          className={`group flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer transition-colors ${isSelected ? 'bg-purple-100 border border-purple-200' : 'hover:bg-gray-100 border border-transparent'}`}
          style={{ marginLeft: `${depth * 14}px` }}
          data-testid={`category-tree-node-${node.id}`}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (hasChildren) toggleExpanded(node.id);
            }}
            className="h-5 w-5 flex items-center justify-center text-gray-500"
            data-testid={`category-tree-toggle-${node.id}`}
          >
            {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />) : <span className="w-4" />}
          </button>

          <GripVertical className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm text-gray-800 flex-1 truncate" data-testid={`category-tree-name-${node.id}`}>{node.name}</span>
          <Badge variant="outline" className="text-[10px]" data-testid={`category-tree-count-${node.id}`}>{node.product_count || 0}</Badge>
        </div>

        {hasChildren && isExpanded && (
          <div data-testid={`category-tree-children-${node.id}`}>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const pageTitle = editorMode === 'new'
    ? 'New Category'
    : selectedCategory
      ? `"${selectedCategory.name}" category`
      : 'Select a Category';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="categories-loading-state">
        <div className="animate-spin w-8 h-8 border-4 border-[rgb(37, 99, 235)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="admin-categories-page">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleAddRootCategory} className="bg-[rgb(37, 99, 235)] hover:bg-[#552483]" data-testid="add-root-category-button">
          <Plus className="w-4 h-4 mr-2" /> Add Root Category
        </Button>
        <Button variant="outline" onClick={handleAddSubcategory} data-testid="add-subcategory-button">
          <Plus className="w-4 h-4 mr-2" /> Add Subcategory
        </Button>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDeleteCategory} data-testid="delete-category-button">
          <Trash2 className="w-4 h-4 mr-2" /> Delete Category
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        <Card data-testid="categories-tree-panel">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderTree className="w-5 h-5 text-[rgb(37, 99, 235)]" /> Categories
            </CardTitle>
            <CardDescription>Drag and drop items to sort</CardDescription>

            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search categories"
                className="pl-9"
                data-testid="category-tree-search-input"
              />
            </div>

            <div className="flex items-center gap-2 text-xs pt-1">
              <button className="text-[rgb(37, 99, 235)] hover:underline" onClick={handleCollapseAll} data-testid="collapse-all-categories-button">Collapse All</button>
              <span className="text-gray-300">|</span>
              <button className="text-[rgb(37, 99, 235)] hover:underline" onClick={handleExpandAll} data-testid="expand-all-categories-button">Expand All</button>
            </div>
          </CardHeader>

          <CardContent className="max-h-[70vh] overflow-y-auto space-y-1" data-testid="categories-tree-list">
            {filteredTreeNodes.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="categories-tree-empty-state">No categories found.</p>
            ) : filteredTreeNodes.map((node) => renderTreeNode(node, 0))}
          </CardContent>
        </Card>

        <Card data-testid="category-editor-panel">
          <CardHeader>
            <CardTitle data-testid="category-editor-title">{pageTitle}</CardTitle>
            <div className="flex items-center gap-4 border-b pt-1" data-testid="category-editor-tabs">
              <button
                className={`pb-2 text-sm border-b-2 ${activeTab === 'general' ? 'border-[rgb(37, 99, 235)] text-[rgb(37, 99, 235)] font-semibold' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('general')}
                data-testid="category-tab-general-button"
              >
                General
              </button>
              <button
                className={`pb-2 text-sm border-b-2 ${activeTab === 'products' ? 'border-[rgb(37, 99, 235)] text-[rgb(37, 99, 235)] font-semibold' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('products')}
                data-testid="category-tab-products-button"
              >
                Category products
              </button>
              <button
                className={`pb-2 text-sm border-b-2 ${activeTab === 'seo' ? 'border-[rgb(37, 99, 235)] text-[rgb(37, 99, 235)] font-semibold' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('seo')}
                data-testid="category-tab-seo-button"
              >
                SEO
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {activeTab === 'general' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4">
                  <div>
                    <Label htmlFor="category-name-input" className="mb-1 block">Name</Label>
                    <Input
                      id="category-name-input"
                      value={formData.name}
                      onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                      data-testid="category-name-input"
                    />
                  </div>

                  <div className="rounded-md border bg-gray-50 p-3" data-testid="category-availability-panel">
                    <Label className="mb-2 block">Availability</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_enabled}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_enabled: checked }))}
                        data-testid="category-enabled-switch"
                      />
                      <span className={`text-sm font-medium ${formData.is_enabled ? 'text-green-600' : 'text-gray-500'}`} data-testid="category-enabled-text">
                        {formData.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Category Image</Label>
                  <div className="border rounded-md p-4" data-testid="category-image-card">
                    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center">
                      <div className="w-full aspect-square rounded-md bg-gray-100 border flex items-center justify-center overflow-hidden" data-testid="category-image-preview-box">
                        {formData.image ? (
                          <img src={formData.image} alt="Category" className="w-full h-full object-cover" data-testid="category-image-preview" />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-gray-300" />
                        )}
                      </div>

                      <div
                        className="border-2 border-dashed rounded-md p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleImageDrop}
                        data-testid="category-image-dropzone"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            if (event.target.files?.[0]) {
                              uploadCategoryImage(event.target.files[0]);
                            }
                            event.target.value = '';
                          }}
                        />
                        <p className="text-sm font-medium text-gray-700 mb-3">Upload/change category image</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageUploading}
                            data-testid="choose-category-image-button"
                          >
                            {imageUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            Choose File
                          </Button>
                          <Input
                            value={formData.image || ''}
                            placeholder="Or paste image URL"
                            onChange={(event) => setFormData((prev) => ({ ...prev, image: event.target.value }))}
                            data-testid="category-image-url-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category-description-input" className="mb-1 block">Description</Label>
                  <Textarea
                    id="category-description-input"
                    rows={5}
                    placeholder="What is this category about?"
                    value={formData.description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                    data-testid="category-description-input"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveCategory} disabled={saving} className="bg-[rgb(37, 99, 235)] hover:bg-[#552483]" data-testid="save-category-button">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editorMode === 'new' ? 'Create Category' : 'Save Category'}
                  </Button>
                </div>
              </>
            )}

            {activeTab === 'products' && (
              <div className="rounded-md border bg-gray-50 p-5" data-testid="category-products-tab-placeholder">
                <p className="text-sm text-gray-600">Category product assignment panel can be added next.</p>
              </div>
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4" data-testid="category-seo-tab-panel">
                <p className="text-sm text-gray-600">SEO tab scaffolded. Full advanced setup can be expanded next.</p>
                <div>
                  <Label htmlFor="category-seo-title-input" className="mb-1 block">SEO Title</Label>
                  <Input
                    id="category-seo-title-input"
                    value={formData.seo_title}
                    onChange={(event) => setFormData((prev) => ({ ...prev, seo_title: event.target.value }))}
                    data-testid="category-seo-title-input"
                  />
                </div>
                <div>
                  <Label htmlFor="category-seo-description-input" className="mb-1 block">SEO Description</Label>
                  <Textarea
                    id="category-seo-description-input"
                    rows={3}
                    value={formData.seo_description}
                    onChange={(event) => setFormData((prev) => ({ ...prev, seo_description: event.target.value }))}
                    data-testid="category-seo-description-input"
                  />
                </div>
                <div>
                  <Label htmlFor="category-seo-url-input" className="mb-1 block">SEO URL</Label>
                  <Input
                    id="category-seo-url-input"
                    value={formData.seo_url}
                    onChange={(event) => setFormData((prev) => ({ ...prev, seo_url: event.target.value }))}
                    data-testid="category-seo-url-input"
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSaveCategory} disabled={saving} className="bg-[rgb(37, 99, 235)] hover:bg-[#552483]" data-testid="save-category-seo-button">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save SEO
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCategories;
