import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, RotateCcw, Package, Clock, MapPin, AlertCircle } from 'lucide-react';
import { setSeoMetadata } from '../../lib/seo';

const ShippingReturnsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Shipping & Returns',
      description: '123Bots shipping information, delivery times, and return policy. Free shipping on orders over $75!',
      keywords: 'shipping info, delivery times, return policy, 123Bots shipping',
      canonicalPath: '/shipping-returns',
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c1810] to-[#3a1f12] text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <Link data-testid="shipping-returns-back-home-link" to="/" className="inline-flex items-center text-[#ffd4b8] hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <Truck className="w-10 h-10 text-[#ff8c42]" />
            <h1 data-testid="shipping-returns-page-title" className="text-4xl font-bold">Shipping & Returns</h1>
          </div>
          <p className="text-[#ffd4b8] mt-2">Delivery Information & Return Policy</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Shipping Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#fff8f3] rounded-full">
                <Truck className="w-8 h-8 text-[#ff8c42]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Shipping Information</h2>
            </div>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#ff8c42]" /> Processing Time
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Orders are typically processed within <strong>2-5 business days</strong> as each item is custom made with care. Orders placed on weekends or holidays will be processed the next business day. You will receive a shipping confirmation email with tracking information once your order has shipped.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#ff8c42]" /> Shipping Methods & Rates
              </h3>
              <div className="overflow-x-auto">
                <table data-testid="shipping-methods-rates-table" className="w-full border-collapse text-[#2c1810]">
                  <thead>
                    <tr className="bg-[#fff8f3]">
                      <th data-testid="shipping-rates-header-method" className="text-left py-3 px-4 font-semibold text-[#2c1810] border">Method</th>
                      <th data-testid="shipping-rates-header-delivery-time" className="text-left py-3 px-4 font-semibold text-[#2c1810] border">Delivery Time</th>
                      <th data-testid="shipping-rates-header-cost" className="text-left py-3 px-4 font-semibold text-[#2c1810] border">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#2c1810]">
                    <tr>
                      <td data-testid="shipping-rate-standard-method" className="py-3 px-4 border">Standard Shipping</td>
                      <td data-testid="shipping-rate-standard-delivery" className="py-3 px-4 border">5-7 Business Days</td>
                      <td data-testid="shipping-rate-standard-cost" className="py-3 px-4 border">$7.99</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td data-testid="shipping-rate-expedited-method" className="py-3 px-4 border">Expedited Shipping</td>
                      <td data-testid="shipping-rate-expedited-delivery" className="py-3 px-4 border">2-3 Business Days</td>
                      <td data-testid="shipping-rate-expedited-cost" className="py-3 px-4 border">$14.99</td>
                    </tr>
                    <tr>
                      <td data-testid="shipping-rate-priority-method" className="py-3 px-4 border">Priority Overnight</td>
                      <td data-testid="shipping-rate-priority-delivery" className="py-3 px-4 border">1 Business Day</td>
                      <td data-testid="shipping-rate-priority-cost" className="py-3 px-4 border">$29.99</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td data-testid="shipping-rate-free-method" className="py-3 px-4 border font-semibold text-[#ff8c42]">FREE Shipping</td>
                      <td data-testid="shipping-rate-free-delivery" className="py-3 px-4 border">5-7 Business Days</td>
                      <td data-testid="shipping-rate-free-cost" className="py-3 px-4 border font-semibold text-green-700">Orders over $75</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Shipping Locations</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We currently ship to all 50 United States. International shipping may be available for select items - please contact us for a quote.
              </p>
              <div className="bg-[#fff8f3] border-l-4 border-[#ff8c42] p-4 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-[#ff8c42] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 text-sm">
                    <strong>Note:</strong> We are unable to ship to P.O. Boxes for expedited or overnight shipping methods.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#ff8c42]" /> Packaging
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All orders are carefully packaged to ensure your custom products arrive in perfect condition. We use appropriate padding and protection for fragile items like tumblers and mugs. Gift wrapping may be available for select items at checkout.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Once your order ships, you will receive an email with tracking information. You can track your package through our website or directly through the carrier's website. If you have not received tracking information within 5 business days of order confirmation, please contact us.
              </p>
            </section>
          </div>

          {/* Divider */}
          <hr className="border-gray-200" />

          {/* Returns Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#fff8f3] rounded-full">
                <RotateCcw className="w-8 h-8 text-[#ff8c42]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Returns & Refunds</h2>
            </div>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Return Policy</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We want you to love your custom products! Due to the personalized nature of our items, we have specific return policies:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Returns are accepted within <strong>14 days</strong> of delivery for defective or damaged items</li>
                <li>Products must be unused and in original condition</li>
                <li>A Return Merchandise Authorization (RMA) number is required for all returns</li>
                <li>Customer is responsible for return shipping costs unless the return is due to our error</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Non-Returnable Items</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                The following items cannot be returned:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Custom-designed items made to your specifications (unless defective)</li>
                <li>Personalized products with names, photos, or custom text</li>
                <li>Used or washed apparel items</li>
                <li>Digital download products</li>
                <li>Products beyond the 14-day return window</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Damaged or Defective Products</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you receive a damaged or defective product:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Contact us within <strong>48 hours</strong> of delivery</li>
                <li>Provide photos of the damage and packaging</li>
                <li>Do not discard the product or packaging until instructed</li>
                <li>We will ship a replacement at no charge or issue a full refund</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">How to Request a Return</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-2 ml-4">
                <li>Contact us at support@123bots.com with your order number</li>
                <li>Explain the reason for your return</li>
                <li>Wait for RMA approval and return instructions</li>
                <li>Ship the product back using the provided instructions</li>
                <li>Refund will be processed within 5-7 business days of receiving the return</li>
              </ol>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Refund Methods</h3>
              <p className="text-gray-600 leading-relaxed">
                Refunds will be issued to the original payment method. Please allow 5-10 business days for the refund to appear on your statement, depending on your financial institution.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Cancellations</h3>
              <p className="text-gray-600 leading-relaxed">
                Orders may be cancelled within 2 hours of placement for a full refund, provided production has not yet begun. After this window, orders enter production and cannot be cancelled. If your order has already shipped, you will need to follow our return procedure.
              </p>
            </section>
          </div>

          {/* Contact */}
          <section className="pt-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about shipping or returns, please don't hesitate to contact us:
            </p>
            <div className="mt-4 p-4 bg-[#fff8f3] rounded-lg border border-[#ffe4d4]">
              <p className="font-semibold text-[#2c1810]">123Bots Customer Support</p>
              <p className="text-[#ff8c42]">Email: support@123bots.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ShippingReturnsPage;
