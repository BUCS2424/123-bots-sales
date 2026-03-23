import React, { useState } from 'react';
import { Wrench, Clock, DollarSign, Check, Phone, Calendar, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { rvServices } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

const RVRepairPage = () => {
  const { addToCart } = useCart();

  const handleAddToCart = (service) => {
    addToCart(service, 'service');
    toast({
      title: 'Service Added',
      description: `${service.name} has been added to your cart.`,
    });
  };

  const faqs = [
    {
      question: 'How do I schedule an RV repair appointment?',
      answer: 'You can schedule an appointment by calling us at (334) 555-1234 or by adding services to your cart and checking out online. We\'ll contact you within 24 hours to confirm your appointment time.',
    },
    {
      question: 'Do you offer mobile RV repair services?',
      answer: 'Yes! We offer mobile repair services within a 50-mile radius of Dothan for many common repairs. Contact us for availability and pricing.',
    },
    {
      question: 'What brands of RVs do you service?',
      answer: 'We service all major RV brands including Winnebago, Thor, Forest River, Jayco, Airstream, and more. Our technicians are factory-trained on multiple brands.',
    },
    {
      question: 'Do you provide warranties on repairs?',
      answer: 'Yes, we offer a 90-day warranty on all labor and stand behind our work. Parts warranties vary by manufacturer.',
    },
    {
      question: 'Can you store my RV while repairs are being done?',
      answer: 'Absolutely! We offer secure RV storage at our facility. You can combine repair services with our storage options for convenience.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-[#1e3a5f] text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570129476815-ba368ac77013?w=1920')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e3a5f] via-[#1e3a5f]/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4">
          <Badge className="bg-[#c41e3a] text-white mb-4">Professional RV Services</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            RV Repair & Restoration
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mb-8">
            Expert RV repair and restoration services. From routine maintenance to complete overhauls, our certified technicians have you covered.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-[#c41e3a] hover:bg-[#a01830] text-white px-8 py-6 text-lg">
              <Phone className="mr-2 w-5 h-5" /> Call (334) 555-1234
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#1e3a5f] px-8 py-6 text-lg">
              <Calendar className="mr-2 w-5 h-5" /> Schedule Service
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] text-center mb-12">
            Why Choose APS for RV Repair?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Wrench, title: 'Expert Technicians', desc: 'Factory-trained and certified on all major RV brands' },
              { icon: Clock, title: 'Quick Turnaround', desc: 'Most repairs completed within 1-3 business days' },
              { icon: DollarSign, title: 'Fair Pricing', desc: 'Transparent pricing with no hidden fees' },
              { icon: Star, title: '5-Star Service', desc: 'Highest rated RV repair in Alabama' },
            ].map((item, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-xl transition-shadow group">
                <div className="w-16 h-16 bg-[#c41e3a]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#c41e3a] transition-colors">
                  <item.icon className="w-8 h-8 text-[#c41e3a] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] text-center mb-4">
            Our RV Services
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            From routine maintenance to complete restorations, we offer comprehensive RV services.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rvServices.map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col">
                <div className="relative h-48">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-[#1e3a5f] mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{service.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <span className="text-sm text-gray-500">Starting at</span>
                      <p className="text-xl font-bold text-[#c41e3a]">${service.price}</p>
                    </div>
                    <Button
                      onClick={() => handleAddToCart(service)}
                      size="sm"
                      className="bg-[#c41e3a] hover:bg-[#a01830] text-white"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section className="py-16 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Our Service Process
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Contact Us', desc: 'Call or schedule online to describe your RV issues.' },
              { step: 2, title: 'Free Estimate', desc: 'We provide a detailed estimate before any work begins.' },
              { step: 3, title: 'Expert Repair', desc: 'Our technicians perform high-quality repairs.' },
              { step: 4, title: 'Quality Check', desc: 'We test everything before returning your RV.' },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 bg-[#c41e3a] rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-300">{item.desc}</p>
                {item.step < 4 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-white/20"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e3a5f] text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold text-[#1e3a5f] hover:text-[#c41e3a]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#c41e3a]">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Your RV Road-Ready?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Contact us today for a free estimate or schedule your service appointment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-white text-[#c41e3a] hover:bg-gray-100 px-8 py-6 text-lg">
              <Phone className="mr-2 w-5 h-5" /> Call Now
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-[#c41e3a] px-8 py-6 text-lg">
              Schedule Online
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RVRepairPage;