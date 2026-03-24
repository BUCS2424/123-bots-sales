import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ChatWidget from '../components/ChatWidget';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const BACKGROUND_IMAGE = 'https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png';
const HERO_VIDEO_DEFAULT = '/videos/butterfly_alpha.webm';
const LOCATION_PREFIXES = [
  'commercial-cleaning-robots-',
  'cleaning-robots-',
  'custom-sublimation-',
  '123bots-',
  'peptide-research-supply-',
];

const buildSlugCandidates = (slugValue) => {
  const incomingSlug = (slugValue || '').trim().toLowerCase();
  if (!incomingSlug) return [];

  const normalizedSlug = incomingSlug.endsWith('.html')
    ? incomingSlug.slice(0, -5)
    : incomingSlug;

  let locationCore = normalizedSlug;
  for (const prefix of LOCATION_PREFIXES) {
    if (normalizedSlug.startsWith(prefix)) {
      locationCore = normalizedSlug.slice(prefix.length);
      break;
    }
  }

  const candidates = [
    normalizedSlug,
    `commercial-cleaning-robots-${locationCore}`,
    `cleaning-robots-${locationCore}`,
    `custom-sublimation-${locationCore}`,
    `123bots-${locationCore}`,
  ];

  return [...new Set(candidates.filter(Boolean))];
};

const getVideoMimeType = (videoUrl) => {
  const normalized = (videoUrl || '').toLowerCase();
  if (normalized.endsWith('.mp4') || normalized.includes('.mp4?')) return 'video/mp4';
  if (normalized.endsWith('.webm') || normalized.includes('.webm?')) return 'video/webm';
  if (normalized.endsWith('.mov') || normalized.includes('.mov?')) return 'video/quicktime';
  return 'video/webm';
};

const LocationPage = () => {
  const { slug } = useParams();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const [heroSettings, setHeroSettings] = useState({
    hero_background_image_url: BACKGROUND_IMAGE,
    hero_video_url: HERO_VIDEO_DEFAULT,
  });

  useEffect(() => {
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

  useEffect(() => {
    const fetchLocationPage = async () => {
      try {
        setLoading(true);
        const slugCandidates = buildSlugCandidates(slug);
        let pageHtml = null;

        for (const slugCandidate of slugCandidates) {
          try {
            const response = await axios.get(
              `${BACKEND_URL}/api/locations/${slugCandidate}`,
              { responseType: 'text' }
            );
            pageHtml = response.data;
            break;
          } catch (candidateError) {
            if (candidateError?.response?.status && candidateError.response.status !== 404) {
              throw candidateError;
            }
          }
        }

        if (!pageHtml) {
          throw new Error('Location page not found');
        }

        setHtml(pageHtml);
        setError(null);
      } catch (err) {
        console.error('Error fetching location page:', err);
        setError('Location page not found');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchLocationPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(${heroSettings.hero_background_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
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
        <div className="fixed inset-0 bg-gradient-to-br from-[#2c1810]/65 via-[#3a1f12]/55 to-[#1a0f0a]/65 z-10" />
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff8c42]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div 
          className="fixed inset-0 z-0"
          style={{ 
            backgroundImage: `url(${heroSettings.hero_background_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <video
          autoPlay
          muted
          loop
          playsInline
          className="fixed inset-0 w-full h-full object-cover z-[1] pointer-events-none"
        >
          <source src={heroSettings.hero_video_url} type={getVideoMimeType(heroSettings.hero_video_url)} />
        </video>
        <div className="fixed inset-0 bg-gradient-to-br from-[#2c1810]/65 via-[#3a1f12]/55 to-[#1a0f0a]/65 z-10" />
        <div className="relative z-20 flex items-center justify-center min-h-screen text-white">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-[#ff8c42]">404</h1>
            <p className="text-[#ffd4b8]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
        <div 
          className="relative z-20 location-page-container"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <ChatWidget />
    </>
  );
};

export default LocationPage;
