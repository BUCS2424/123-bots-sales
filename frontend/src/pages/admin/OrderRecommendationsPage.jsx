import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, Package, Clock, DollarSign, AlertTriangle, 
  Truck, ArrowRight, Download, Mail, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const OrderRecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMfr, setExpandedMfr] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await axios.get(`${API}/inventory/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data);
      
      // Expand all by default
      const expanded = {};
      response.data.recommendations?.forEach((rec, idx) => {
        expanded[idx] = true;
      });
      setExpandedMfr(expanded);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast({ title: 'Error', description: 'Failed to load recommendations', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSendReport = async () => {
    try {
      await axios.post(`${API}/inventory/send-test-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Report Sent', description: 'Inventory report has been sent to configured recipients' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send report', variant: 'destructive' });
    }
  };

  const handleCreatePO = (mfrId, items) => {
    // Navigate to PO creation with pre-filled data
    const params = new URLSearchParams({
      manufacturer_id: mfrId,
      items: JSON.stringify(items.map(i => ({
        inventory_item_id: i.inventory_item_id,
        quantity: i.recommended_quantity,
        unit_cost: i.unit_cost || 0
      })))
    });
    window.location.href = `/admin/inventory/purchase-orders/new?${params.toString()}`;
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const summary = recommendations?.summary || {};
  const settings = recommendations?.settings || {};
  const recs = recommendations?.recommendations || [];

  return (
    <div className="min-h-screen bg-gray-900 p-6" data-testid="order-recommendations-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              Order Recommendations
            </h1>
            <p className="text-gray-400 mt-1">
              Based on pipeline demand, historical sales, and current stock levels
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Generated: {new Date(recommendations?.generated_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSendReport}>
              <Mail className="w-4 h-4 mr-2" />
              Send Report Now
            </Button>
            <Link to="/admin/inventory/settings">
              <Button variant="outline">Settings</Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-white">{summary.total_manufacturers || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Manufacturers to Order From</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Truck className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-white">{summary.total_items_to_order || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Total Items to Order</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-green-400">
                  ${(summary.total_estimated_cost || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Estimated Total Cost</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <p className="text-sm text-gray-400">Algorithm Settings</p>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>Conversion Rate: {(settings.conversion_rate * 100).toFixed(0)}%</p>
                <p>Safety Stock: {settings.safety_stock_days} days</p>
                <p>Forecast Period: {settings.forecast_period_days} days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations by Manufacturer */}
        {recs.length > 0 ? (
          <div className="space-y-6">
            {recs.map((rec, idx) => (
              <Card key={idx} className="bg-gray-800 border-gray-700">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-750"
                  onClick={() => setExpandedMfr(prev => ({ ...prev, [idx]: !prev[idx] }))}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-3">
                      {rec.manufacturer?.name || 'Unknown Manufacturer'}
                      <Badge variant="outline">{rec.manufacturer?.code}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">{rec.items?.length || 0} items</p>
                        <p className="text-lg font-bold text-green-400">
                          ${(rec.total_estimated_cost || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{rec.lead_time_days} days</span>
                      </div>
                      {expandedMfr[idx] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {expandedMfr[idx] && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-400 font-medium">Product</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">SKU</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Current Stock</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Reorder Point</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Daily Demand</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Pipeline</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Recommended Qty</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Est. Cost</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-medium">Urgency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.items?.map((item, itemIdx) => (
                            <tr key={itemIdx} className="border-b border-gray-700/50 hover:bg-gray-750">
                              <td className="py-3 px-4 text-white font-medium">{item.product_name}</td>
                              <td className="py-3 px-4 text-center text-gray-400">{item.sku || '-'}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={item.current_stock <= 0 ? 'text-red-400 font-bold' : 'text-white'}>
                                  {item.current_stock}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-gray-400">{item.reorder_point}</td>
                              <td className="py-3 px-4 text-center text-gray-400">{item.daily_demand.toFixed(2)}/day</td>
                              <td className="py-3 px-4 text-center text-blue-400">{item.pipeline_demand.toFixed(1)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-xl font-bold text-blue-400">{item.recommended_quantity}</span>
                              </td>
                              <td className="py-3 px-4 text-center text-green-400">
                                ${(item.estimated_cost || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Badge variant={getUrgencyColor(item.urgency)}>
                                  {item.urgency.toUpperCase()}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 flex justify-end gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => handleCreatePO(rec.manufacturer?.id, rec.items)}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Create Purchase Order
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">All Inventory Levels Healthy</h3>
              <p className="text-gray-400 mb-6">
                No order recommendations at this time. Your stock levels are sufficient to meet projected demand.
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/admin/inventory/items">
                  <Button variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    View Inventory
                  </Button>
                </Link>
                <Link to="/admin/inventory/settings">
                  <Button variant="outline">
                    Adjust Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Algorithm Explanation */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">How Recommendations Are Calculated</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-400 space-y-3">
            <p>
              <strong className="text-white">1. Pipeline Demand:</strong> We analyze your open opportunities and their associated products. 
              Each opportunity is weighted by its stage (later stages = higher probability of conversion).
            </p>
            <p>
              <strong className="text-white">2. Historical Sales:</strong> We calculate your average daily sales velocity 
              from orders in the last {settings.forecast_period_days} days.
            </p>
            <p>
              <strong className="text-white">3. Conversion Rate:</strong> Pipeline demand is multiplied by your configured 
              conversion rate ({(settings.conversion_rate * 100).toFixed(0)}%) to estimate actual orders.
            </p>
            <p>
              <strong className="text-white">4. Coverage Period:</strong> We ensure you have enough stock to cover the 
              manufacturer's lead time ({settings.safety_stock_days} days safety stock added).
            </p>
            <p>
              <strong className="text-white">5. Recommendation:</strong> If projected stock falls below the reorder point, 
              we recommend ordering enough to maintain healthy levels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderRecommendationsPage;
