import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Star } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const scrollRefLeft = useRef(null);
  const scrollRefRight = useRef(null);
  const animationRefLeft = useRef(null);
  const animationRefRight = useRef(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, []);

  // Auto-scroll animation for LEFT direction (top row)
  useEffect(() => {
    if (!scrollRefLeft.current || reviews.length === 0 || isPaused) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;
    const containerWidth = scrollRefLeft.current.scrollWidth / 2;

    const animate = () => {
      if (scrollRefLeft.current && !isPaused) {
        scrollPosition += scrollSpeed;
        if (scrollPosition >= containerWidth) {
          scrollPosition = 0;
        }
        scrollRefLeft.current.scrollLeft = scrollPosition;
      }
      animationRefLeft.current = requestAnimationFrame(animate);
    };

    animationRefLeft.current = requestAnimationFrame(animate);

    return () => {
      if (animationRefLeft.current) {
        cancelAnimationFrame(animationRefLeft.current);
      }
    };
  }, [reviews, isPaused]);

  // Auto-scroll animation for RIGHT direction (bottom row)
  useEffect(() => {
    if (!scrollRefRight.current || reviews.length === 0 || isPaused) return;

    const containerWidth = scrollRefRight.current.scrollWidth / 2;
    let scrollPosition = containerWidth; // Start from the end
    const scrollSpeed = 0.5;

    const animate = () => {
      if (scrollRefRight.current && !isPaused) {
        scrollPosition -= scrollSpeed;
        if (scrollPosition <= 0) {
          scrollPosition = containerWidth;
        }
        scrollRefRight.current.scrollLeft = scrollPosition;
      }
      animationRefRight.current = requestAnimationFrame(animate);
    };

    animationRefRight.current = requestAnimationFrame(animate);

    return () => {
      if (animationRefRight.current) {
        cancelAnimationFrame(animationRefRight.current);
      }
    };
  }, [reviews, isPaused]);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API}/reviews/public?limit=50&min_rating=4`);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reviews/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ReviewCard = ({ review }) => (
    <div className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Stars */}
      <div className="mb-4">
        {renderStars(review.rating)}
      </div>
      
      {/* Content */}
      <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-4">
        {review.content}
      </p>
      
      {/* Reviewer */}
      <div className="border-t pt-4">
        <p className="font-semibold text-gray-900">{review.customer_name}</p>
        {review.customer_org && (
          <p className="text-sm text-gray-500">{review.customer_org}</p>
        )}
      </div>
      
      {/* Verified badge */}
      {review.is_verified_purchase && (
        <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verified Purchase
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  // Split reviews into two groups for two rows
  const halfLength = Math.ceil(reviews.length / 2);
  const topRowReviews = reviews.slice(0, halfLength);
  const bottomRowReviews = reviews.slice(halfLength);

  // Duplicate for seamless infinite scroll
  const topRowDisplay = [...topRowReviews, ...topRowReviews];
  const bottomRowDisplay = [...bottomRowReviews, ...bottomRowReviews];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted by Researchers Worldwide
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
          Join thousands of customers who rely on Gingerkare for high-quality custom products
        </p>
        
        {/* Stats */}
        {stats && (
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.avg_rating}</span>
            </div>
            <div className="text-gray-600">
              <span className="font-bold text-gray-900">{stats.total_reviews}</span> Verified Reviews
            </div>
          </div>
        )}
      </div>

      {/* Reviews Rows */}
      <div 
        className="space-y-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Top Row - Scrolling Left */}
        <div className="relative w-full">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
          
          <div 
            ref={scrollRefLeft}
            className="flex gap-6 overflow-x-hidden py-2"
            style={{ scrollBehavior: 'auto' }}
          >
            {topRowDisplay.map((review, index) => (
              <ReviewCard key={`top-${review.id}-${index}`} review={review} />
            ))}
          </div>
        </div>

        {/* Bottom Row - Scrolling Right */}
        <div className="relative w-full">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />
          
          <div 
            ref={scrollRefRight}
            className="flex gap-6 overflow-x-hidden py-2"
            style={{ scrollBehavior: 'auto' }}
          >
            {bottomRowDisplay.map((review, index) => (
              <ReviewCard key={`bottom-${review.id}-${index}`} review={review} />
            ))}
          </div>
        </div>
      </div>

      {/* Hover instruction */}
      <p className="text-center text-sm text-gray-400 mt-6">
        Hover to pause and read
      </p>
    </section>
  );
};

export default ReviewsSection;
