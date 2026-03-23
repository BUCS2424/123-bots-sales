import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Package, Warehouse, Wrench, LogOut, Home, Settings,
  Plus, Edit, Trash2, Shield, UserCheck, User, ChevronDown,
  BarChart3, TrendingUp, DollarSign, Activity
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin, isSuperAdmin, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', password: '', role: 'user' });
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers();
      fetchStats();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await axios.get(`${API}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setIsLoadingUsers(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/users`, newUser);
      toast({ title: 'User Created', description: `${newUser.email} has been created.` });
      setIsCreateDialogOpen(false);
      setNewUser({ email: '', name: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create user',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast({ title: 'User Deleted', description: `${userName} has been removed.` });
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete user',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (userId, isActive, userName) => {
    try {
      await axios.put(`${API}/admin/users/${userId}`, { is_active: !isActive });
      toast({
        title: isActive ? 'User Disabled' : 'User Enabled',
        description: `${userName} has been ${isActive ? 'disabled' : 'enabled'}.`
      });
      fetchUsers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-600';
      case 'admin': return 'bg-blue-600';
      case 'staff': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'super_admin': return <Shield className="w-4 h-4" />;
      case 'admin': return <UserCheck className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-[#c41e3a] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://customer-assets.emergentagent.com/job_35efb418-d957-4303-979f-4e5863096b08/artifacts/hzi2b2xm_amino-chain-logo-final-1.png"
                alt="APS"
                className="h-12"
              />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-300">123Bots</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium">{user?.name}</p>
                <Badge className={`${getRoleBadgeColor(user?.role)} text-xs`}>
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-[#1e3a5f]">{stats?.total_users || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Catalog Products</p>
                  <p className="text-3xl font-bold text-[#1e3a5f]">{stats?.total_products || 12}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Storage Units</p>
                  <p className="text-3xl font-bold text-[#1e3a5f]">{stats?.total_storage_units || 6}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Warehouse className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">RV Services</p>
                  <p className="text-3xl font-bold text-[#1e3a5f]">{stats?.total_rv_services || 8}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white shadow">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#c41e3a] data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Users
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-[#c41e3a] data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" /> Activity
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#1e3a5f]">User Management</CardTitle>
                {isSuperAdmin && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#c41e3a] hover:bg-[#a01830]">
                        <Plus className="w-4 h-4 mr-2" /> Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Select
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full bg-[#c41e3a] hover:bg-[#a01830]">
                          Create User
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-[#c41e3a] border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600">Created</th>
                          {isSuperAdmin && (
                            <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-[#1e3a5f]">{u.name}</p>
                                <p className="text-sm text-gray-500">{u.email}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={`${getRoleBadgeColor(u.role)} flex items-center gap-1 w-fit`}>
                                {getRoleIcon(u.role)}
                                {u.role.replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={u.is_active ? 'bg-green-600' : 'bg-red-600'}>
                                {u.is_active ? 'Active' : 'Disabled'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            {isSuperAdmin && (
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleActive(u.id, u.is_active, u.name)}
                                    disabled={u.id === user.id}
                                  >
                                    {u.is_active ? 'Disable' : 'Enable'}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    disabled={u.id === user.id}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1e3a5f]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recent_activity?.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-[#c41e3a]/10 rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[#c41e3a]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1e3a5f]">{activity.message}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPage;
