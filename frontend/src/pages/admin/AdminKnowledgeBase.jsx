import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Search, BookOpen, Plus, Edit2, Save, X, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const API = process.env.REACT_APP_BACKEND_URL;

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'user', label: 'User' },
];

const emptyEditor = {
  id: null,
  title: '',
  category: 'Getting Started',
  summary: '',
  content: '',
  tags: '',
  visibility_roles: ['super_admin', 'admin', 'staff'],
};

const AdminKnowledgeBase = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  const [editor, setEditor] = useState(emptyEditor);

  const selectedArticle = useMemo(
    () => articles.find((article) => article.id === selectedArticleId) || null,
    [articles, selectedArticleId]
  );

  const loadKnowledgebase = async () => {
    setLoading(true);
    try {
      const [articlesRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/api/knowledgebase/articles`, { params: { search, category } }),
        axios.get(`${API}/api/knowledgebase/categories`),
      ]);

      const fetchedArticles = articlesRes.data?.articles || [];
      setArticles(fetchedArticles);
      setCategories(categoriesRes.data?.categories || []);

      if (!selectedArticleId && fetchedArticles.length > 0) {
        setSelectedArticleId(fetchedArticles[0].id);
      }

      if (selectedArticleId && !fetchedArticles.some((item) => item.id === selectedArticleId)) {
        setSelectedArticleId(fetchedArticles[0]?.id || null);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load knowledgebase.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledgebase();
  }, [search, category]);

  const openCreateEditor = () => {
    setEditorMode('create');
    setEditor(emptyEditor);
    setEditorOpen(true);
  };

  const openEditEditor = (article) => {
    setEditorMode('edit');
    setEditor({
      id: article.id,
      title: article.title,
      category: article.category,
      summary: article.summary,
      content: article.content,
      tags: (article.tags || []).join(', '),
      visibility_roles: article.visibility_roles || ['super_admin', 'admin', 'staff'],
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditor(emptyEditor);
  };

  const toggleRole = (role) => {
    setEditor((prev) => {
      const exists = prev.visibility_roles.includes(role);
      const visibility_roles = exists
        ? prev.visibility_roles.filter((item) => item !== role)
        : [...prev.visibility_roles, role];
      return { ...prev, visibility_roles };
    });
  };

  const saveArticle = async () => {
    if (!editor.title.trim() || !editor.category.trim() || !editor.summary.trim() || !editor.content.trim()) {
      toast({ title: 'Missing Fields', description: 'Title, category, summary, and content are required.', variant: 'destructive' });
      return;
    }

    const payload = {
      title: editor.title.trim(),
      category: editor.category.trim(),
      summary: editor.summary.trim(),
      content: editor.content.trim(),
      tags: editor.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      visibility_roles: editor.visibility_roles,
    };

    setSaving(true);
    try {
      if (editorMode === 'create') {
        await axios.post(`${API}/api/knowledgebase/articles`, payload);
        toast({ title: 'Article Created', description: 'Knowledgebase article has been added.' });
      } else {
        await axios.put(`${API}/api/knowledgebase/articles/${editor.id}`, payload);
        toast({ title: 'Article Updated', description: 'Knowledgebase article has been updated.' });
      }
      closeEditor();
      await loadKnowledgebase();
    } catch (error) {
      toast({ title: 'Save Failed', description: error.response?.data?.detail || 'Could not save article.', variant: 'destructive' });
    }
    setSaving(false);
  };

  const reseedKnowledgebase = async () => {
    if (!window.confirm('Reseed knowledgebase? This will replace existing articles.')) return;
    try {
      await axios.post(`${API}/api/knowledgebase/seed`);
      toast({ title: 'Reseeded', description: 'Knowledgebase has been reseeded successfully.' });
      await loadKnowledgebase();
    } catch (error) {
      toast({ title: 'Reseed Failed', description: 'Could not reseed articles.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-5" data-testid="admin-knowledgebase-page">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2" data-testid="knowledgebase-title">
                <BookOpen className="w-5 h-5 text-[#6e2ea8]" /> Backend Knowledgebase
              </CardTitle>
              <CardDescription data-testid="knowledgebase-description">
                Search operational guides for store owners and employees. Content visibility follows user role access.
              </CardDescription>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={reseedKnowledgebase} data-testid="knowledgebase-reseed-button">
                  Reseed Docs
                </Button>
                <Button className="bg-[#6e2ea8] hover:bg-[#552483]" onClick={openCreateEditor} data-testid="knowledgebase-add-article-button">
                  <Plus className="w-4 h-4 mr-2" /> Add Article
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, content, or tags"
                className="pl-9"
                data-testid="knowledgebase-search-input"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="knowledgebase-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.name} value={item.name}>{item.name} ({item.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
        <Card data-testid="knowledgebase-articles-list-panel">
          <CardHeader>
            <CardTitle className="text-base">Articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[68vh] overflow-y-auto">
            {loading ? (
              <p className="text-sm text-gray-500" data-testid="knowledgebase-loading">Loading...</p>
            ) : articles.length === 0 ? (
              <p className="text-sm text-gray-500" data-testid="knowledgebase-empty">No articles found.</p>
            ) : articles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticleId(article.id)}
                className={`w-full text-left rounded-md border p-3 transition-colors ${selectedArticleId === article.id ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'}`}
                data-testid={`knowledgebase-article-list-item-${article.id}`}
              >
                <p className="font-medium text-sm text-gray-900">{article.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.summary}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
                  {(article.tags || []).slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">#{tag}</Badge>
                  ))}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="knowledgebase-article-detail-panel">
          <CardHeader>
            {selectedArticle ? (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle data-testid="knowledgebase-article-title">{selectedArticle.title}</CardTitle>
                  <CardDescription data-testid="knowledgebase-article-summary">{selectedArticle.summary}</CardDescription>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" data-testid="knowledgebase-article-category">{selectedArticle.category}</Badge>
                    {(selectedArticle.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs" data-testid={`knowledgebase-article-tag-${tag}`}>#{tag}</Badge>
                    ))}
                  </div>
                </div>

                {isAdmin && (
                  <Button variant="outline" size="sm" onClick={() => openEditEditor(selectedArticle)} data-testid="knowledgebase-edit-article-button">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}
              </div>
            ) : (
              <CardTitle className="text-base">Select an article</CardTitle>
            )}
          </CardHeader>

          <CardContent>
            {selectedArticle ? (
              <article className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700" data-testid="knowledgebase-article-content">
                {selectedArticle.content}
              </article>
            ) : (
              <p className="text-sm text-gray-500" data-testid="knowledgebase-no-selection">Choose an article from the left to view details.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {editorOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" data-testid="knowledgebase-editor-modal">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="knowledgebase-editor-title">
                  {editorMode === 'create' ? 'Create Knowledgebase Article' : 'Edit Knowledgebase Article'}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={closeEditor} data-testid="knowledgebase-editor-close-button">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editor.title} onChange={(e) => setEditor((prev) => ({ ...prev, title: e.target.value }))} data-testid="knowledgebase-editor-title-input" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Input value={editor.category} onChange={(e) => setEditor((prev) => ({ ...prev, category: e.target.value }))} data-testid="knowledgebase-editor-category-input" />
                </div>
                <div>
                  <Label>Tags (comma separated)</Label>
                  <Input value={editor.tags} onChange={(e) => setEditor((prev) => ({ ...prev, tags: e.target.value }))} data-testid="knowledgebase-editor-tags-input" />
                </div>
              </div>

              <div>
                <Label>Summary</Label>
                <Textarea rows={2} value={editor.summary} onChange={(e) => setEditor((prev) => ({ ...prev, summary: e.target.value }))} data-testid="knowledgebase-editor-summary-input" />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea rows={10} value={editor.content} onChange={(e) => setEditor((prev) => ({ ...prev, content: e.target.value }))} data-testid="knowledgebase-editor-content-input" />
              </div>

              <div>
                <Label className="flex items-center gap-2"><Shield className="w-4 h-4" /> Visibility Roles</Label>
                <div className="flex flex-wrap gap-2 mt-2" data-testid="knowledgebase-editor-roles">
                  {roleOptions.map((role) => {
                    const active = editor.visibility_roles.includes(role.value);
                    return (
                      <button
                        key={role.value}
                        onClick={() => toggleRole(role.value)}
                        className={`px-3 py-1.5 rounded border text-sm ${active ? 'bg-purple-100 border-purple-300 text-purple-700' : 'bg-white border-gray-200 text-gray-600'}`}
                        data-testid={`knowledgebase-role-chip-${role.value}`}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={closeEditor} data-testid="knowledgebase-editor-cancel-button">Cancel</Button>
                <Button onClick={saveArticle} className="bg-[#6e2ea8] hover:bg-[#552483]" disabled={saving} data-testid="knowledgebase-editor-save-button">
                  <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Article'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <p className="text-xs text-gray-500" data-testid="knowledgebase-role-hint">
        Signed in as <strong>{user?.role || 'unknown'}</strong>. You only see articles allowed for your role.
      </p>
    </div>
  );
};

export default AdminKnowledgeBase;
