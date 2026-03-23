import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  MessageCircle,
  X,
  Send,
  User,
  Bot,
  UserCheck,
  Loader2,
  Phone,
  Ticket,
  Minimize2,
  Maximize2,
  Users,
  Paperclip,
  Image,
  FileText,
  File
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const CHAT_ICON_URL = 'https://customer-assets.emergentagent.com/job_808bae03-b30d-4055-83be-4ec1ad35d078/artifacts/hogy414u_gk-favicon.png';
const STAFF_CHAT_INITIATED_SOUND_URL = 'https://customer-assets.emergentagent.com/job_808bae03-b30d-4055-83be-4ec1ad35d078/artifacts/lomxogl2_new-notification.mp3';
const AI_DISPLAY_NAME = 'Betty';
const CHAT_AUTO_POPUP_DELAY_MS = 30000;
const CHAT_AUTO_POPUP_SESSION_KEY = 'gk_chat_auto_popup_seen';
const FRONTEND_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const API_URL = (typeof window !== 'undefined' && window.location.hostname === 'gingerkare.com')
  ? FRONTEND_ORIGIN
  : BACKEND_URL;

// Generate or get visitor ID
const getVisitorId = () => {
  let visitorId = localStorage.getItem('gingerkare_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('gingerkare_visitor_id', visitorId);
  }
  return visitorId;
};

