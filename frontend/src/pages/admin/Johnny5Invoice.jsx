import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Printer, Download, Package, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { DEFAULT_LOGO_URL } from '../../lib/siteDefaults';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Default logo if none configured
const DEFAULT_LOGO = DEFAULT_LOGO_URL;

const Johnny5Invoice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Extract orderId from URL path
  const orderId = location.pathname.split('/').pop();

  useEffect(() => {
    if (orderId) {
      fetchInvoiceData();
    }
  }, [orderId]);

  const fetchInvoiceData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/johnny5/orders/${orderId}/invoice`);
      setInvoiceData(response.data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">Invoice not found</h3>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const { order, business, origin_address, invoice_number } = invoiceData;
  const logoUrl = business.logo_url || DEFAULT_LOGO;

  return (
    <div className="space-y-6" data-testid="johnny5-invoice">
      {/* Action Bar - Hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fulfillment
        </Button>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
            <Printer className="w-4 h-4 mr-2" />
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div 
        ref={printRef}
        className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto print:shadow-none print:rounded-none print:max-w-none"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header with Logo and PAID stamp */}
        <div className="flex items-start justify-between mb-8 border-b pb-6">
          <div className="flex items-center gap-4">
            <img 
              src={logoUrl} 
              alt={business.name} 
              className="h-16 w-auto object-contain"
              onError={(e) => { e.target.src = DEFAULT_LOGO; }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              <p className="text-sm text-gray-600">{origin_address.street1}</p>
              <p className="text-sm text-gray-600">
                {origin_address.city}, {origin_address.state} {origin_address.zip}
              </p>
              {business.phone && <p className="text-sm text-gray-600">{business.phone}</p>}
              {business.email && <p className="text-sm text-gray-600">{business.email}</p>}
            </div>
          </div>
          
          {/* PAID Stamp */}
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-500 rounded-lg transform rotate-[-3deg]">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600 tracking-wider">PAID</span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Invoice #</p>
              <p className="text-lg font-semibold text-gray-900">{invoice_number}</p>
            </div>
          </div>
        </div>

        {/* Order Info Row */}
        <div className="grid grid-cols-3 gap-8 mb-8">
          {/* Ship To */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ship To</h3>
            <p className="font-semibold text-gray-900">{order.customer?.name}</p>
            <p className="text-gray-700">{order.shipping_address?.address1 || order.shipping_address?.street1}</p>
            {order.shipping_address?.address2 && <p className="text-gray-700">{order.shipping_address.address2}</p>}
            <p className="text-gray-700">
              {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
            </p>
            {order.customer?.phone && <p className="text-gray-600 text-sm mt-1">{order.customer.phone}</p>}
            {order.customer?.email && <p className="text-gray-600 text-sm">{order.customer.email}</p>}
          </div>

          {/* Order Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Order Details</h3>
            <p className="text-gray-700">
              <span className="font-medium">Order #:</span> {order.store_order_number || order.store_order_id?.slice(0, 8)}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Source:</span> {order.store_name}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Date:</span> {new Date(order.received_at).toLocaleDateString()}
            </p>
          </div>

          {/* Tracking */}
          {order.tracking && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Shipping</h3>
              <p className="text-gray-700">
                <span className="font-medium">Carrier:</span> {order.tracking.carrier?.toUpperCase()}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Tracking #:</span> 
              </p>
              <p className="text-sm font-mono text-gray-900 break-all">{order.tracking.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b-2">Item</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 border-b-2 w-24">Qty</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b-2 w-32">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b-2 w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{item.name || item.title}</p>
                    {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                    {item.options && <p className="text-sm text-gray-500">{item.options}</p>}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-700">${(item.price || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">${order.totals?.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">${order.totals?.shipping?.toFixed(2)}</span>
            </div>
            {order.totals?.tax > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium text-gray-900">${order.totals?.tax?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-gray-100 px-2 mt-2 rounded">
              <span className="text-lg font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">${order.totals?.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Thank you for your order!</p>
          <p>For research use only. Not for human consumption.</p>
          <p className="mt-2">Questions? Contact {business.email || 'support@123bots.com'}</p>
        </div>

        {/* Packing Slip Barcode Area (for scanning) */}
        {order.tracking?.tracking_number && (
          <div className="mt-8 pt-6 border-t border-dashed text-center">
            <p className="text-xs text-gray-400 mb-2">SCAN FOR TRACKING</p>
            <p className="font-mono text-lg tracking-wider">{order.tracking.tracking_number}</p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-testid="johnny5-invoice"] {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          [data-testid="johnny5-invoice"] * {
            visibility: visible;
          }
          @page {
            margin: 0.5in;
            size: letter;
          }
        }
      `}</style>
    </div>
  );
};

export default Johnny5Invoice;
