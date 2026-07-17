import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, CreditCard, 
  Gift, Shield, MapPin, User, Phone, Mail, Building, Check,
  Package, Truck, Lock, AlertCircle, Loader2, Smartphone, DollarSign,
  Clock, Zap, Box, Repeat, Tag, X
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Switch } from '../components/ui/switch';
import { toast } from '../hooks/use-toast';
import { getDisplayOptionSummary } from '../lib/productOptions';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, name: 'Cart', icon: ShoppingCart },
  { id: 2, name: 'Shipping', icon: Truck },
  { id: 3, name: 'Payment', icon: CreditCard },
  { id: 4, name: 'Review', icon: Check }
];

const US_STATES = [
  { value: '', label: 'Select State' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { isAuthenticated, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessFlags, setAccessFlags] = useState({
    cart_enabled: true,
    pawn_checkout: true,
    require_account_for_checkout: false,
    require_email_verification_for_registration: true,
  });
  const [loadingAccessFlags, setLoadingAccessFlags] = useState(true);
  
  // Payment gateway state
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [cashAppVenmoSettings, setCashAppVenmoSettings] = useState(null);
  const [paypalSettings, setPaypalSettings] = useState(null);
  const [stripeSettings, setStripeSettings] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card'); // 'card' (Durango), 'stripe', 'cashapp', 'venmo', 'paypal'
  const [collectJsLoaded, setCollectJsLoaded] = useState(false);
  const [paymentToken, setPaymentToken] = useState(null);
  const [cardData, setCardData] = useState({ cardNumber: false, cardExpiry: false, cardCvv: false });
  const collectJsRef = useRef(null);
  
  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    specialInstructions: ''
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
    billingAddressSame: true
  });
  
  const [billingInfo, setBillingInfo] = useState({
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Tax settings state
  const [taxSettings, setTaxSettings] = useState({ tax_enabled: true, tax_rates: [], combined_rate: 0 });
  const [loadingTaxSettings, setLoadingTaxSettings] = useState(true);
  const [customerTaxExempt, setCustomerTaxExempt] = useState(false);
  
  // Shipping rates state
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState(null);
  const [loadingShippingRates, setLoadingShippingRates] = useState(false);
  
  // Local pickup state
  const [localPickupSettings, setLocalPickupSettings] = useState({ enabled: false, locations: [] });
  const [selectedPickupLocation, setSelectedPickupLocation] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('shipping'); // 'shipping' or 'pickup'
  
  // Discount/Coupon state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [freeShippingEligible, setFreeShippingEligible] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(100);
  
  // Recurring order state
  const [isRecurringOrder, setIsRecurringOrder] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(30);
  
  // Session ID for cart tracking
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('cart_session_id');
    if (!id) {
      id = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('cart_session_id', id);
    }
    return id;
  });

  // Track cart for abandoned cart recovery
  const trackCart = async () => {
    if (cartItems.length === 0) return;
    
    try {
      await fetch(`${API_URL}/api/abandoned-carts/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          email: shippingInfo.email || null,
          user_id: null, // Could get from auth context if user is logged in
          user_name: shippingInfo.firstName && shippingInfo.lastName 
            ? `${shippingInfo.firstName} ${shippingInfo.lastName}` 
            : null,
          items: cartItems.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.images?.[0] || item.image || null
          })),
          subtotal: getCartTotal()
        })
      });
    } catch (error) {
      console.error('Failed to track cart:', error);
    }
  };

  // Track cart when items or email changes
  useEffect(() => {
    trackCart();
  }, [cartItems, shippingInfo.email]);

  useEffect(() => {
    const fetchAccessFlags = async () => {
      try {
        const [siteResponse, featureResponse] = await Promise.all([
          fetch(`${API_URL}/api/settings/site`),
          fetch(`${API_URL}/api/settings/feature-flags`),
        ]);

        let siteData = {};
        let featureData = {};

        if (siteResponse.ok) {
          siteData = await siteResponse.json();
        }

        if (featureResponse.ok) {
          featureData = await featureResponse.json();
        }

        if (siteResponse.ok || featureResponse.ok) {
          setAccessFlags({
            cart_enabled: featureData.cart_enabled !== false,
            pawn_checkout: featureData.pawn_checkout !== false,
            require_account_for_checkout: Boolean(siteData.require_account_for_checkout),
            require_email_verification_for_registration:
              siteData.require_email_verification_for_registration !== false,
          });
        }
      } catch (error) {
        console.error('Error fetching checkout access flags:', error);
      } finally {
        setLoadingAccessFlags(false);
      }
    };

    fetchAccessFlags();
  }, []);

  // Mark cart as completed when order is placed
  const markCartCompleted = async () => {
    try {
      await fetch(`${API_URL}/api/abandoned-carts/mark-completed?session_id=${sessionId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to mark cart completed:', error);
    }
  };

  // Fetch tax settings on mount
  useEffect(() => {
    const fetchTaxSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin-settings/tax`);
        if (response.ok) {
          const data = await response.json();
          // Calculate combined rate from active tax rates
          const combinedRate = data.tax_enabled 
            ? (data.tax_rates || [])
                .filter(r => r.active)
                .reduce((sum, r) => sum + (r.rate || 0), 0)
            : 0;
          setTaxSettings({
            tax_enabled: data.tax_enabled ?? true,
            tax_rates: data.tax_rates || [],
            combined_rate: combinedRate
          });
        }
      } catch (error) {
        console.error('Error fetching tax settings:', error);
        // Default to 0% if fetch fails
        setTaxSettings({ tax_enabled: false, tax_rates: [], combined_rate: 0 });
      } finally {
        setLoadingTaxSettings(false);
      }
    };
    fetchTaxSettings();
  }, []);

  // Check if the logged-in customer is tax exempt
  useEffect(() => {
    const fetchExempt = async () => {
      if (!token) { setCustomerTaxExempt(false); return; }
      try {
        const res = await fetch(`${API_URL}/api/tax-exempt/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setCustomerTaxExempt(Boolean(data.tax_exempt));
        }
      } catch (e) {
        setCustomerTaxExempt(false);
      }
    };
    fetchExempt();
  }, [token]);

  // Fetch local pickup settings on mount
  useEffect(() => {
    const fetchLocalPickupSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings/local-pickup`);
        if (response.ok) {
          const data = await response.json();
          setLocalPickupSettings(data);
        }
      } catch (error) {
        console.error('Error fetching local pickup settings:', error);
      }
    };
    fetchLocalPickupSettings();
  }, []);

  // Calculate totals - now using dynamic tax rate and discount
  const subtotal = getCartTotal();
  const discountAmount = appliedDiscount?.discount_amount || 0;
  const discountedSubtotal = subtotal - discountAmount;
  // Shipping is $0 for local pickup
  const shippingCost = deliveryMethod === 'pickup' ? 0 : (selectedShippingRate?.rate_with_upcharge || selectedShippingRate?.rate || (subtotal > 100 ? 0 : 15));
  const taxRate = taxSettings.combined_rate / 100; // Convert percentage to decimal
  const tax = customerTaxExempt ? 0 : discountedSubtotal * taxRate;
  const total = discountedSubtotal + shippingCost + tax;
  
  // Apply discount code handler
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }
    
    setApplyingDiscount(true);
    setDiscountError('');
    
    try {
      const response = await fetch(`${API_URL}/api/store/discounts/validate?code=${encodeURIComponent(discountCode)}&order_total=${subtotal}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppliedDiscount(data);
        setDiscountCode('');
        toast({
          title: 'Discount Applied!',
          description: `${data.discount.code}: ${data.discount.discount_type === 'percentage' ? `${data.discount.value}% off` : `$${data.discount.value} off`}`,
        });
      } else {
        const errorData = await response.json();
        setDiscountError(errorData.detail || 'Invalid discount code');
      }
    } catch (error) {
      setDiscountError('Failed to apply discount code');
    } finally {
      setApplyingDiscount(false);
    }
  };
  
  // Remove discount handler
  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    toast({
      title: 'Discount Removed',
      description: 'The discount code has been removed from your order.',
    });
  };

  // Fetch shipping rates when address is complete
  const fetchShippingRates = async () => {
    if (!shippingInfo.address1 || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      return;
    }
    
    setLoadingShippingRates(true);
    try {
      const response = await fetch(`${API_URL}/api/shipping/rates/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_address: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            street1: shippingInfo.address1,
            street2: shippingInfo.address2,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zip_code: shippingInfo.zipCode,
            country: shippingInfo.country || 'US',
            phone: shippingInfo.phone,
            email: shippingInfo.email
          },
          weight_oz: undefined, // computed server-side from items below
          items: cartItems.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          order_subtotal: subtotal
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setShippingRates(data.rates || []);
        setFreeShippingEligible(data.free_shipping_eligible);
        setFreeShippingThreshold(data.free_shipping_threshold);
        
        // Auto-select cheapest rate
        if (data.rates && data.rates.length > 0) {
          const cheapest = data.rates.reduce((min, rate) => 
            (rate.rate_with_upcharge || rate.rate) < (min.rate_with_upcharge || min.rate) ? rate : min
          , data.rates[0]);
          setSelectedShippingRate(cheapest);
        }
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      // Use fallback rates
      setShippingRates([
        { carrier: 'Standard', service: 'Ground Shipping', rate: 15, rate_with_upcharge: 15, estimated_days: 5, rate_id: 'fallback_ground', is_free: false },
        { carrier: 'USPS', service: 'Priority Mail', rate: 8.50, rate_with_upcharge: 8.50, estimated_days: 3, rate_id: 'fallback_priority', is_free: false },
        { carrier: 'USPS', service: 'Express', rate: 26.50, rate_with_upcharge: 26.50, estimated_days: 1, rate_id: 'fallback_express', is_free: false }
      ]);
    }
    setLoadingShippingRates(false);
  };

  // Fetch rates when shipping address changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shippingInfo.zipCode && shippingInfo.city && shippingInfo.state) {
        fetchShippingRates();
      }
    }, 500); // Debounce
    
    return () => clearTimeout(timer);
  }, [shippingInfo.zipCode, shippingInfo.city, shippingInfo.state, subtotal]);

  const fetchPaymentSettings = useCallback(async () => {
    try {
      // Fetch Durango (card) settings
      const durangoRes = await fetch(`${API_URL}/api/payments/settings/durango/public`);
      if (durangoRes.ok) {
        const data = await durangoRes.json();
        setPaymentSettings(data);
      }

      // Fetch CashApp/Venmo settings
      const cashAppRes = await fetch(`${API_URL}/api/payments/settings/cashapp-venmo/public`);
      if (cashAppRes.ok) {
        const data = await cashAppRes.json();
        setCashAppVenmoSettings(data);
      }

      const paypalRes = await fetch(`${API_URL}/api/payments/settings/paypal/public`);
      if (paypalRes.ok) {
        const data = await paypalRes.json();
        setPaypalSettings(data);
      }

      // Fetch Stripe (card) settings
      const stripeRes = await fetch(`${API_URL}/api/payments/settings/stripe/public`);
      if (stripeRes.ok) {
        const data = await stripeRes.json();
        setStripeSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  }, []);

  // Fetch payment settings on mount
  useEffect(() => {
    fetchPaymentSettings();
  }, [fetchPaymentSettings]);

  // Refetch payment settings every time user enters payment step
  useEffect(() => {
    if (currentStep === 3) {
      fetchPaymentSettings();
    }
  }, [currentStep, fetchPaymentSettings]);

  // Pick a sensible default payment method based on which gateways are enabled
  useEffect(() => {
    const available = {
      card: !!paymentSettings?.is_enabled,
      stripe: !!stripeSettings?.is_enabled,
      cashapp: !!(cashAppVenmoSettings?.is_enabled && cashAppVenmoSettings?.cashapp_available),
      venmo: !!(cashAppVenmoSettings?.is_enabled && cashAppVenmoSettings?.venmo_available),
      paypal: !!(paypalSettings?.is_enabled && paypalSettings?.is_available),
    };
    // If any gateway is enabled and the current selection isn't available, switch to the first available
    const anyEnabled = Object.values(available).some(Boolean);
    if (anyEnabled && !available[selectedPaymentMethod]) {
      const order = ['card', 'stripe', 'cashapp', 'venmo', 'paypal'];
      const next = order.find((m) => available[m]);
      if (next) setSelectedPaymentMethod(next);
    }
  }, [paymentSettings, stripeSettings, cashAppVenmoSettings, paypalSettings, selectedPaymentMethod]);

  // Handle return from Stripe hosted checkout (poll status, then confirm)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSession = params.get('stripe_session');
    const cancelled = params.get('stripe_cancelled');
    if (cancelled) {
      toast({ title: 'Payment Cancelled', description: 'Your Stripe payment was cancelled. You can try again.', variant: 'destructive' });
      return;
    }
    if (!stripeSession) return;

    let attempts = 0;
    const maxAttempts = 6;
    setIsProcessing(true);
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/api/payments/stripe/status/${stripeSession}`);
        const data = await res.json();
        if (data.payment_status === 'paid') {
          if (data.order) {
            sessionStorage.setItem('lastOrder', JSON.stringify({
              orderId: data.order.order_number,
              ...data.order,
              payment_method: 'stripe',
              createdAt: data.order.created_at,
            }));
          }
          await markCartCompleted();
          clearCart();
          setIsProcessing(false);
          navigate('/order-confirmation');
          return;
        }
        if (data.status === 'expired') {
          setIsProcessing(false);
          toast({ title: 'Payment Expired', description: 'The Stripe session expired. Please try again.', variant: 'destructive' });
          return;
        }
        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setIsProcessing(false);
          toast({ title: 'Payment Pending', description: 'We could not confirm your payment yet. Check your email for confirmation.', variant: 'destructive' });
        }
      } catch (e) {
        setIsProcessing(false);
        toast({ title: 'Error', description: 'Unable to verify Stripe payment status.', variant: 'destructive' });
      }
    };
    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Collect.js when payment settings are available and user reaches payment step (only for card payments)
  useEffect(() => {
    if (currentStep === 3 && selectedPaymentMethod === 'card' && paymentSettings?.is_enabled && paymentSettings?.tokenization_key && !collectJsLoaded) {
      loadCollectJs();
    }
  }, [currentStep, paymentSettings, collectJsLoaded, selectedPaymentMethod]);

  const loadCollectJs = useCallback(() => {
    // Check if already loaded
    if (window.CollectJS) {
      initCollectJs();
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = paymentSettings.collect_js_url || 'https://secure.durango-direct.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', paymentSettings.tokenization_key);
    script.async = true;
    
    script.onload = () => {
      setTimeout(initCollectJs, 100);
    };
    
    script.onerror = () => {
      console.error('Failed to load Collect.js');
      toast({
        title: 'Payment Error',
        description: 'Failed to load secure payment form. Please try again.',
        variant: 'destructive'
      });
    };
    
    document.head.appendChild(script);
  }, [paymentSettings]);

  const initCollectJs = useCallback(() => {
    if (!window.CollectJS) return;
    
    try {
      window.CollectJS.configure({
        variant: 'inline',
        styleSniffer: true,
        googleFont: 'Manrope:400',
        customCss: {
          'border-radius': '12px',
          'border': '1px solid #e2e8f0',
          'padding': '14px 16px',
          'font-size': '15px',
          'font-family': '"Manrope", system-ui, sans-serif',
          'background-color': '#ffffff',
          'color': '#1e293b'
        },
        focusCss: {
          'border-color': '#a855f7',
          'box-shadow': '0 0 0 3px rgba(168, 85, 247, 0.15)'
        },
        invalidCss: {
          'border-color': '#ef4444',
          'background-color': '#fef2f2'
        },
        placeholderCss: {
          'color': '#94a3b8'
        },
        fields: {
          ccnumber: {
            selector: '#collect-cc-number',
            title: 'Card Number',
            placeholder: '4111 1111 1111 1111'
          },
          ccexp: {
            selector: '#collect-cc-exp',
            title: 'Expiration Date',
            placeholder: 'MM / YY'
          },
          cvv: {
            selector: '#collect-cc-cvv',
            title: 'CVV',
            placeholder: '•••'
          }
        },
        fieldsAvailableCallback: () => {
          setCollectJsLoaded(true);
        },
        validationCallback: (field, status, message) => {
          setCardData(prev => ({
            ...prev,
            [field === 'ccnumber' ? 'cardNumber' : field === 'ccexp' ? 'cardExpiry' : 'cardCvv']: status
          }));
        },
        callback: (response) => {
          if (response.token) {
            setPaymentToken(response.token);
            // Auto-advance to review step
            setCurrentStep(4);
          } else {
            toast({
              title: 'Card Error',
              description: response.errorMessage || 'Please check your card details.',
              variant: 'destructive'
            });
          }
        }
      });
      
      collectJsRef.current = window.CollectJS;
    } catch (error) {
      console.error('Error initializing Collect.js:', error);
    }
  }, []);

  // Validation functions
  const validateShipping = () => {
    const newErrors = {};
    if (!shippingInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!shippingInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!shippingInfo.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) newErrors.email = 'Invalid email format';
    if (!shippingInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(shippingInfo.phone.replace(/\s/g, ''))) 
      newErrors.phone = 'Invalid phone format';
    if (!shippingInfo.address1.trim()) newErrors.address1 = 'Address is required';
    if (!shippingInfo.city.trim()) newErrors.city = 'City is required';
    if (!shippingInfo.state) newErrors.state = 'State is required';
    if (!shippingInfo.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    else if (!/^\d{5}(-\d{4})?$/.test(shippingInfo.zipCode)) newErrors.zipCode = 'Invalid ZIP code';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePayment = () => {
    // Stripe (redirect), CashApp, Venmo, or PayPal - no inline card validation needed
    if (selectedPaymentMethod === 'stripe' || selectedPaymentMethod === 'cashapp' || selectedPaymentMethod === 'venmo' || selectedPaymentMethod === 'paypal') {
      return true;
    }
    
    // If using Collect.js (Durango enabled), check if card fields are valid
    if (paymentSettings?.is_enabled && collectJsLoaded) {
      if (!paymentInfo.cardName.trim()) {
        setErrors({ cardName: 'Name on card is required' });
        return false;
      }
      if (!cardData.cardNumber || !cardData.cardExpiry || !cardData.cardCvv) {
        toast({
          title: 'Card Information Required',
          description: 'Please fill in all card details.',
          variant: 'destructive'
        });
        return false;
      }
      return true;
    }
    
    // Manual validation for fallback mode
    const newErrors = {};
    if (!paymentInfo.cardNumber.replace(/\s/g, '').trim()) newErrors.cardNumber = 'Card number is required';
    else if (!/^\d{16}$/.test(paymentInfo.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Invalid card number';
    if (!paymentInfo.cardName.trim()) newErrors.cardName = 'Name on card is required';
    if (!paymentInfo.expiry.trim()) newErrors.expiry = 'Expiry date is required';
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentInfo.expiry)) newErrors.expiry = 'Invalid format (MM/YY)';
    if (!paymentInfo.cvv.trim()) newErrors.cvv = 'CVV is required';
    else if (!/^\d{3,4}$/.test(paymentInfo.cvv)) newErrors.cvv = 'Invalid CVV';
    
    if (!paymentInfo.billingAddressSame) {
      if (!billingInfo.address1.trim()) newErrors.billingAddress1 = 'Billing address is required';
      if (!billingInfo.city.trim()) newErrors.billingCity = 'City is required';
      if (!billingInfo.state) newErrors.billingState = 'State is required';
      if (!billingInfo.zipCode.trim()) newErrors.billingZipCode = 'ZIP code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleQuantityChange = (itemIdentifier, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemIdentifier);
    } else {
      updateQuantity(itemIdentifier, newQuantity);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && cartItems.length === 0) {
      toast({ title: 'Cart is empty', description: 'Add items to continue.', variant: 'destructive' });
      return;
    }
    if (currentStep === 2 && !validateShipping()) {
      toast({ title: 'Missing Information', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    // Validate shipping method selection - allow local pickup OR shipping rate
    if (currentStep === 2) {
      if (deliveryMethod === 'pickup' && !selectedPickupLocation) {
        toast({ title: 'Select Location', description: 'Please select a pickup location to continue.', variant: 'destructive' });
        return;
      }
      if (deliveryMethod === 'shipping' && !selectedShippingRate) {
        toast({ title: 'Select Shipping', description: 'Please select a shipping method to continue.', variant: 'destructive' });
        return;
      }
    }
    if (currentStep === 3) {
      if (!validatePayment()) {
        return;
      }
      // If using Collect.js for card payment, trigger tokenization
      if (selectedPaymentMethod === 'card' && paymentSettings?.is_enabled && collectJsLoaded && collectJsRef.current) {
        collectJsRef.current.startPaymentRequest();
        return; // Will advance to step 4 in callback
      }
      // For CashApp/Venmo/PayPal or demo mode, advance directly
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };
  
  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selected_strength: item.selected_strength,
          selected_package: item.selected_package,
          selected_options: item.selected_options || null,
          custom_image_url: item.custom_image_url || null,
          custom_notes: item.custom_notes || null,
        })),
        shipping: shippingInfo,
        billing: paymentInfo.billingAddressSame ? shippingInfo : billingInfo,
        subtotal,
        shipping_cost: shippingCost,
        tax,
        total,
        customer_email: shippingInfo.email,
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        payment_method: selectedPaymentMethod,
        is_recurring: isRecurringOrder,
        recurring_interval_days: isRecurringOrder ? recurringInterval : null,
        origin_url: window.location.origin,
        // Include selected shipping rate details
        selected_shipping: selectedShippingRate ? {
          provider: selectedShippingRate.provider,
          carrier: selectedShippingRate.carrier,
          service: selectedShippingRate.service,
          rate: selectedShippingRate.rate,
          rate_with_upcharge: selectedShippingRate.rate_with_upcharge,
          rate_id: selectedShippingRate.rate_id,
          estimated_days: selectedShippingRate.estimated_days,
          is_free: selectedShippingRate.is_free || false
        } : null,
        // Include local pickup info if selected
        delivery_method: deliveryMethod,
        local_pickup: deliveryMethod === 'pickup' && selectedPickupLocation ? {
          location_id: selectedPickupLocation.id,
          location_name: selectedPickupLocation.name,
          address: selectedPickupLocation.address,
          city: selectedPickupLocation.city,
          state: selectedPickupLocation.state,
          zip_code: selectedPickupLocation.zip_code,
          phone: selectedPickupLocation.phone,
          hours: selectedPickupLocation.hours,
          notes: selectedPickupLocation.notes
        } : null
      };
      
      const authHeaders = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Validate cart stock against Johnny 5 pricing/stock sheet (local cart support)
      const stockPayload = {
        items: cartItems.map((item) => ({
          sku: item.sku || null,
          product_id: item.id,
          selected_strength: item.selected_strength || null,
          selected_package: item.selected_package || null,
          quantity: item.quantity,
        })),
      };

      const stockCheckResponse = await fetch(`${API_URL}/api/johnny5/local/stock/check`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(stockPayload),
      });

      if (stockCheckResponse.ok) {
        const stockCheck = await stockCheckResponse.json();
        const stockResults = stockCheck?.results || [];

        const blockingItems = stockResults.filter((result) =>
          ['insufficient', 'not_found', 'missing_reference'].includes(result.status)
        );

        if (blockingItems.length > 0) {
          const firstBlocked = blockingItems[0];
          toast({
            title: 'Stock issue detected',
            description: `✕ ${firstBlocked.product_name || firstBlocked.sku || 'Item'} is out of stock${firstBlocked.estimated_restock ? ` (ETA: ${firstBlocked.estimated_restock})` : ''}.`,
            variant: 'destructive',
          });
          return;
        }

        const preorderItems = stockResults.filter((result) => result.status === 'preorder_allowed');
        if (preorderItems.length > 0) {
          const needsNoDatePrompt = preorderItems.some((result) => result.preorder_without_exact_restock_prompt);
          if (needsNoDatePrompt) {
            const shouldPreorder = window.confirm(
              'One or more items are out of stock without an exact restock date. Would you like to place this order as pre-order?'
            );
            if (!shouldPreorder) {
              return;
            }
          }

          const preorderSummary = preorderItems
            .map((item) => `${item.product_name || item.sku || item.product_id}`)
            .join(', ');
          orderData.notes = orderData.notes
            ? `${orderData.notes} | Pre-order items: ${preorderSummary}`
            : `Pre-order items: ${preorderSummary}`;
        }
      }

      // Handle CashApp/Venmo/PayPal orders
      if (selectedPaymentMethod === 'cashapp' || selectedPaymentMethod === 'venmo' || selectedPaymentMethod === 'paypal') {
        const response = await fetch(`${API_URL}/api/payments/orders`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(orderData)
        });

        if (response.status === 401) {
          toast({
            title: 'Sign In Required',
            description: 'Please register or sign in before checkout.',
            variant: 'destructive'
          });
          navigate('/register');
          return;
        }
        
        const result = await response.json();
        
        if (result.success) {
          const paymentResult = result.payment || {};
          sessionStorage.setItem('lastOrder', JSON.stringify({
            orderId: result.order.order_number,
            ...result.order,
            payment_method: selectedPaymentMethod,
            awaiting_payment: true,
            payment_setup_mode: paymentResult.setup_mode || null,
            payment_link: paymentResult.payment_link || null,
            payment_approval_url: paymentResult.approval_url || null,
            createdAt: result.order.created_at
          }));
          await markCartCompleted();
          clearCart();

          if (selectedPaymentMethod === 'paypal' && paymentResult.approval_url) {
            window.location.href = paymentResult.approval_url;
            return;
          }

          navigate('/order-confirmation');
        } else {
          toast({
            title: 'Order Failed',
            description: result.message || 'Please try again.',
            variant: 'destructive'
          });
        }
        return;
      }

      // Handle Stripe hosted checkout (redirect flow)
      if (selectedPaymentMethod === 'stripe') {
        const response = await fetch(`${API_URL}/api/payments/orders`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(orderData)
        });

        if (response.status === 401) {
          toast({
            title: 'Sign In Required',
            description: 'Please register or sign in before checkout.',
            variant: 'destructive'
          });
          navigate('/register');
          return;
        }

        const result = await response.json();

        if (result.success && result.payment?.redirect_url) {
          // Redirect to Stripe-hosted checkout; return is handled by the poll effect
          window.location.href = result.payment.redirect_url;
          return;
        }

        toast({
          title: 'Payment Error',
          description: result.payment?.message || result.detail || 'Unable to start Stripe checkout. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      // Handle Durango card payment
      if (paymentSettings?.is_enabled && paymentToken) {
        orderData.payment_token = paymentToken;
        
        const response = await fetch(`${API_URL}/api/payments/orders`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(orderData)
        });

        if (response.status === 401) {
          toast({
            title: 'Sign In Required',
            description: 'Please register or sign in before checkout.',
            variant: 'destructive'
          });
          navigate('/register');
          return;
        }
        
        const result = await response.json();
        
        if (result.success) {
          sessionStorage.setItem('lastOrder', JSON.stringify({
            orderId: result.order.order_number,
            ...result.order,
            payment_last_four: '****',
            createdAt: result.order.created_at
          }));
          await markCartCompleted();
          clearCart();
          navigate('/order-confirmation');
        } else {
          toast({
            title: 'Payment Failed',
            description: result.payment?.response_message || 'Please try again or use a different card.',
            variant: 'destructive'
          });
        }
      } else {
        // Fallback: simulate order (no real payment processing)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        sessionStorage.setItem('lastOrder', JSON.stringify({
          orderId: `ORD-${Date.now()}`,
          items: cartItems,
          shipping: shippingInfo,
          billing: paymentInfo.billingAddressSame ? shippingInfo : billingInfo,
          subtotal,
          shipping_cost: shippingCost,
          tax,
          total,
          payment_last_four: paymentInfo.cardNumber.slice(-4),
          selected_shipping: selectedShippingRate,
          createdAt: new Date().toISOString()
        }));
        
        await markCartCompleted();
        clearCart();
        navigate('/order-confirmation');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast({ title: 'Order Failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format card number with spaces (for fallback mode)
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const inputClasses = (fieldName) => `
    w-full px-4 py-3 bg-bots-surface border rounded-xl text-white placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
    transition-all ${errors[fieldName] ? 'border-red-400 bg-red-500/100/10' : 'border-gray-700'}
  `;

  if (loadingAccessFlags) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bots-dark" data-testid="checkout-access-loading">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (accessFlags.require_account_for_checkout && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-bots-dark pt-32 pb-24" data-testid="checkout-auth-required-gate">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-700 bg-bots-surface shadow-sm p-8 text-center space-y-4">
            <h1 className="text-3xl font-semibold text-white" data-testid="checkout-auth-required-title">Account Required to View Pricing & Checkout</h1>
            <p className="text-gray-400" data-testid="checkout-auth-required-description">
              You can browse products freely, but pricing and checkout require a registered account.
              {accessFlags.require_email_verification_for_registration ? ' After registration, enter the 6-digit email code to continue.' : ''}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                onClick={() => navigate('/register')}
                data-testid="checkout-gate-register-button"
              >
                Register
              </button>
              <button
                className="px-5 py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-bots-surface transition-colors"
                onClick={() => navigate('/login')}
                data-testid="checkout-gate-login-button"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accessFlags.cart_enabled || !accessFlags.pawn_checkout) {
    return (
      <div className="min-h-screen bg-bots-dark pt-32 pb-24" data-testid="checkout-catalog-mode-gate">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-700 bg-bots-surface shadow-sm p-8 text-center space-y-4">
            <h1 className="text-3xl font-semibold text-white" data-testid="checkout-catalog-mode-title">Catalog Mode Enabled</h1>
            <p className="text-gray-400" data-testid="checkout-catalog-mode-description">
              Shopping cart and checkout are currently disabled. You can continue browsing products.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                onClick={() => navigate('/shop/products')}
                data-testid="checkout-catalog-mode-browse-button"
              >
                Browse Catalog
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bots-dark pt-32 pb-32" data-testid="checkout-page">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-10">
          <div className="flex items-center justify-center">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div 
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer
                    ${currentStep === step.id 
                      ? 'bg-gradient-to-r from-blue-600 to-green-500 text-white shadow-lg shadow-blue-500/25' 
                      : currentStep > step.id 
                        ? 'bg-green-500/100/20 text-green-400 border border-green-500/30'
                        : 'bg-bots-surface text-gray-500 border border-gray-700'}`}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  data-testid={`step-${step.id}`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="font-medium text-sm hidden sm:inline">{step.name}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500/100' : 'bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
            {STEPS[currentStep - 1].name}
          </h1>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Cart Review */}
              {currentStep === 1 && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {cartItems.length === 0 ? (
                    <div className="text-center py-16 bg-bots-surface rounded-2xl border border-gray-700">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-bots-dark flex items-center justify-center border border-gray-700">
                        <ShoppingCart className="w-10 h-10 text-gray-600" />
                      </div>
                      <h2 className="font-heading text-xl text-white mb-2">Your cart is empty</h2>
                      <p className="text-gray-400 mb-6">Add some products to get started</p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
                      >
                        Browse Catalog
                      </Link>
                    </div>
                  ) : (
                    <>
                      {cartItems.map((item, index) => (
                        <motion.div
                          key={item.cart_key || item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-4 p-5 bg-bots-surface border border-gray-700 rounded-2xl hover:border-blue-500/30 hover:shadow-md transition-all"
                          data-testid={`cart-item-${item.cart_key || item.id}`}
                        >
                          <div className="w-24 h-24 rounded-xl overflow-hidden bg-bots-dark flex-shrink-0 border border-gray-700">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=200'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Gift className="w-3 h-3 text-blue-400" />
                                  <span className="text-xs font-mono text-gray-500 uppercase">
                                    {item.category || 'Product'}
                                  </span>
                                </div>
                                <h3 className="font-heading font-semibold text-white">{item.name}</h3>
                                {getDisplayOptionSummary(item) && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {getDisplayOptionSummary(item)}
                                  </p>
                                )}
                                {item.custom_notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">Notes: {item.custom_notes}</p>}
                                {item.custom_image_url && <p className="text-xs text-gray-500 mt-1">Custom image attached</p>}
                              </div>
                              <button
                                onClick={() => removeFromCart(item.cart_key || item.id)}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/100/100/10 rounded-lg transition-all"
                                data-testid={`remove-item-${item.cart_key || item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuantityChange(item.cart_key || item.id, item.quantity - 1)}
                                  className="w-8 h-8 rounded-lg bg-bots-dark border border-gray-700 text-gray-400 hover:border-blue-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-mono text-white">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.cart_key || item.id, item.quantity + 1)}
                                  className="w-8 h-8 rounded-lg bg-bots-dark border border-gray-700 text-gray-400 hover:border-blue-500 hover:text-white transition-all flex items-center justify-center"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="font-mono text-lg font-bold text-blue-400">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      <button
                        onClick={clearCart}
                        className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/100/100/10 transition-all font-medium"
                        data-testid="clear-cart-btn"
                      >
                        Clear Cart
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Step 2: Shipping Information */}
              {currentStep === 2 && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-bots-surface border border-gray-700 rounded-2xl p-6 md:p-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl font-bold text-white">Shipping Information</h2>
                      <p className="text-sm text-gray-400">Where should we deliver your order?</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        First Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={shippingInfo.firstName}
                          onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                          className={`${inputClasses('firstName')} pl-10`}
                          placeholder="John"
                          data-testid="shipping-first-name"
                        />
                      </div>
                      {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                        className={inputClasses('lastName')}
                        placeholder="Doe"
                        data-testid="shipping-last-name"
                      />
                      {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={shippingInfo.email}
                          onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                          className={`${inputClasses('email')} pl-10`}
                          placeholder="john@example.com"
                          data-testid="shipping-email"
                        />
                      </div>
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="tel"
                          value={shippingInfo.phone}
                          onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                          className={`${inputClasses('phone')} pl-10`}
                          placeholder="(555) 123-4567"
                          data-testid="shipping-phone"
                        />
                      </div>
                      {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Company / Institution <span className="text-gray-500">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={shippingInfo.company}
                          onChange={(e) => setShippingInfo({...shippingInfo, company: e.target.value})}
                          className={`${inputClasses('company')} pl-10`}
                          placeholder="Company name (optional)"
                          data-testid="shipping-company"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Street Address <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={shippingInfo.address1}
                          onChange={(e) => setShippingInfo({...shippingInfo, address1: e.target.value})}
                          className={`${inputClasses('address1')} pl-10`}
                          placeholder="123 Main Street"
                          data-testid="shipping-address1"
                        />
                      </div>
                      {errors.address1 && <p className="text-red-400 text-xs mt-1">{errors.address1}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Apt, Suite, Unit <span className="text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.address2}
                        onChange={(e) => setShippingInfo({...shippingInfo, address2: e.target.value})}
                        className={inputClasses('address2')}
                        placeholder="Apt 4B, Suite 200, etc."
                        data-testid="shipping-address2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                        className={inputClasses('city')}
                        placeholder="Miami"
                        data-testid="shipping-city"
                      />
                      {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        State <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                        className={inputClasses('state')}
                        data-testid="shipping-state"
                      >
                        {US_STATES.map(state => (
                          <option key={state.value} value={state.value} className="bg-bots-dark text-white">{state.label}</option>
                        ))}
                      </select>
                      {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        ZIP Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                        className={inputClasses('zipCode')}
                        placeholder="33101"
                        maxLength="10"
                        data-testid="shipping-zip"
                      />
                      {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                      <input
                        type="text"
                        value="United States"
                        disabled
                        className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Delivery Instructions <span className="text-gray-500">(Optional)</span>
                      </label>
                      <textarea
                        value={shippingInfo.specialInstructions}
                        onChange={(e) => setShippingInfo({...shippingInfo, specialInstructions: e.target.value})}
                        className={`${inputClasses('specialInstructions')} resize-none`}
                        placeholder="Gate code, leave at door, etc."
                        rows="2"
                        data-testid="shipping-instructions"
                      />
                    </div>
                  </div>
                  
                  {/* Shipping Method Selection */}
                  {shippingInfo.zipCode && shippingInfo.city && shippingInfo.state && (
                    <div className="mt-8 pt-8 border-t border-gray-700">
                      {/* Delivery Method Selector - Show only if local pickup is enabled */}
                      {localPickupSettings.enabled && localPickupSettings.locations.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-heading text-lg font-bold text-white">Delivery Method</h3>
                              <p className="text-sm text-gray-400">Choose how to receive your order</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {/* Ship to Address Option */}
                            <button
                              onClick={() => {
                                setDeliveryMethod('shipping');
                                setSelectedPickupLocation(null);
                              }}
                              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                deliveryMethod === 'shipping'
                                  ? 'border-blue-500 bg-blue-500/10'
                                  : 'border-gray-700 hover:border-gray-600 bg-bots-dark'
                              }`}
                              data-testid="delivery-method-shipping"
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                deliveryMethod === 'shipping' ? 'bg-blue-600' : 'bg-bots-surface'
                              }`}>
                                <Truck className={`w-6 h-6 ${deliveryMethod === 'shipping' ? 'text-white' : 'text-gray-400'}`} />
                              </div>
                              <div className="text-center">
                                <p className={`font-semibold ${deliveryMethod === 'shipping' ? 'text-blue-400' : 'text-white'}`}>
                                  Ship to Address
                                </p>
                                <p className="text-sm text-gray-500">Delivered to your door</p>
                              </div>
                            </button>
                            
                            {/* Local Pickup Option */}
                            <button
                              onClick={() => {
                                setDeliveryMethod('pickup');
                                setSelectedShippingRate(null);
                              }}
                              className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                deliveryMethod === 'pickup'
                                  ? 'border-green-500 bg-green-500/100/10'
                                  : 'border-gray-700 hover:border-gray-600 bg-bots-dark'
                              }`}
                              data-testid="delivery-method-pickup"
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                deliveryMethod === 'pickup' ? 'bg-green-600' : 'bg-bots-surface'
                              }`}>
                                <MapPin className={`w-6 h-6 ${deliveryMethod === 'pickup' ? 'text-white' : 'text-gray-400'}`} />
                              </div>
                              <div className="text-center">
                                <p className={`font-semibold ${deliveryMethod === 'pickup' ? 'text-green-400' : 'text-white'}`}>
                                  Local Pickup
                                </p>
                                <p className="text-sm text-gray-500">Free - Pick up in store</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Shipping Options - Show only when delivery method is shipping */}
                      {deliveryMethod === 'shipping' && (
                        <>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                              <Truck className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-heading text-lg font-bold text-white">Shipping Method</h3>
                              <p className="text-sm text-gray-400">Select your preferred delivery speed</p>
                            </div>
                          </div>
                      
                      {loadingShippingRates ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                          <span className="text-gray-400">Calculating shipping rates...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Free Shipping Banner */}
                          {!freeShippingEligible && freeShippingThreshold > 0 && (
                            <div className="p-3 bg-green-500/100/10 border border-green-500/30 rounded-xl mb-4">
                              <p className="text-sm text-green-400">
                                <Truck className="w-4 h-4 inline mr-1" />
                                Add <strong>${(freeShippingThreshold - subtotal).toFixed(2)}</strong> more to qualify for <strong>FREE shipping!</strong>
                              </p>
                            </div>
                          )}
                          
                          {shippingRates.map((rate, index) => {
                            const isSelected = selectedShippingRate?.rate_id === rate.rate_id;
                            const isFree = rate.is_free || rate.rate === 0;
                            const price = rate.rate_with_upcharge || rate.rate || 0;
                            
                            // Determine carrier icon and color
                            let CarrierIcon = Package;
                            let carrierColor = 'bg-bots-dark';
                            let selectedColor = 'bg-blue-600';
                            
                            if (rate.carrier === 'USPS' || rate.carrier?.includes('USPS')) {
                              CarrierIcon = Box;
                              carrierColor = 'bg-blue-100';
                              selectedColor = 'bg-blue-600';
                            } else if (rate.carrier === 'UPS' || rate.carrier?.includes('UPS')) {
                              CarrierIcon = Truck;
                              carrierColor = 'bg-amber-100';
                              selectedColor = 'bg-amber-600';
                            } else if (rate.carrier === 'FedEx' || rate.carrier?.includes('FedEx')) {
                              CarrierIcon = Zap;
                              carrierColor = 'bg-purple-100';
                              selectedColor = 'bg-blue-600';
                            } else if (isFree) {
                              CarrierIcon = Truck;
                              carrierColor = 'bg-green-500/20';
                              selectedColor = 'bg-green-600';
                            }
                            
                            return (
                              <button
                                key={rate.rate_id || index}
                                onClick={() => setSelectedShippingRate(rate)}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                  isSelected
                                    ? isFree ? 'border-green-500 bg-green-500/100/10' : 'border-blue-500 bg-blue-500/10/50'
                                    : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                                }`}
                                data-testid={`shipping-option-${index}`}
                              >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                  isSelected ? selectedColor : carrierColor
                                }`}>
                                  <CarrierIcon className={`w-6 h-6 ${isSelected ? 'text-white' : isFree ? 'text-green-400' : 'text-gray-400'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`font-semibold ${isSelected ? (isFree ? 'text-green-400' : 'text-blue-400') : 'text-white'}`}>
                                      {rate.carrier} {rate.service}
                                    </p>
                                    {isFree && (
                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                        FREE
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {rate.estimated_days 
                                      ? `Estimated ${rate.estimated_days} business day${rate.estimated_days > 1 ? 's' : ''}`
                                      : 'Standard delivery time'
                                    }
                                  </p>
                                </div>
                                <div className="text-right">
                                  {isFree ? (
                                    <p className="text-lg font-bold text-green-400">FREE</p>
                                  ) : (
                                    <p className="text-lg font-bold text-white">${price.toFixed(2)}</p>
                                  )}
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected 
                                    ? isFree ? 'border-green-600 bg-green-600' : 'border-purple-600 bg-blue-600'
                                    : 'border-gray-600'
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </button>
                            );
                          })}
                          
                          {shippingRates.length === 0 && !loadingShippingRates && (
                            <div className="text-center py-4 text-gray-400">
                              <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                              <p>No shipping rates available. Please verify your address.</p>
                            </div>
                          )}
                        </div>
                      )}
                        </>
                      )}

                      {/* Local Pickup Locations - Show only when delivery method is pickup */}
                      {deliveryMethod === 'pickup' && (
                        <>
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-heading text-lg font-bold text-white">Select Pickup Location</h3>
                              <p className="text-sm text-gray-400">Choose where you'd like to pick up your order</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {localPickupSettings.locations.map((location, index) => {
                              const isSelected = selectedPickupLocation?.id === location.id;
                              
                              return (
                                <button
                                  key={location.id || index}
                                  onClick={() => setSelectedPickupLocation(location)}
                                  className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                    isSelected
                                      ? 'border-amber-500 bg-yellow-500/10/50'
                                      : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                                  }`}
                                  data-testid={`pickup-location-${index}`}
                                >
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? 'bg-amber-600' : 'bg-amber-100'
                                  }`}>
                                    <Building className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-yellow-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-semibold ${isSelected ? 'text-yellow-400' : 'text-white'}`}>
                                      {location.name}
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1">
                                      <MapPin className="w-3 h-3 inline mr-1" />
                                      {location.address}, {location.city}, {location.state} {location.zip_code}
                                    </p>
                                    {location.phone && (
                                      <p className="text-sm text-gray-400">
                                        <Phone className="w-3 h-3 inline mr-1" />
                                        {location.phone}
                                      </p>
                                    )}
                                    {location.hours && (
                                      <p className="text-sm text-gray-400">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {location.hours}
                                      </p>
                                    )}
                                    {location.notes && (
                                      <p className="text-xs text-yellow-400 mt-1 italic">
                                        {location.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                                      FREE
                                    </span>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      isSelected 
                                        ? 'border-amber-600 bg-amber-600'
                                        : 'border-gray-600'
                                    }`}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Payment Information */}
              {currentStep === 3 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Payment Method Selector */}
                  <div className="bg-bots-surface border border-gray-700 rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="font-heading text-xl font-bold text-white">Payment Method</h2>
                        <p className="text-sm text-gray-400">Select how you'd like to pay</p>
                      </div>
                    </div>

                    {/* Payment Method Options */}
                    <div className="grid gap-4 mb-6">
                      {/* Credit Card Option (Durango) — shown when Durango enabled, or as demo fallback when no card gateway is configured */}
                      {(paymentSettings?.is_enabled || !stripeSettings?.is_enabled) && (
                      <button
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPaymentMethod === 'card'
                            ? 'border-blue-500 bg-blue-500/10/50'
                            : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                        }`}
                        data-testid="payment-method-card"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedPaymentMethod === 'card' ? 'bg-blue-600' : 'bg-bots-dark'
                        }`}>
                          <CreditCard className={`w-6 h-6 ${selectedPaymentMethod === 'card' ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${selectedPaymentMethod === 'card' ? 'text-blue-400' : 'text-white'}`}>
                            Credit / Debit Card
                          </p>
                          <p className="text-sm text-gray-400">Pay securely with your card</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'card' ? 'border-purple-600 bg-blue-600' : 'border-gray-600'
                        }`}>
                          {selectedPaymentMethod === 'card' && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                      )}

                      {/* Stripe Card Option */}
                      {stripeSettings?.is_enabled && (
                      <button
                        onClick={() => setSelectedPaymentMethod('stripe')}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          selectedPaymentMethod === 'stripe'
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                        }`}
                        data-testid="payment-method-stripe"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          selectedPaymentMethod === 'stripe' ? 'bg-indigo-600' : 'bg-bots-dark'
                        }`}>
                          <CreditCard className={`w-6 h-6 ${selectedPaymentMethod === 'stripe' ? 'text-white' : 'text-indigo-400'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${selectedPaymentMethod === 'stripe' ? 'text-indigo-400' : 'text-white'}`}>
                            Credit / Debit Card (Stripe)
                          </p>
                          <p className="text-sm text-gray-400">Secure checkout powered by Stripe</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPaymentMethod === 'stripe' ? 'border-indigo-500 bg-indigo-600' : 'border-gray-600'
                        }`}>
                          {selectedPaymentMethod === 'stripe' && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                      )}

                      {/* CashApp Option */}
                      {cashAppVenmoSettings?.is_enabled && cashAppVenmoSettings?.cashapp_available && (
                        <button
                          onClick={() => setSelectedPaymentMethod('cashapp')}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPaymentMethod === 'cashapp'
                              ? 'border-green-500 bg-green-500/100/10'
                              : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                          }`}
                          data-testid="payment-method-cashapp"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedPaymentMethod === 'cashapp' ? 'bg-green-500/100' : 'bg-bots-dark'
                          }`}>
                            <DollarSign className={`w-6 h-6 ${selectedPaymentMethod === 'cashapp' ? 'text-white' : 'text-green-400'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${selectedPaymentMethod === 'cashapp' ? 'text-green-400' : 'text-white'}`}>
                              CashApp
                            </p>
                            <p className="text-sm text-gray-400">Pay via CashApp transfer</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'cashapp' ? 'border-green-500 bg-green-500/100' : 'border-gray-600'
                          }`}>
                            {selectedPaymentMethod === 'cashapp' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      )}

                      {/* Venmo Option */}
                      {cashAppVenmoSettings?.is_enabled && cashAppVenmoSettings?.venmo_available && (
                        <button
                          onClick={() => setSelectedPaymentMethod('venmo')}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPaymentMethod === 'venmo'
                              ? 'border-blue-500 bg-blue-50/50'
                              : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                          }`}
                          data-testid="payment-method-venmo"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedPaymentMethod === 'venmo' ? 'bg-blue-500' : 'bg-bots-dark'
                          }`}>
                            <span className={`text-xl font-bold ${selectedPaymentMethod === 'venmo' ? 'text-white' : 'text-blue-600'}`}>V</span>
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${selectedPaymentMethod === 'venmo' ? 'text-blue-700' : 'text-white'}`}>
                              Venmo
                            </p>
                            <p className="text-sm text-gray-400">Pay via Venmo transfer</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'venmo' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                          }`}>
                            {selectedPaymentMethod === 'venmo' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      )}

                      {/* PayPal Option */}
                      {paypalSettings?.is_enabled && paypalSettings?.is_available && (
                        <button
                          onClick={() => setSelectedPaymentMethod('paypal')}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            selectedPaymentMethod === 'paypal'
                              ? 'border-blue-500 bg-blue-50/50'
                              : 'border-gray-700 hover:border-gray-600 bg-bots-surface'
                          }`}
                          data-testid="payment-method-paypal"
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            selectedPaymentMethod === 'paypal' ? 'bg-blue-600' : 'bg-bots-dark'
                          }`}>
                            <span className={`font-bold text-sm ${selectedPaymentMethod === 'paypal' ? 'text-white' : 'text-blue-600'}`}>PP</span>
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${selectedPaymentMethod === 'paypal' ? 'text-blue-700' : 'text-white'}`}>
                              PayPal
                            </p>
                            <p className="text-sm text-gray-400">Pay with your PayPal account</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPaymentMethod === 'paypal' ? 'border-blue-500 bg-blue-500' : 'border-gray-600'
                          }`}>
                            {selectedPaymentMethod === 'paypal' && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      )}
                    </div>

                    {/* CashApp/Venmo/PayPal Info Box */}
                    {(selectedPaymentMethod === 'cashapp' || selectedPaymentMethod === 'venmo' || selectedPaymentMethod === 'paypal') && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6"
                      >
                        <div className="flex items-start gap-3">
                          <Smartphone className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-400">
                            {selectedPaymentMethod === 'paypal' ? (
                              <>
                                <p className="font-medium">How PayPal Payment Works:</p>
                                <ul className="mt-2 space-y-1 text-yellow-400">
                                  <li>• Your order is created first to reserve inventory</li>
                                  <li>• {paypalSettings?.setup_mode === 'api_keys' ? 'You will be redirected to PayPal secure checkout' : 'You will get a PayPal payment link with recipient email'}</li>
                                  <li>• Complete payment and include your order number if prompted</li>
                                  <li>• Once payment is completed, your order proceeds to fulfillment</li>
                                </ul>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">How {selectedPaymentMethod === 'cashapp' ? 'CashApp' : 'Venmo'} Payment Works:</p>
                                <ul className="mt-2 space-y-1 text-yellow-400">
                                  <li>• Your order will be placed with "Awaiting Payment" status</li>
                                  <li>• You'll receive an email with our {selectedPaymentMethod === 'cashapp' ? 'CashApp' : 'Venmo'} ID</li>
                                  <li>• Send payment and include your order number in the note</li>
                                  <li>• Once we verify payment, your order ships!</li>
                                </ul>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Stripe info panel - redirect flow */}
                    {selectedPaymentMethod === 'stripe' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl mb-6"
                        data-testid="stripe-info-panel"
                      >
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-indigo-300">
                            <p className="font-medium">Secure Checkout with Stripe</p>
                            <ul className="mt-2 space-y-1">
                              <li>• Click "Place Order" to continue to Stripe's secure payment page</li>
                              <li>• Enter your card details on Stripe (your card never touches our servers)</li>
                              <li>• You'll be returned here automatically once payment completes</li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Card Payment Fields - Only show if card is selected */}
                    {selectedPaymentMethod === 'card' && (
                      <>
                        {/* Durango Collect.js Secure Fields */}
                        {paymentSettings?.is_enabled ? (
                          <div className="space-y-4">
                            {/* Loading indicator while Collect.js loads */}
                            {!collectJsLoaded && (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500 mr-2" />
                                <span className="text-gray-400">Loading secure payment form...</span>
                              </div>
                            )}
                            
                            <div className={collectJsLoaded ? '' : 'opacity-50 pointer-events-none'}>
                              {/* Card Number - Secure iframe */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Card Number <span className="text-red-400">*</span>
                                </label>
                                <div 
                                  id="collect-cc-number" 
                                  className="h-[52px] border border-gray-700 rounded-xl overflow-hidden"
                                />
                              </div>

                              {/* Name on Card */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Name on Card <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={paymentInfo.cardName}
                                  onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value.toUpperCase()})}
                                  className={inputClasses('cardName')}
                                  placeholder="JOHN DOE"
                                  data-testid="payment-card-name"
                                />
                                {errors.cardName && <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>}
                              </div>

                              {/* Expiry and CVV - Secure iframes */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Expiry Date <span className="text-red-400">*</span>
                                  </label>
                                  <div 
                                    id="collect-cc-exp" 
                                    className="h-[52px] border border-gray-700 rounded-xl overflow-hidden"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">
                                    CVV <span className="text-red-400">*</span>
                                  </label>
                                  <div 
                                    id="collect-cc-cvv" 
                                    className="h-[52px] border border-gray-700 rounded-xl overflow-hidden"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* PCI Badge */}
                            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                              <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-green-400">
                                <p className="font-medium">PCI-DSS Compliant</p>
                                <p>Card data is securely tokenized. Your full card number never touches our servers.</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Fallback manual card entry (when Durango not configured) */
                          <div className="space-y-4">
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3 mb-4">
                              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-yellow-400">
                                <p className="font-medium">Demo Mode</p>
                                <p>Payment gateway not configured. Orders will be created without real payment processing.</p>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Card Number <span className="text-red-400">*</span>
                              </label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                  type="text"
                                  value={paymentInfo.cardNumber}
                                  onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: formatCardNumber(e.target.value)})}
                                  className={`${inputClasses('cardNumber')} pl-10 font-mono tracking-wider`}
                                  placeholder="4242 4242 4242 4242"
                                  maxLength="19"
                                  data-testid="payment-card-number"
                                />
                              </div>
                              {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Name on Card <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={paymentInfo.cardName}
                                onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                                className={inputClasses('cardName')}
                                placeholder="JOHN DOE"
                                data-testid="payment-card-name"
                              />
                              {errors.cardName && <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Expiry Date <span className="text-red-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={paymentInfo.expiry}
                                  onChange={(e) => setPaymentInfo({...paymentInfo, expiry: formatExpiry(e.target.value)})}
                                  className={`${inputClasses('expiry')} font-mono`}
                                  placeholder="MM/YY"
                                  maxLength="5"
                                  data-testid="payment-expiry"
                                />
                                {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  CVV <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                  <input
                                    type="password"
                                    value={paymentInfo.cvv}
                                    onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value.replace(/\D/g, '')})}
                                    className={`${inputClasses('cvv')} pl-10 font-mono`}
                                    placeholder="•••"
                                    maxLength="4"
                                    data-testid="payment-cvv"
                                  />
                                </div>
                                {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Billing Address Toggle - only for card payments */}
                        <div className="mt-6 pt-6 border-t border-gray-700">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={paymentInfo.billingAddressSame}
                              onChange={(e) => setPaymentInfo({...paymentInfo, billingAddressSame: e.target.checked})}
                              className="w-5 h-5 rounded border-gray-600 text-blue-400 focus:ring-blue-500"
                              data-testid="billing-same-checkbox"
                            />
                            <span className="text-gray-300">Billing address same as shipping</span>
                          </label>
                        </div>

                        {/* Billing Address Fields */}
                        {!paymentInfo.billingAddressSame && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 pt-6 border-t border-gray-700 grid md:grid-cols-2 gap-4"
                          >
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Billing Address <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={billingInfo.address1}
                                onChange={(e) => setBillingInfo({...billingInfo, address1: e.target.value})}
                                className={inputClasses('billingAddress1')}
                                placeholder="123 Billing Street"
                                data-testid="billing-address1"
                              />
                              {errors.billingAddress1 && <p className="text-red-400 text-xs mt-1">{errors.billingAddress1}</p>}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                              <input
                                type="text"
                                value={billingInfo.city}
                                onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                                className={inputClasses('billingCity')}
                                placeholder="City"
                                data-testid="billing-city"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                              <select
                                value={billingInfo.state}
                                onChange={(e) => setBillingInfo({...billingInfo, state: e.target.value})}
                                className={inputClasses('billingState')}
                                data-testid="billing-state"
                              >
                                {US_STATES.map(state => (
                                  <option key={state.value} value={state.value} className="bg-bots-dark text-white">{state.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                              <input
                                type="text"
                                value={billingInfo.zipCode}
                                onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                                className={inputClasses('billingZipCode')}
                                placeholder="ZIP"
                                data-testid="billing-zip"
                              />
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Order Review */}
              {currentStep === 4 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Shipping Summary */}
                  <div className="bg-bots-surface border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-5 h-5 text-blue-400" />
                        <h3 className="font-heading font-bold text-white">Shipping To</h3>
                      </div>
                      <button onClick={() => setCurrentStep(2)} className="text-sm text-blue-400 hover:underline">Edit</button>
                    </div>
                    <div className="text-gray-400 space-y-1">
                      <p className="font-medium text-white">{shippingInfo.firstName} {shippingInfo.lastName}</p>
                      {shippingInfo.company && <p>{shippingInfo.company}</p>}
                      <p>{shippingInfo.address1}</p>
                      {shippingInfo.address2 && <p>{shippingInfo.address2}</p>}
                      <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                      <p className="pt-2">{shippingInfo.email}</p>
                      <p>{shippingInfo.phone}</p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-bots-surface border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {selectedPaymentMethod === 'card' ? (
                          <CreditCard className="w-5 h-5 text-blue-400" />
                        ) : selectedPaymentMethod === 'stripe' ? (
                          <CreditCard className="w-5 h-5 text-indigo-400" />
                        ) : selectedPaymentMethod === 'cashapp' ? (
                          <DollarSign className="w-5 h-5 text-green-400" />
                        ) : selectedPaymentMethod === 'paypal' ? (
                          <span className="text-blue-600 font-bold text-sm">PP</span>
                        ) : (
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        )}
                        <h3 className="font-heading font-bold text-white">Payment Method</h3>
                      </div>
                      <button onClick={() => setCurrentStep(3)} className="text-sm text-blue-400 hover:underline">Edit</button>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedPaymentMethod === 'card' ? (
                        <>
                          <div className="w-12 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-md flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-mono text-white">
                              {paymentSettings?.is_enabled && paymentToken 
                                ? '•••• •••• •••• ****' 
                                : `•••• •••• •••• ${paymentInfo.cardNumber.slice(-4) || '****'}`}
                            </p>
                            <p className="text-sm text-gray-400">{paymentInfo.cardName || 'Card Payment'}</p>
                          </div>
                        </>
                      ) : selectedPaymentMethod === 'stripe' ? (
                        <>
                          <div className="w-12 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Credit / Debit Card (Stripe)</p>
                            <p className="text-sm text-gray-400">Secure Stripe checkout on next step</p>
                          </div>
                        </>
                      ) : selectedPaymentMethod === 'cashapp' ? (
                        <>
                          <div className="w-12 h-8 bg-green-500/100 rounded-md flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">CashApp</p>
                            <p className="text-sm text-gray-400">Payment instructions will be emailed</p>
                          </div>
                        </>
                      ) : selectedPaymentMethod === 'paypal' ? (
                        <>
                          <div className="w-12 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                            <span className="text-white font-bold text-xs">PP</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">PayPal</p>
                            <p className="text-sm text-gray-400">
                              {paypalSettings?.setup_mode === 'api_keys' ? 'Redirect to secure PayPal checkout' : 'Payment link will be emailed'}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-bold text-sm">V</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">Venmo</p>
                            <p className="text-sm text-gray-400">Payment instructions will be emailed</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* CashApp/Venmo Reminder */}
                    {(selectedPaymentMethod === 'cashapp' || selectedPaymentMethod === 'venmo' || selectedPaymentMethod === 'paypal') && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm text-yellow-400">
                          <strong>Note:</strong>{' '}
                          {selectedPaymentMethod === 'paypal'
                            ? (paypalSettings?.setup_mode === 'api_keys'
                              ? 'After placing your order, you will be redirected to PayPal to complete payment.'
                              : 'After placing your order, you will receive a PayPal payment link by email.')
                            : 'After placing your order, you will receive an email with payment instructions.'}{' '}
                          Your order will ship once we confirm payment.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="bg-bots-surface border border-gray-700 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-blue-400" />
                        <h3 className="font-heading font-bold text-white">
                          Order Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                        </h3>
                      </div>
                      <button onClick={() => setCurrentStep(1)} className="text-sm text-blue-400 hover:underline">Edit</button>
                    </div>
                    <div className="space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.cart_key || item.id} className="flex items-center gap-4">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=200'}
                            alt={item.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{item.name}</p>
                            <p className="text-sm text-gray-400">
                              Qty: {item.quantity}{getDisplayOptionSummary(item) ? ` • ${getDisplayOptionSummary(item)}` : ''}
                            </p>
                            {item.custom_notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">Notes: {item.custom_notes}</p>}
                          </div>
                          <p className="font-mono font-semibold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping/Pickup Method Summary */}
                  {(selectedShippingRate || selectedPickupLocation) && (
                    <div className="bg-bots-surface border border-gray-700 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {deliveryMethod === 'pickup' ? (
                            <MapPin className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Truck className="w-5 h-5 text-green-400" />
                          )}
                          <h3 className="font-heading font-bold text-white">
                            {deliveryMethod === 'pickup' ? 'Pickup Location' : 'Shipping Method'}
                          </h3>
                        </div>
                        <button onClick={() => setCurrentStep(2)} className="text-sm text-blue-400 hover:underline">Edit</button>
                      </div>
                      
                      {deliveryMethod === 'pickup' && selectedPickupLocation ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{selectedPickupLocation.name}</p>
                            <p className="text-sm text-gray-400">
                              {selectedPickupLocation.address}, {selectedPickupLocation.city}, {selectedPickupLocation.state}
                            </p>
                            {selectedPickupLocation.hours && (
                              <p className="text-xs text-gray-500 mt-1">{selectedPickupLocation.hours}</p>
                            )}
                          </div>
                          <p className="font-mono font-semibold text-green-400">FREE</p>
                        </div>
                      ) : selectedShippingRate ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">
                              {selectedShippingRate.carrier} {selectedShippingRate.service}
                            </p>
                            {selectedShippingRate.estimated_days && (
                              <p className="text-sm text-gray-400">
                                Estimated {selectedShippingRate.estimated_days} business day{selectedShippingRate.estimated_days > 1 ? 's' : ''}
                              </p>
                            )}
                            {selectedShippingRate.provider && selectedShippingRate.provider !== 'store' && selectedShippingRate.provider !== 'fallback' && (
                              <p className="text-xs text-gray-500 mt-1">via {selectedShippingRate.provider}</p>
                            )}
                          </div>
                          <p className={`font-mono font-semibold ${selectedShippingRate.is_free || shippingCost === 0 ? 'text-green-400' : 'text-white'}`}>
                            {selectedShippingRate.is_free || shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Quality Notice */}
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                    <p className="font-mono text-xs text-yellow-400 text-center tracking-wider">
                      CUSTOM PRINTED PRODUCTS • MADE WITH CARE
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-blue-400 transition-colors"
                  data-testid="prev-step-btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}
              
              {currentStep < 4 ? (
                <button
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && cartItems.length === 0}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="next-step-btn"
                >
                  {currentStep === 3 && selectedPaymentMethod === 'card' && paymentSettings?.is_enabled ? 'Verify Card & Continue' : 'Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className={`flex items-center gap-3 px-8 py-4 text-white font-heading font-bold uppercase tracking-wider rounded-full hover:shadow-xl transition-all disabled:opacity-50 ${
                    selectedPaymentMethod === 'cashapp' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/30'
                      : selectedPaymentMethod === 'venmo'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/30'
                      : selectedPaymentMethod === 'paypal'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-700 hover:shadow-blue-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-green-500 hover:shadow-blue-500/30'
                  }`}
                  data-testid="place-order-btn"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : selectedPaymentMethod === 'cashapp' || selectedPaymentMethod === 'venmo' || selectedPaymentMethod === 'paypal' ? (
                    <>
                      <Package className="w-5 h-5" />
                      {selectedPaymentMethod === 'paypal' ? 'Place Order & Continue to PayPal' : 'Place Order & Get Payment Link'}
                    </>
                  ) : selectedPaymentMethod === 'stripe' ? (
                    <>
                      <Lock className="w-5 h-5" />
                      Place Order & Continue to Stripe
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:sticky lg:top-36 h-fit"
          >
            <div className="p-6 bg-bots-surface border border-gray-700 rounded-2xl shadow-sm">
              <h2 className="font-heading text-xl font-bold text-white mb-6">Order Summary</h2>

              {cartItems.length > 0 && currentStep !== 1 && (
                <div className="mb-6 pb-6 border-b border-gray-700">
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {cartItems.slice(0, 3).map((item) => (
                      <div key={item.cart_key || item.id} className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=200'}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-mono text-gray-300">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    {cartItems.length > 3 && (
                      <p className="text-xs text-gray-400 text-center">+{cartItems.length - 3} more items</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                
                {/* Discount Code Section */}
                <div className="py-3 border-y border-gray-700">
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="font-semibold text-green-400 text-sm">{appliedDiscount.discount.code}</p>
                          <p className="text-xs text-green-400">
                            {appliedDiscount.discount.discount_type === 'percentage' 
                              ? `${appliedDiscount.discount.value}% off` 
                              : `$${appliedDiscount.discount.value} off`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-green-400 font-semibold">-${discountAmount.toFixed(2)}</span>
                        <button 
                          onClick={handleRemoveDiscount}
                          className="p-1 hover:bg-green-500/20 rounded-full transition-colors"
                          data-testid="remove-discount-btn"
                        >
                          <X className="w-4 h-4 text-green-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase());
                              setDiscountError('');
                            }}
                            placeholder="Enter discount code"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            data-testid="discount-code-input"
                          />
                        </div>
                        <button
                          onClick={handleApplyDiscount}
                          disabled={applyingDiscount || !discountCode.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                          data-testid="apply-discount-btn"
                        >
                          {applyingDiscount ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {discountError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between text-gray-400">
                  <div className="flex flex-col">
                    <span>{deliveryMethod === 'pickup' ? 'Local Pickup' : 'Shipping'}</span>
                    {deliveryMethod === 'pickup' && selectedPickupLocation && currentStep > 1 && (
                      <span className="text-xs text-gray-500">
                        {selectedPickupLocation.name}
                      </span>
                    )}
                    {deliveryMethod === 'shipping' && selectedShippingRate && currentStep > 1 && (
                      <span className="text-xs text-gray-500">
                        {selectedShippingRate.carrier} {selectedShippingRate.service}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-white">
                    {shippingCost === 0 ? <span className="text-green-400 font-semibold">FREE</span> : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {deliveryMethod === 'shipping' && !selectedShippingRate && shippingCost > 0 && (
                  <p className="text-xs text-gray-400">Free shipping on orders over ${freeShippingThreshold}</p>
                )}
                {deliveryMethod === 'shipping' && selectedShippingRate?.estimated_days && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est. {selectedShippingRate.estimated_days} business day{selectedShippingRate.estimated_days > 1 ? 's' : ''}
                  </p>
                )}
                <div className="flex justify-between text-gray-400" data-testid="checkout-tax-line">
                  <span>{customerTaxExempt ? 'Tax (Exempt)' : `Tax ${taxSettings.combined_rate > 0 ? `(${taxSettings.combined_rate.toFixed(2)}%)` : ''}`}</span>
                  <span className={`font-mono ${customerTaxExempt ? 'text-emerald-400' : 'text-white'}`}>
                    {customerTaxExempt ? '$0.00' : (taxSettings.combined_rate > 0 ? `$${tax.toFixed(2)}` : '$0.00')}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="font-heading font-bold text-white">Total</span>
                    <span className="font-mono text-2xl font-bold text-blue-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3 pt-4 border-t border-gray-700">
                {/* Recurring Order Option */}
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-white text-sm">Set Up Auto-Reorder</span>
                    </div>
                    <Switch
                      checked={isRecurringOrder}
                      onCheckedChange={setIsRecurringOrder}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  {isRecurringOrder && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">Receive an invoice to reorder every:</p>
                      <select
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                        className="w-full p-2 text-sm text-white border border-blue-500/30 rounded-lg bg-bots-surface focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={30} className="bg-bots-dark text-white">30 days</option>
                        <option value={60} className="bg-bots-dark text-white">60 days</option>
                        <option value={90} className="bg-bots-dark text-white">90 days</option>
                      </select>
                      <p className="text-xs text-blue-400">You'll receive an invoice - no automatic charges!</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Secure SSL Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Fast, Discreet Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Gift className="w-4 h-4 text-blue-400" />
                  <span>Quality Guarantee</span>
                </div>
              </div>

              {/* Quality Notice */}
              <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="font-mono text-xs text-yellow-400 text-center tracking-wider">MADE WITH CARE, JUST FOR YOU</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
