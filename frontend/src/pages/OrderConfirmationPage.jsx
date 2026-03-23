import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Home, Package, Truck, Mail, Phone, MapPin, 
  CreditCard, ArrowRight, Download, Clock, 
  DollarSign, Smartphone, AlertCircle, ExternalLink
} from 'lucide-react';
import ButterflyIcon from '../components/icons/ButterflyIcon';
import { getDisplayOptionSummary } from '../lib/productOptions';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [capturingPayPal, setCapturingPayPal] = useState(false);

  useEffect(() => {
    const savedOrder = sessionStorage.getItem('lastOrder');
    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    }
  }, []);

  useEffect(() => {
    const maybeCapturePayPal = async () => {
      if (!order || order.payment_method !== 'paypal') return;

      const search = new URLSearchParams(location.search);
      const paypalStatus = search.get('paypal');
      const paypalOrderId = search.get('token');

      if (paypalStatus !== 'success' || !paypalOrderId || order.payment_status === 'captured') {
        return;
      }

      setCapturingPayPal(true);
      try {
        const response = await fetch(`${API_URL}/api/payments/paypal/capture/${paypalOrderId}`, {
          method: 'POST'
        });

        if (response.ok) {
          const updatedOrder = {
            ...order,
            awaiting_payment: false,
            status: 'paid',
            payment_status: 'captured'
          };
          setOrder(updatedOrder);
          sessionStorage.setItem('lastOrder', JSON.stringify(updatedOrder));
        }
      } catch (error) {
        console.error('PayPal capture error:', error);
      } finally {
        setCapturingPayPal(false);
      }
    };

    maybeCapturePayPal();
  }, [order, location.search]);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-purple-50/30 pt-32 pb-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Package className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">No Order Found</h1>
          <p className="text-slate-500 mb-8">
            It looks like you haven't placed an order yet, or the order details have expired.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
          >
            Browse Catalog
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-purple-50/30 pt-32 pb-20" data-testid="order-confirmation-page">
      <div className="max-w-4xl mx-auto px-6">
        {/* Success Header - Different for CashApp/Venmo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-10"
        >
          {order.awaiting_payment ? (
            <>
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg ${
                order.payment_method === 'cashapp' 
                  ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-500/30' 
                  : order.payment_method === 'paypal'
                  ? 'bg-gradient-to-br from-sky-500 to-blue-700 shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/30'
              }`}>
                <Clock className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                Order Placed - Payment Pending
              </h1>
              <p className="text-lg text-slate-600 max-w-lg mx-auto">
                Your order has been placed. Please complete your payment using{' '}
                <span className={`font-semibold ${
                  order.payment_method === 'cashapp'
                    ? 'text-green-600'
                    : order.payment_method === 'paypal'
                    ? 'text-sky-600'
                    : 'text-blue-600'
                }`}>
                  {order.payment_method === 'cashapp' ? 'CashApp' : order.payment_method === 'paypal' ? 'PayPal' : 'Venmo'}
                </span>
                . Check your email at{' '}
                <span className="font-medium text-purple-600">{order.shipping?.email || order.customer_email}</span>{' '}
                for payment instructions.
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">
                Thank You for Your Order!
              </h1>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
                Your order has been placed successfully. A confirmation email has been sent to{' '}
                <span className="font-medium text-purple-600">{order.shipping?.email || order.customer_email}</span>
              </p>
            </>
          )}
        </motion.div>

        {capturingPayPal && (
          <div className="mb-6 p-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 text-sm" data-testid="paypal-capture-processing">
            Finalizing your PayPal payment confirmation...
          </div>
        )}

        {/* CashApp/Venmo Payment Instructions Banner */}
        {order.awaiting_payment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`rounded-2xl p-6 mb-8 border-2 ${
              order.payment_method === 'cashapp' 
                ? 'bg-green-50 border-green-300' 
                : order.payment_method === 'paypal'
                ? 'bg-sky-50 border-sky-300'
                : 'bg-blue-50 border-blue-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                order.payment_method === 'cashapp' ? 'bg-green-500' : order.payment_method === 'paypal' ? 'bg-sky-600' : 'bg-blue-500'
              }`}>
                {order.payment_method === 'cashapp' 
                  ? <DollarSign className="w-6 h-6 text-white" /> 
                  : order.payment_method === 'paypal'
                  ? <span className="text-white font-bold text-sm">PP</span>
                  : <span className="text-white font-bold text-xl">V</span>
                }
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-2 ${
                  order.payment_method === 'cashapp' ? 'text-green-800' : order.payment_method === 'paypal' ? 'text-sky-800' : 'text-blue-800'
                }`}>
                  Complete Your Payment
                </h3>
                <div className={`space-y-2 text-sm ${
                  order.payment_method === 'cashapp' ? 'text-green-700' : order.payment_method === 'paypal' ? 'text-sky-700' : 'text-blue-700'
                }`}>
                  {order.payment_method === 'paypal' ? (
                    <>
                      <p>Use PayPal to complete payment for your order.</p>
                      <ol className="list-decimal ml-5 space-y-1">
                        <li>Open PayPal checkout</li>
                        <li>Pay <span className="font-bold">${order.total?.toFixed(2)}</span></li>
                        <li>Include order number <span className="font-mono font-bold">{order.orderId || order.order_number}</span> if prompted</li>
                        <li>Your order ships once payment is confirmed</li>
                      </ol>
                      {(order.payment_link || order.payment_approval_url) && (
                        <a
                          href={order.payment_approval_url || order.payment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors"
                          data-testid="order-confirmation-paypal-link"
                        >
                          Continue to PayPal
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <p>We've sent payment instructions to your email. Here's a quick reminder:</p>
                      <ol className="list-decimal ml-5 space-y-1">
                        <li>Open your {order.payment_method === 'cashapp' ? 'CashApp' : 'Venmo'} app</li>
                        <li>Send <span className="font-bold">${order.total?.toFixed(2)}</span> to our account (check email for ID)</li>
                        <li>Include order number <span className="font-mono font-bold">{order.orderId || order.order_number}</span> in the note</li>
                        <li>Your order ships once we confirm payment!</li>
                      </ol>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Order Number Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl p-6 mb-8 text-center text-white shadow-xl ${
            order.awaiting_payment 
              ? order.payment_method === 'cashapp'
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/20'
                : order.payment_method === 'paypal'
                ? 'bg-gradient-to-r from-sky-500 to-blue-700 shadow-blue-500/20'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/20'
              : 'bg-gradient-to-r from-purple-600 to-amber-500 shadow-purple-500/20'
          }`}
        >
          <p className="text-purple-100 text-sm uppercase tracking-wider mb-1">Order Number</p>
          <p className="text-3xl font-mono font-bold" data-testid="order-number">{order.orderId}</p>
          <p className="text-purple-100 text-sm mt-2">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Shipping Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-heading text-lg font-bold text-slate-800">Shipping To</h2>
            </div>
            <div className="space-y-2 text-slate-600">
              <p className="font-semibold text-slate-800">
                {order.shipping?.firstName} {order.shipping?.lastName}
              </p>
              {order.shipping?.company && (
                <p className="text-sm">{order.shipping.company}</p>
              )}
              <p>{order.shipping?.address1}</p>
              {order.shipping?.address2 && <p>{order.shipping.address2}</p>}
              <p>
                {order.shipping?.city}, {order.shipping?.state} {order.shipping?.zipCode}
              </p>
              <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {order.shipping?.email}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {order.shipping?.phone}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Payment Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-200 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                order.awaiting_payment 
                  ? order.payment_method === 'cashapp' ? 'bg-green-100' : order.payment_method === 'paypal' ? 'bg-sky-100' : 'bg-blue-100'
                  : 'bg-purple-100'
              }`}>
                {order.payment_method === 'cashapp' ? (
                  <DollarSign className={`w-5 h-5 ${order.awaiting_payment ? 'text-green-600' : 'text-purple-600'}`} />
                ) : order.payment_method === 'paypal' ? (
                  <span className="text-sky-600 font-bold text-xs">PP</span>
                ) : order.payment_method === 'venmo' ? (
                  <span className="text-blue-600 font-bold">V</span>
                ) : (
                  <CreditCard className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <h2 className="font-heading text-lg font-bold text-slate-800">Payment</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {order.payment_method === 'cashapp' ? (
                  <>
                    <div className="w-12 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">CashApp</p>
                      <p className="text-sm text-slate-500">
                        {order.awaiting_payment ? 'Awaiting Payment' : 'Payment Received'}
                      </p>
                    </div>
                  </>
                ) : order.payment_method === 'venmo' ? (
                  <>
                    <div className="w-12 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold">V</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Venmo</p>
                      <p className="text-sm text-slate-500">
                        {order.awaiting_payment ? 'Awaiting Payment' : 'Payment Received'}
                      </p>
                    </div>
                  </>
                ) : order.payment_method === 'paypal' ? (
                  <>
                    <div className="w-12 h-8 bg-sky-600 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-xs">PP</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">PayPal</p>
                      <p className="text-sm text-slate-500">
                        {order.awaiting_payment ? 'Awaiting Payment Completion' : 'Payment Captured'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-md flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-mono text-slate-800">•••• •••• •••• {order.payment_last_four}</p>
                      <p className="text-sm text-slate-500">Credit Card</p>
                    </div>
                  </>
                )}
              </div>
              
              {order.awaiting_payment && (
                <div className={`p-3 rounded-lg border ${
                  order.payment_method === 'cashapp' 
                    ? 'bg-amber-50 border-amber-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p>Your order will ship once we confirm your payment.</p>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-mono text-slate-700">${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Shipping</span>
                  <span className="font-mono text-slate-700">
                    {order.shipping_cost === 0 ? 'FREE' : `$${order.shipping_cost?.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-mono text-slate-700">${order.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">
                    {order.awaiting_payment ? 'Total Due' : 'Total Paid'}
                  </span>
                  <span className="font-mono font-bold text-lg text-purple-600">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-heading text-lg font-bold text-slate-800">
              Order Items ({order.items?.length || 0})
            </h2>
          </div>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl"
              >
                <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                  <ButterflyIcon className="w-8 h-8 text-[#ff8c42]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    Qty: {item.quantity}
                    {getDisplayOptionSummary(item) ? ` • ${getDisplayOptionSummary(item)}` : ''}
                  </p>
                  {item.custom_notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">Notes: {item.custom_notes}</p>}
                  {item.custom_image_url && <p className="text-xs text-slate-400 mt-1">Custom image attached</p>}
                </div>
                <p className="font-mono font-semibold text-slate-800">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`border rounded-2xl p-6 mb-8 ${
            order.awaiting_payment 
              ? order.payment_method === 'cashapp' 
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                : order.payment_method === 'paypal'
                ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
              : 'bg-gradient-to-br from-purple-50 to-amber-50 border-purple-200'
          }`}
        >
          <h3 className="font-heading text-lg font-bold text-slate-800 mb-4">What Happens Next?</h3>
          {order.awaiting_payment ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  order.payment_method === 'cashapp' ? 'bg-green-600' : order.payment_method === 'paypal' ? 'bg-sky-600' : 'bg-blue-600'
                }`}>1</div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {order.payment_method === 'paypal' ? 'Complete PayPal Checkout' : 'Send Payment'}
                  </p>
                  <p className="text-sm text-slate-600">
                    Send ${order.total?.toFixed(2)} via {
                      order.payment_method === 'cashapp'
                        ? 'CashApp'
                        : order.payment_method === 'paypal'
                        ? 'PayPal'
                        : 'Venmo'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  order.payment_method === 'cashapp' ? 'bg-green-600' : order.payment_method === 'paypal' ? 'bg-sky-600' : 'bg-blue-600'
                }`}>2</div>
                <div>
                  <p className="font-semibold text-slate-800">We Verify</p>
                  <p className="text-sm text-slate-600">We'll confirm your payment within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  order.payment_method === 'cashapp' ? 'bg-green-600' : order.payment_method === 'paypal' ? 'bg-sky-600' : 'bg-blue-600'
                }`}>3</div>
                <div>
                  <p className="font-semibold text-slate-800">Order Ships</p>
                  <p className="text-sm text-slate-600">Tracking info sent to your email</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <p className="font-semibold text-slate-800">Order Processing</p>
                  <p className="text-sm text-slate-600">We'll verify and process your order within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <p className="font-semibold text-slate-800">Quality Check</p>
                  <p className="text-sm text-slate-600">Products undergo final quality verification</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold text-slate-800">Shipped</p>
                  <p className="text-sm text-slate-600">Tracking info sent to your email</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Thank You Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-4 bg-[#ff8c42]/10 border border-[#ff8c42]/30 rounded-xl mb-8"
        >
          <p className="font-semibold text-sm text-[#ff8c42] text-center">
            Thank you for shopping with 123Bots!
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            data-testid="return-home-btn"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all"
            data-testid="continue-shopping-btn"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
