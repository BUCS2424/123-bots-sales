import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Star, Search, Filter, Trash2, Check, X, Eye, Edit2,
  ChevronDown, AlertCircle, CheckCircle, Clock, RefreshCw,
  MessageSquare, User, Calendar, Package
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, seeded
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviews, setSelectedReviews] = useState([]);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  
  // Seed modal state
  const [seedModalOpen, setSeedModalOpen] = useState(false);
  const [seedCount, setSeedCount] = useState(200);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/reviews/admin?limit=200`;
      
      if (filter === 'pending') url += '&status=pending';
      else if (filter === 'approved') url += '&status=approved';
      else if (filter === 'rejected') url += '&status=rejected';
      else if (filter === 'seeded') url += '&is_seeded=true';
      else if (filter === 'real') url += '&is_seeded=false';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ title: 'Error', description: 'Failed to load reviews', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reviews/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/reviews/admin/${reviewId}`, 
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: 'Review approved' });
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve review', variant: 'destructive' });
    }
  };

  const handleReject = async (reviewId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/reviews/admin/${reviewId}`, 
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: 'Review rejected' });
      fetchReviews();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject review', variant: 'destructive' });
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/reviews/admin/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Review deleted' });
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reviews/admin/bulk-approve`, 
        selectedReviews,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: `Approved ${selectedReviews.length} reviews` });
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to bulk approve', variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) return;
    if (!window.confirm(`Delete ${selectedReviews.length} selected reviews?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reviews/admin/bulk-delete`, 
        selectedReviews,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: `Deleted ${selectedReviews.length} reviews` });
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to bulk delete', variant: 'destructive' });
    }
  };

  const handleSeedReviews = async () => {
    setSeeding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/reviews/admin/seed?count=${seedCount}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: response.data.message });
      setSeedModalOpen(false);
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to seed reviews', variant: 'destructive' });
    }
    setSeeding(false);
  };

  const handleClearSeeded = async () => {
    if (!window.confirm('Delete ALL seeded (fake) reviews? Real customer reviews will be kept.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/reviews/admin/clear-seeded`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: response.data.message });
      fetchReviews();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clear seeded reviews', variant: 'destructive' });
    }
  };

  const handleToggleFeatured = async (review) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/reviews/admin/${review.id}`, 
        { is_featured: !review.is_featured },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: review.is_featured ? 'Removed from featured' : 'Added to featured' });
      fetchReviews();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/reviews/admin/${editingReview.id}`, {
        title: editingReview.title,
        content: editingReview.content,
        rating: editingReview.rating
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: 'Review updated' });
      setEditModalOpen(false);
      fetchReviews();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update review', variant: 'destructive' });
    }
  };

  const toggleSelectReview = (reviewId) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return review.customer_name?.toLowerCase().includes(query) ||
             review.content?.toLowerCase().includes(query) ||
             review.title?.toLowerCase().includes(query);
    }
    return true;
  });

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-500">Manage customer reviews and testimonials</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSeedModalOpen(true)}>
            Seed Reviews
          </Button>
          <Button variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={handleClearSeeded}>
            🗑️ Delete All FAKE Reviews
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total_reviews}</p>
                  <p className="text-sm text-gray-500">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.fake_reviews || 0}</p>
                  <p className="text-sm text-orange-600 font-medium">FAKE Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.real_reviews || 0}</p>
                  <p className="text-sm text-emerald-600 font-medium">Real Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avg_rating}</p>
                  <p className="text-sm text-gray-500">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.five_star}</p>
                  <p className="text-sm text-gray-500">5-Star</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.four_star}</p>
                  <p className="text-sm text-gray-500">4-Star</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="pending">⏳ Pending Approval</SelectItem>
                <SelectItem value="approved">✅ Approved</SelectItem>
                <SelectItem value="rejected">❌ Rejected</SelectItem>
                <SelectItem value="seeded">⚠️ FAKE Reviews Only</SelectItem>
                <SelectItem value="real">✓ Real Customer Reviews</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchReviews}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
          
          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <span className="text-sm text-gray-600">{selectedReviews.length} selected</span>
              <Button size="sm" onClick={handleBulkApprove}>
                <Check className="w-4 h-4 mr-1" /> Approve Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reviews found</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Header row */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500">
                <input
                  type="checkbox"
                  checked={selectedReviews.length === filteredReviews.length && filteredReviews.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
                <div className="flex-1">Review</div>
                <div className="w-24">Rating</div>
                <div className="w-24">Status</div>
                <div className="w-32">Actions</div>
              </div>
              
              {filteredReviews.map((review) => (
                <div key={review.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review.id)}
                    onChange={() => toggleSelectReview(review.id)}
                    className="mt-1 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{review.customer_name}</span>
                      {review.is_seeded ? (
                        <Badge className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider animate-pulse">
                          ⚠️ FAKE
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500 text-white text-xs font-semibold">
                          ✓ Real
                        </Badge>
                      )}
                      {review.is_featured && (
                        <Badge className="bg-purple-100 text-purple-700 text-xs">Featured</Badge>
                      )}
                      {review.is_verified_purchase && !review.is_seeded && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm mb-1">{review.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{review.content}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.created_at).toLocaleDateString()}
                      {review.customer_org && ` • ${review.customer_org}`}
                    </p>
                  </div>
                  <div className="w-24">
                    {renderStars(review.rating)}
                  </div>
                  <div className="w-24">
                    {getStatusBadge(review.status)}
                  </div>
                  <div className="w-32 flex gap-1">
                    {review.status === 'pending' && (
                      <>
                        <Button size="icon" variant="ghost" className="text-green-600" onClick={() => handleApprove(review.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleReject(review.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => { setEditingReview({...review}); setEditModalOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-amber-600" onClick={() => handleToggleFeatured(review)}>
                      <Star className={`w-4 h-4 ${review.is_featured ? 'fill-current' : ''}`} />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleDelete(review.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seed Modal */}
      <Dialog open={seedModalOpen} onOpenChange={setSeedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seed Reviews</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600 mb-4">
              Generate fake reviews for initial display. These can be deleted later as real reviews come in.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Number of reviews to generate</label>
              <Input
                type="number"
                value={seedCount}
                onChange={(e) => setSeedCount(parseInt(e.target.value) || 50)}
                min={10}
                max={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeedModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSeedReviews} disabled={seeding}>
              {seeding ? 'Seeding...' : `Generate ${seedCount} Reviews`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                {renderStars(editingReview.rating, true, (rating) => setEditingReview({...editingReview, rating}))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <Input
                  value={editingReview.title}
                  onChange={(e) => setEditingReview({...editingReview, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <Textarea
                  value={editingReview.content}
                  onChange={(e) => setEditingReview({...editingReview, content: e.target.value})}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
