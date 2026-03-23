import React, { useState } from 'react';
import { Gift, Plus, Search, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const AdminGiftCards = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Placeholder data for gift cards
  const giftCards = [
    {
      id: 'GC001',
      code: 'APS-GIFT-X7K9M2',
      originalValue: 100.00,
      currentBalance: 45.50,
      purchasedBy: 'John Doe',
      purchasedAt: '2024-01-15T10:00:00',
      status: 'active',
      usedBy: 'Jane Smith',
    },
    {
      id: 'GC002',
      code: 'APS-GIFT-P3L8N5',
      originalValue: 50.00,
      currentBalance: 50.00,
      purchasedBy: 'Mike Wilson',
      purchasedAt: '2024-02-01T14:30:00',
      status: 'active',
      usedBy: null,
    },
    {
      id: 'GC003',
      code: 'APS-GIFT-R9T2W4',
      originalValue: 200.00,
      currentBalance: 0,
      purchasedBy: 'Sarah Johnson',
      purchasedAt: '2023-12-25T09:00:00',
      status: 'depleted',
      usedBy: 'Tom Brown',
    },
    {
      id: 'GC004',
      code: 'APS-GIFT-M6Y1H8',
      originalValue: 75.00,
      currentBalance: 75.00,
      purchasedBy: 'System',
      purchasedAt: '2024-01-20T11:00:00',
      status: 'inactive',
      usedBy: null,
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
      depleted: { label: 'Depleted', className: 'bg-red-100 text-red-800' },
      expired: { label: 'Expired', className: 'bg-yellow-100 text-yellow-800' },
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stats = {
    totalIssued: giftCards.length,
    totalValue: giftCards.reduce((sum, gc) => sum + gc.originalValue, 0),
    outstandingBalance: giftCards.reduce((sum, gc) => sum + gc.currentBalance, 0),
    activeCards: giftCards.filter(gc => gc.status === 'active').length,
  };

  const filteredCards = giftCards.filter(
    gc =>
      gc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gc.purchasedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="admin-gift-cards">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-500 mt-1">Manage store gift cards and vouchers</p>
        </div>
        <Button className="bg-[rgb(37, 99, 235)] hover:bg-[#a3172e]" data-testid="create-gift-card-btn">
          <Plus className="w-4 h-4 mr-2" />
          Create Gift Card
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Issued</p>
                <p className="text-2xl font-bold">{stats.totalIssued}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Gift className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Outstanding</p>
                <p className="text-2xl font-bold">${stats.outstandingBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Cards</p>
                <p className="text-2xl font-bold">{stats.activeCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gift Cards Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Gift Cards</CardTitle>
              <CardDescription>View and manage all gift cards</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search gift cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="gift-card-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Original Value</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Purchased By</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    data-testid={`gift-card-row-${card.id}`}
                  >
                    <td className="py-3 px-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {card.code}
                      </code>
                    </td>
                    <td className="py-3 px-4 font-medium">${card.originalValue.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={card.currentBalance === 0 ? 'text-gray-400' : 'text-green-600 font-medium'}>
                        ${card.currentBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{card.purchasedBy}</td>
                    <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(card.purchasedAt)}</td>
                    <td className="py-3 px-4">{getStatusBadge(card.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" data-testid={`view-gift-card-${card.id}`}>
                          View
                        </Button>
                        {card.status === 'inactive' && (
                          <Button size="sm" variant="outline" data-testid={`activate-gift-card-${card.id}`}>
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No gift cards found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGiftCards;
