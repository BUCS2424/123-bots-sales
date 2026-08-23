import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, RotateCcw, Package, Clock, MapPin } from 'lucide-react';
import { setSeoMetadata } from '../../lib/seo';

const ShippingReturnsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Shipping & Returns',
      description: '123Bots shipping information, delivery times, and return policy for commercial cleaning and delivery robots.',
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
                Parts and accessories are typically processed within <strong>2-5 business days</strong>. Robot orders are scheduled with our team after purchase, and delivery timelines depend on the equipment and your location. You will receive a shipping confirmation email with tracking information once your order has shipped.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#ff8c42]" /> Shipping Methods
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Parts and accessories ship via standard parcel carriers. Robots and larger equipment typically ship via freight carrier, with delivery coordinated by our team. Exact rates and timelines depend on the item and destination - contact us for a shipping quote on your order.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Shipping Locations</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We currently serve customers across the states listed on our homepage. Contact us to confirm availability and shipping options for your location.
              </p>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#ff8c42]" /> Packaging
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All orders are carefully packaged and, where applicable, freighted to prevent damage during transit. For robot deliveries, our team can help coordinate receiving and setup.
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
                Return eligibility varies by item - parts and accessories, and robots and other equipment, are handled differently:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Parts and accessories must be unused, in original packaging, and returned within our standard window - contact us to confirm eligibility for your item</li>
                <li>Robots and other equipment purchases or leases are subject to the terms of your specific order or lease agreement</li>
                <li>A Return Merchandise Authorization (RMA) number is required for all returns</li>
                <li>Customer is responsible for return shipping costs unless the return is due to our error</li>
              </ul>
            </section>

            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Non-Returnable Items</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                The following are generally not eligible for return:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Items custom-configured or specially ordered to your specifications (unless defective)</li>
                <li>Used or installed parts</li>
                <li>Equipment past the return window stated in your order or lease agreement</li>
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
                Contact us as soon as possible if you need to cancel an order. We'll do everything we can before it ships or enters production; once an order has shipped, you'll need to follow our return procedure instead.
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
