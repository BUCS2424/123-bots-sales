import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const BACKGROUND_IMAGE = 'https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png';
const HERO_VIDEO_DEFAULT = '/videos/butterfly_alpha.webm';

const getVideoMimeType = (videoUrl) => {
  const normalized = (videoUrl || '').toLowerCase();
  if (normalized.endsWith('.mp4') || normalized.includes('.mp4?')) return 'video/mp4';
  if (normalized.endsWith('.webm') || normalized.includes('.webm?')) return 'video/webm';
  if (normalized.endsWith('.mov') || normalized.includes('.mov?')) return 'video/quicktime';
  return 'video/webm';
};

const DevLocationPreview = () => {
  const videoRef = useRef(null);
  const [heroSettings, setHeroSettings] = useState({
    hero_background_image_url: BACKGROUND_IMAGE,
    hero_video_url: HERO_VIDEO_DEFAULT,
  });

  useEffect(() => {
    // Fetch hero display settings
    const fetchHeroSettings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/settings/hero-display`);
        if (response.data) {
          setHeroSettings(prev => ({
            ...prev,
            hero_background_image_url: response.data.hero_background_image_url || BACKGROUND_IMAGE,
            hero_video_url: response.data.hero_video_url || HERO_VIDEO_DEFAULT,
          }));
        }
      } catch (error) {
        console.log('Using default hero settings');
      }
    };
    fetchHeroSettings();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [heroSettings]);

  // Sample location data for preview
  const sampleLocation = {
    name: 'GingerKare Custom Emporium',
    tagline: 'Your Local Custom Printables Destination',
    address: '123 Main Street',
    city: 'Dothan',
    state: 'Alabama',
    zip: '36301',
    phone: '(334) 555-0123',
    email: 'gingerkare44@yahoo.com',
    hours: [
      { day: 'Monday - Friday', time: '9:00 AM - 6:00 PM' },
      { day: 'Saturday', time: '10:00 AM - 4:00 PM' },
      { day: 'Sunday', time: 'Closed' },
    ],
    services: [
      'Custom T-Shirt Printing',
      'Personalized Mugs & Tumblers',
      'Canvas Art & Wall Decor',
      'Stickers & Patches',
      'Flags & Banners',
      'Corporate & Event Orders',
    ],
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{ 
          backgroundImage: `url(${heroSettings.hero_background_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Video Overlay */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[1] pointer-events-none"
      >
        <source src={heroSettings.hero_video_url} type={getVideoMimeType(heroSettings.hero_video_url)} />
      </video>
      
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#2c1810]/65 via-[#3a1f12]/55 to-[#1a0f0a]/65 z-10" />
      
      {/* Content */}
      <div className="relative z-20 min-h-screen">
        {/* Dev Mode Banner */}
        <div className="bg-amber-500 text-black py-2 px-4 text-center text-sm font-semibold">
          DEV PREVIEW MODE - This is a sample location page template
        </div>

        {/* Header */}
        <header className="pt-8 pb-4 px-6">
          <div className="max-w-6xl mx-auto">
            <Link 
              to="/dev/settings" 
              className="inline-flex items-center gap-2 text-[#ffd4b8] hover:text-[#ff8c42] transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dev Settings
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff8c42]/20 border border-[#ff8c42]/50 mb-6 backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-[#ff8c42]" />
              <span className="text-[#ffd4b8] text-sm font-semibold tracking-wider">
                {sampleLocation.city}, {sampleLocation.state}
              </span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
              {sampleLocation.name}
            </h1>
            
            <p className="text-[#ffd4b8] text-xl mb-8 max-w-2xl mx-auto">
              {sampleLocation.tagline}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href={`tel:${sampleLocation.phone}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-[#ff8c42]/40 transition-all"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
              <a 
                href="#directions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full hover:bg-white/20 transition-all"
              >
                <Navigation className="w-5 h-5" />
                Get Directions
              </a>
            </div>
          </div>
        </section>

        {/* Info Cards */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
            {/* Contact Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-[#ff8c42] font-heading font-bold text-lg mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact
              </h3>
              <div className="space-y-3 text-white">
                <p className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#ffd4b8] flex-shrink-0 mt-0.5" />
                  <span>
                    {sampleLocation.address}<br />
                    {sampleLocation.city}, {sampleLocation.state} {sampleLocation.zip}
                  </span>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#ffd4b8]" />
                  <span>{sampleLocation.phone}</span>
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#ffd4b8]" />
                  <span>{sampleLocation.email}</span>
                </p>
              </div>
            </div>

            {/* Hours Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-[#ff8c42] font-heading font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Hours
              </h3>
              <div className="space-y-2">
                {sampleLocation.hours.map((schedule, idx) => (
                  <div key={idx} className="flex justify-between text-white">
                    <span className="text-[#ffd4b8]">{schedule.day}</span>
                    <span className="font-semibold">{schedule.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
              <h3 className="text-[#ff8c42] font-heading font-bold text-lg mb-4">
                Services
              </h3>
              <ul className="space-y-2">
                {sampleLocation.services.map((service, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff8c42]" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-[#ff8c42]/20 to-[#9370db]/20 backdrop-blur-md border border-white/20 rounded-3xl p-10">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Create Something Special?
              </h2>
              <p className="text-[#ffd4b8] text-lg mb-8 max-w-2xl mx-auto">
                Visit us today or browse our online catalog. Custom orders welcome!
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white font-heading font-bold uppercase tracking-wider rounded-full hover:shadow-xl hover:shadow-[#ff8c42]/40 transition-all"
                >
                  Shop Online
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-heading font-bold uppercase tracking-wider rounded-full hover:bg-white/20 transition-all"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-[#ffd4b8]/70 text-sm">
              © {new Date().getFullYear()} GingerKare Custom Emporium. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DevLocationPreview;