export default function ChatWidget() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [status, setStatus] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [startWithHuman, setStartWithHuman] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [hasNewInvite, setHasNewInvite] = useState(false);
  const [featureFlags, setFeatureFlags] = useState({
    owner_chat_enabled: false,
    owner_chat_ai_enabled: false,
  });
  const [liveRepOnline, setLiveRepOnline] = useState(false);
  const [submittingOfflineLead, setSubmittingOfflineLead] = useState(false);
  const [offlineLeadName, setOfflineLeadName] = useState('');
  const [offlineLeadEmail, setOfflineLeadEmail] = useState('');
  const [offlineLeadMessage, setOfflineLeadMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const visitorId = useRef(getVisitorId());

  const aiEnabledForVisitors = featureFlags.owner_chat_ai_enabled;
  const shouldShowOfflineLeadForm = (!aiEnabledForVisitors || startWithHuman) && !liveRepOnline;
  const liveRepOnlyWaiting = !aiEnabledForVisitors && status !== 'with_human';
  const showAiNameInHeader = aiEnabledForVisitors && !startWithHuman && status === 'active';
  const headerTitle = showAiNameInHeader ? AI_DISPLAY_NAME : 'Live Support';
  const requiresTallPromptLayout = showNamePrompt && !sessionId && !pendingInvite && shouldShowOfflineLeadForm;
  const expandedWidgetHeight = requiresTallPromptLayout ? 700 : 600;
  const promptMaxHeight = expandedWidgetHeight - 80;

  const markAutoPopupSeen = () => {
    try {
      sessionStorage.setItem(CHAT_AUTO_POPUP_SESSION_KEY, 'true');
    } catch (error) {
      // no-op if storage is blocked
    }
  };

  const openChatWidget = (markSeen = true) => {
    if (markSeen) {
      markAutoPopupSeen();
    }
    setIsOpen(true);
    setIsMinimized(false);
  };

  const hasAutoPopupBeenSeen = () => {
    try {
      return sessionStorage.getItem(CHAT_AUTO_POPUP_SESSION_KEY) === 'true';
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    if (!featureFlags.owner_chat_enabled) return;
    if (isOpen || sessionId || pendingInvite) return;
    if (hasAutoPopupBeenSeen()) return;

    const blockedAutoPopupPaths = [
      '/admin',
      '/dev',
      '/login',
      '/register',
      '/verify-email',
      '/checkout',
      '/order-confirmation',
      '/account',
    ];

    if (blockedAutoPopupPaths.some((pathPrefix) => location.pathname.startsWith(pathPrefix))) {
      return;
    }

    const timer = setTimeout(() => {
      openChatWidget(true);
    }, CHAT_AUTO_POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [featureFlags.owner_chat_enabled, isOpen, sessionId, pendingInvite, location.pathname]);

  useEffect(() => {
    if (!aiEnabledForVisitors) {
      setStartWithHuman(true);
    }
  }, [aiEnabledForVisitors]);

  const triggerDesktopNotification = async (title, body) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
        return;
      }

      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    } catch (error) {
      // non-blocking for browser notification failures
    }
  };

  const playStaffChatInitiatedSound = () => {
    const audio = new Audio(STAFF_CHAT_INITIATED_SOUND_URL);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  };

  const fetchPublicChatAvailability = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/availability/public`);
      const data = response.data || {};
      setFeatureFlags({
        owner_chat_enabled: Boolean(data.owner_chat_enabled),
        owner_chat_ai_enabled: Boolean(data.owner_chat_ai_enabled),
      });
      setLiveRepOnline(Boolean(data.any_online));
    } catch (error) {
      setFeatureFlags({ owner_chat_enabled: false, owner_chat_ai_enabled: false });
      setLiveRepOnline(false);
    }
  };

  const submitOfflineLead = async () => {
    const name = offlineLeadName.trim();
    const email = offlineLeadEmail.trim();
    const message = offlineLeadMessage.trim();

    if (!name) {
      alert('Please enter your name.');
      return;
    }

    if (!email) {
      alert('Email is required.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (!message) {
      alert('Please enter your message.');
      return;
    }

    setSubmittingOfflineLead(true);
    try {
      await axios.post(`${API_URL}/api/leads/`, {
        name,
        email,
        phone: '',
        subject: 'Live Chat Offline Request',
        message,
        source: 'chat_offline',
      });

      await triggerDesktopNotification(
        'Message sent to support',
        'Your message has been submitted. We will follow up by email.'
      );

      alert('Thanks! Your message was sent to our team. We will follow up by email.');
      setOfflineLeadName('');
      setOfflineLeadEmail('');
      setOfflineLeadMessage('');
      setIsOpen(false);
    } catch (error) {
      alert('We could not submit your message. Please try again.');
    } finally {
      setSubmittingOfflineLead(false);
    }
  };

  useEffect(() => {
    fetchPublicChatAvailability();
  }, []);

  useEffect(() => {
    if (!isOpen || sessionId) return;
    fetchPublicChatAvailability();
    const interval = setInterval(fetchPublicChatAvailability, 15000);
    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  // Track page visits
  useEffect(() => {
    const trackPageVisit = async () => {
      try {
        await axios.post(`${API_URL}/api/chat/visitor/track`, {
          visitor_id: visitorId.current,
          page_url: window.location.pathname,
          page_title: document.title,
          referrer: document.referrer
        });
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };

    trackPageVisit();
  }, [location.pathname]);

  // Listen for openAtomChat event from UserPortal or other components
  useEffect(() => {
    const handleOpenChat = (event) => {
      const { userId, userName, userEmail, customerType } = event.detail || {};
      
      // Pre-fill visitor info if provided
      if (userName) setVisitorName(userName);
      if (userEmail) setVisitorEmail(userEmail);
      
      // Open the chat widget
      openChatWidget(true);
      
      // If user info is provided, skip the name prompt and start chat directly
      if (userName || userEmail) {
        setShowNamePrompt(false);
        // Auto-start chat with the user's info
        if (!sessionId) {
          axios.post(`${API_URL}/api/chat/start`, null, {
            params: {
              visitor_name: userName || undefined,
              visitor_email: userEmail || undefined,
              user_id: userId || undefined,
              customer_type: customerType || undefined
            }
          }).then(response => {
            setSessionId(response.data.session_id);
            setChatId(response.data.chat_id);
            setMessages([response.data.welcome_message]);
          }).catch(error => {
            console.error('Error starting chat:', error);
          });
        }
      }
    };

    window.addEventListener('openAtomChat', handleOpenChat);
    return () => window.removeEventListener('openAtomChat', handleOpenChat);
  }, [sessionId]);

  // Check for admin chat invites
  useEffect(() => {
    const checkForInvites = async () => {
      // Don't check if already in a chat
      if (sessionId) return;
      
      try {
        const response = await axios.get(`${API_URL}/api/chat/visitor/check-invite/${visitorId.current}`);
        if (response.data.has_invite && !pendingInvite) {
          setPendingInvite(response.data.invite);
          setHasNewInvite(true);
          // Auto-open the chat widget
          openChatWidget(true);
          setShowNamePrompt(false);
        }
      } catch (error) {
        // Silently fail - invite check is not critical
      }
    };

    const interval = setInterval(checkForInvites, 3000);
    checkForInvites(); // Check immediately

    return () => clearInterval(interval);
  }, [sessionId, pendingInvite]);

  // Heartbeat to keep session alive
  useEffect(() => {
    const heartbeat = async () => {
      try {
        await axios.post(`${API_URL}/api/chat/visitor/heartbeat`, null, {
          params: {
            visitor_id: visitorId.current,
            page_url: window.location.pathname
          }
        });
      } catch (error) {
        // Silently fail
      }
    };

    const interval = setInterval(heartbeat, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't remove visitor on unmount as they might still be browsing
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let interval;
    if (sessionId && (status === 'with_human' || status === 'waiting_human')) {
      interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_URL}/api/chat/history/${sessionId}`);
          setMessages(response.data.messages || []);
          setStatus(response.data.status);
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [sessionId, status]);

  // Accept admin-initiated chat invite
  const acceptInvite = async () => {
    if (!pendingInvite) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/chat/visitor/accept-invite`, null, {
        params: { visitor_id: visitorId.current }
      });
      
      setSessionId(response.data.session_id);
      setChatId(response.data.chat_id);
      setMessages(response.data.messages || []);
      setStatus('with_human');
      setPendingInvite(null);
      setHasNewInvite(false);
      setShowNamePrompt(false);
    } catch (error) {
      console.error('Error accepting invite:', error);
      setPendingInvite(null);
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/chat/start`, null, {
        params: {
          visitor_name: visitorName || undefined,
          visitor_email: visitorEmail || undefined
        }
      });
      
      setSessionId(response.data.session_id);
      setChatId(response.data.chat_id);

      if (startWithHuman && !aiEnabledForVisitors) {
        setMessages([
          {
            id: `sys-${Date.now()}`,
            type: 'system',
            text: liveRepOnline
              ? 'Connecting you with a live representative now...'
              : 'No live representative is online right now.',
            timestamp: new Date().toISOString(),
          }
        ]);
      } else {
        setMessages([response.data.welcome_message]);
      }
      setShowNamePrompt(false);
      
      if (startWithHuman) {
        await requestHumanAfterStart(response.data.session_id);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHumanAfterStart = async (sid) => {
    try {
      const response = await axios.post(`${API_URL}/api/chat/request-human`, null, {
        params: { session_id: sid }
      });
      
      setMessages(prev => [...prev, response.data.message]);
      setStatus('waiting_human');
      playStaffChatInitiatedSound();
    } catch (error) {
      console.error('Error requesting human:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId) return;
    
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/chat/message`, {
        session_id: sessionId,
        text: messageText
      });
      
      if (response.data.ai_response) {
        setMessages(prev => [...prev, response.data.ai_response]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHuman = async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/api/chat/request-human`, null, {
        params: { session_id: sessionId }
      });
      
      setMessages(prev => [...prev, response.data.message]);
      setStatus('waiting_human');
      playStaffChatInitiatedSound();
    } catch (error) {
      console.error('Error requesting human:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestCallback = async () => {
    if (!sessionId || !callbackPhone.trim()) return;
    
    setSubmittingCallback(true);
    try {
      await axios.post(`${API_URL}/api/chat/request-callback`, {
        session_id: sessionId,
        phone: callbackPhone.trim()
      });
      
      const systemMessage = {
        id: Date.now().toString(),
        type: 'system',
        text: `Callback request submitted! A team member will call you at ${callbackPhone} shortly.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemMessage]);
      setShowCallbackForm(false);
      setCallbackPhone('');
      setStatus('waiting_human');
    } catch (error) {
      console.error('Error requesting callback:', error);
      alert('Failed to submit callback request. Please try again.');
    } finally {
      setSubmittingCallback(false);
    }
  };

  const convertToLead = async () => {
    setShowCallbackForm(true);
  };

  const handleFileUpload = async (file) => {
    if (!sessionId || !file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);
      
      const response = await axios.post(`${API_URL}/api/chat/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const attachmentMessage = {
        id: Date.now().toString(),
        type: 'user',
        text: file.name,
        attachment: response.data.attachment,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, attachmentMessage]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleFileUpload(file);
        }
        return;
      }
    }
  };

  const getFileIcon = (attachment) => {
    if (!attachment) return <File className="w-4 h-4" />;
    const type = attachment.content_type || '';
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleTyping = (text) => {
    setInputText(text);
    
    if (typingTimeout) clearTimeout(typingTimeout);
    
    if (sessionId) {
      const timeout = setTimeout(() => {
        axios.post(`${API_URL}/api/chat/typing`, null, {
          params: { session_id: sessionId, text }
        }).catch(() => {});
      }, 100);
      setTypingTimeout(timeout);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'ai':
        return <img src={CHAT_ICON_URL} alt="GingerKare Chat" className="w-5 h-5 rounded-full" />;
      case 'agent':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'user':
        return <User className="w-5 h-5 text-[#6e2ea8]" />;
      default:
        return null;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => openChatWidget(true)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50 hover:scale-110 overflow-hidden ${
          hasNewInvite ? 'animate-pulse ring-4 ring-green-400 ring-opacity-75' : ''
        }`}
        data-testid="chat-widget-button"
      >
        <img src={CHAT_ICON_URL} alt="GingerKare Chat" className="w-full h-full object-cover" />
        {hasNewInvite ? (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs font-bold">1</span>
          </span>
        ) : (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-96'
      }`}
      style={isMinimized ? undefined : { height: `${expandedWidgetHeight}px` }}
      data-testid="chat-widget"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1625] to-[#2d2438] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
            <img src={CHAT_ICON_URL} alt="GingerKare Chat" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold">{headerTitle}</h3>
            <p className="text-xs text-slate-300">
              {status === 'with_human' ? 'Connected to agent' : 
               status === 'waiting_human' ? 'Connecting...' : 
               liveRepOnline ? 'Live Rep Online' : 'Live Rep Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Pending Invite from Agent */}
          {pendingInvite && !sessionId && (
            <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: `${promptMaxHeight}px` }}>
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-lg text-gray-800">
                  {pendingInvite.agent_name?.split(' ')[0] || 'An agent'} wants to chat!
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  They noticed you&apos;re browsing and want to help
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-700 italic">
                  &quot;{pendingInvite.agent_message}&quot;
                </p>
              </div>
              
              <button
                onClick={acceptInvite}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Start Chatting
                  </>
                )}
              </button>
              
              <button
                onClick={() => { setPendingInvite(null); setHasNewInvite(false); setIsOpen(false); }}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
              >
                Maybe later
              </button>
            </div>
          )}
          
          {/* Name Prompt */}
          {showNamePrompt && !sessionId && !pendingInvite && (
            <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: `${promptMaxHeight}px` }}>
              <div className="text-center mb-2">
                {startWithHuman ? (
                  <>
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-3">
                      <Users className="w-9 h-9 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-lg text-gray-900">Talk to a Representative</h4>
                    <p className="text-sm text-gray-600">Connect with our team directly</p>
                  </>
                ) : (
                  <>
                    <img src={CHAT_ICON_URL} alt="GingerKare Chat" className="w-16 h-16 mx-auto rounded-full mb-2 object-cover" />
                    <h4 className="font-semibold text-lg text-gray-900">Hi! I&apos;m {AI_DISPLAY_NAME}</h4>
                    <p className="text-sm text-gray-600">Your virtual assistant at GingerKare</p>
                  </>
                )}
              </div>
              
              {/* Toggle: AI vs Live Rep */}
              {aiEnabledForVisitors ? (
                <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 rounded-xl" data-testid="chat-entry-mode-toggle">
                  <button
                    onClick={() => setStartWithHuman(false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      !startWithHuman 
                        ? 'bg-[#6e2ea8] text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid="chat-entry-ai-mode-button"
                  >
                    <Bot className="w-4 h-4" />
                    AI Assistant
                  </button>
                  <button
                    onClick={() => setStartWithHuman(true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      startWithHuman 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid="chat-entry-live-mode-button"
                  >
                    <Users className="w-4 h-4" />
                    Live Rep
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" data-testid="chat-entry-live-only-banner">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Users className="w-4 h-4" /> Live Rep
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${liveRepOnline ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                    data-testid="chat-live-rep-status-pill"
                  >
                    {liveRepOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              )}

              {shouldShowOfflineLeadForm && (
                <div className="space-y-3 p-4 border border-[#f2d6a2] bg-[#fffaf0] rounded-xl shadow-sm" data-testid="chat-offline-lead-form">
                  <p className="text-sm font-medium text-[#8a4b08] leading-6">No owner/support is online right now. Leave a message and we&apos;ll follow up.</p>
                  <input
                    type="text"
                    value={offlineLeadName}
                    onChange={(e) => setOfflineLeadName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8]"
                    data-testid="chat-offline-name-input"
                  />
                  <input
                    type="email"
                    value={offlineLeadEmail}
                    onChange={(e) => setOfflineLeadEmail(e.target.value)}
                    placeholder="Email (required)"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8]"
                    data-testid="chat-offline-email-input"
                  />
                  <textarea
                    value={offlineLeadMessage}
                    onChange={(e) => setOfflineLeadMessage(e.target.value)}
                    placeholder="Your message"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg min-h-[120px] resize-none bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8]"
                    data-testid="chat-offline-message-input"
                  />
                  <button
                    onClick={submitOfflineLead}
                    disabled={submittingOfflineLead}
                    className="w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#6e2ea8] to-[#b9893d] hover:opacity-90 text-white disabled:opacity-60 shadow-sm"
                    data-testid="chat-offline-submit-button"
                  >
                    {submittingOfflineLead ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
                    Send Message
                  </button>
                </div>
              )}
              
              {!shouldShowOfflineLeadForm && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8]"
                  data-testid="chat-entry-name-input"
                />
                <input
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8]"
                  data-testid="chat-entry-email-input"
                />
                {!shouldShowOfflineLeadForm && (
                  <button
                    onClick={startChat}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      startWithHuman
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                        : 'bg-gradient-to-r from-[#6e2ea8] to-[#b9893d] hover:opacity-90 text-white'
                    }`}
                    data-testid="chat-entry-start-button"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : startWithHuman ? (
                      <>
                        <Users className="w-5 h-5" />
                        Connect to Rep
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        Start Chatting
                      </>
                    )}
                  </button>
                )}
              </div>
              )}
            </div>
          )}

          {/* Messages */}
          {sessionId && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(600px - 180px)' }}>
                {messages.filter(m => m.type !== 'whisper').map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {message.type !== 'system' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === 'user' ? 'bg-[#6e2ea8]/10' :
                        message.type === 'agent' ? 'bg-green-100' : 'bg-[#b9893d]/10'
                      }`}>
                        {getMessageIcon(message.type)}
                      </div>
                    )}
                    <div className={`max-w-[80%] ${message.type === 'system' ? 'w-full text-center' : ''}`}>
                      {message.type === 'system' ? (
                        <p className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                          {message.text}
                        </p>
                      ) : (
                        <div className={`rounded-2xl px-4 py-2 ${
                          message.type === 'user' 
                            ? 'bg-[#6e2ea8] text-white rounded-br-sm' 
                            : message.type === 'agent'
                            ? 'bg-green-100 text-gray-800 rounded-bl-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}>
                          {message.attachment && (
                            <div className="mb-2">
                              {message.attachment.content_type?.startsWith('image/') ? (
                                <a href={`${API_URL}${message.attachment.url}`} target="_blank" rel="noopener noreferrer">
                                  <img 
                                    src={`${API_URL}${message.attachment.url}`} 
                                    alt={message.attachment.filename}
                                    className="max-w-full rounded-lg max-h-48 object-cover"
                                  />
                                </a>
                              ) : (
                                <a 
                                  href={`${API_URL}${message.attachment.url}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-2 rounded-lg ${
                                    message.type === 'user' ? 'bg-[#6e2ea8]/80' : 'bg-white/50'
                                  }`}
                                >
                                  {getFileIcon(message.attachment)}
                                  <span className="text-sm truncate">{message.attachment.filename}</span>
                                </a>
                              )}
                            </div>
                          )}
                          {message.text && !message.attachment && (
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          )}
                          {message.text && message.attachment && (
                            <p className="text-xs opacity-80 mt-1">{message.text}</p>
                          )}
                        </div>
                      )}
                      <p className={`text-xs text-gray-400 mt-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                        {message.agent_name || (message.type === 'ai' ? AI_DISPLAY_NAME : '')}
                        {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isLoading && aiEnabledForVisitors && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                      <img src={CHAT_ICON_URL} alt="GingerKare Chat" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Callback Form */}
              {showCallbackForm && (
                <div className="px-4 py-3 border-t bg-[#6e2ea8]/5">
                  <p className="text-sm font-medium text-gray-700 mb-2">Enter your phone number for a callback:</p>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8]"
                    />
                    <button
                      onClick={requestCallback}
                      disabled={!callbackPhone.trim() || submittingCallback}
                      className="px-4 py-2 bg-[#6e2ea8] text-white rounded-lg text-sm font-medium hover:bg-[#5a2690] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {submittingCallback ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Phone className="w-4 h-4" />
                      )}
                      Call Me
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCallbackForm(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              {status === 'active' && !showCallbackForm && (
                <div className="px-4 py-2 border-t flex gap-2">
                  <button
                    onClick={requestHuman}
                    className="flex-1 text-xs py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Talk to Human
                  </button>
                  <button
                    onClick={convertToLead}
                    className="flex-1 text-xs py-2 px-3 bg-[#6e2ea8]/10 hover:bg-[#6e2ea8]/20 text-[#6e2ea8] rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Ticket className="w-3 h-3" />
                    Get a Callback
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                
                {isUploading && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading file...
                  </div>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading || liveRepOnlyWaiting}
                    className="w-10 h-10 border border-gray-300 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all disabled:opacity-50"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onPaste={handlePaste}
                    placeholder={liveRepOnlyWaiting ? 'Waiting for a live representative...' : 'Type a message or paste an image...'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-[#6e2ea8] focus:border-[#6e2ea8] bg-white"
                    disabled={isLoading || isUploading || liveRepOnlyWaiting}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputText.trim() || isLoading || isUploading || liveRepOnlyWaiting}
                    className="w-10 h-10 bg-gradient-to-br from-[#6e2ea8] to-[#b9893d] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
