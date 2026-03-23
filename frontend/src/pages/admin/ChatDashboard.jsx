import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import axios from 'axios';
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Bot,
  User,
  UserCheck,
  Eye,
  Volume2,
  VolumeX,
  Loader2,
  RefreshCw,
  X,
  Trash2,
  MessageSquare,
  ExternalLink,
  Globe,
  Users,
  MousePointer
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const STAFF_CHAT_INITIATED_SOUND_URL = 'https://customer-assets.emergentagent.com/job_808bae03-b30d-4055-83be-4ec1ad35d078/artifacts/lomxogl2_new-notification.mp3';

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

// Notification sound for page landings
const playPageLandingSound = () => {
  const audio = new Audio('/notification-page-landing.mp3');
  audio.volume = 0.6;
  audio.play().catch(() => {});
};

const playNotificationSound = () => {
  const audio = new Audio(STAFF_CHAT_INITIATED_SOUND_URL);
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

export default function ChatDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingChats, setPendingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [myChats, setMyChats] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [lastVisitorCount, setLastVisitorCount] = useState(0);
  const [initiatingChat, setInitiatingChat] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
    fetchVisitors();
    fetchAvailability();
    
    const interval = setInterval(() => {
      fetchData();
      fetchVisitors();
      checkNotifications();
      checkVisitorNotifications();
      if (selectedChat) {
        fetchChatDetails(selectedChat.id);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [selectedChat]);

  useEffect(() => {
    // Only scroll within the messages container, not the whole page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [selectedChat?.messages]);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, activeRes, myRes] = await Promise.all([
        axios.get(`${API_URL}/api/chat/admin/stats`, { headers: getHeaders() }),
        axios.get(`${API_URL}/api/chat/admin/pending`, { headers: getHeaders() }),
        axios.get(`${API_URL}/api/chat/admin/active`, { headers: getHeaders() }),
        axios.get(`${API_URL}/api/chat/admin/my-chats`, { headers: getHeaders() })
      ]);
      
      setStats(statsRes.data);
      setPendingChats(pendingRes.data.chats || []);
      setActiveChats(activeRes.data.chats || []);
      setMyChats(myRes.data.chats || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitors = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/admin/visitors`, { headers: getHeaders() });
      setVisitors(response.data.visitors || []);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/admin/availability`, { headers: getHeaders() });
      setIsAvailable(response.data.is_available || false);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const checkVisitorNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/admin/visitor-notifications`, { headers: getHeaders() });
      const count = response.data.count || 0;
      
      if (count > lastVisitorCount && soundEnabled) {
        playPageLandingSound();
        // Mark as read after playing sound
        await axios.post(`${API_URL}/api/chat/admin/visitor-notifications/mark-read`, {}, { headers: getHeaders() });
      }
      setLastVisitorCount(count);
    } catch (error) {
      console.error('Error checking visitor notifications:', error);
    }
  };

  const checkNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/admin/notifications`, { headers: getHeaders() });
      const count = response.data.count || 0;
      
      if (count > lastNotificationCount && soundEnabled) {
        playNotificationSound();
      }
      setLastNotificationCount(count);
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const fetchChatDetails = async (chatId) => {
    try {
      const response = await axios.get(`${API_URL}/api/chat/admin/chat/${chatId}`, { headers: getHeaders() });
      setSelectedChat(response.data);
    } catch (error) {
      console.error('Error fetching chat details:', error);
    }
  };

  const updateAvailability = async (available) => {
    try {
      await axios.post(`${API_URL}/api/chat/admin/set-availability?is_available=${available}`, {}, { headers: getHeaders() });
      setIsAvailable(available);
      toast.success(available ? 'You are now available for chats' : 'You are now offline');
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  const joinChat = async (chatId) => {
    try {
      await axios.post(`${API_URL}/api/chat/admin/join/${chatId}`, {}, { headers: getHeaders() });
      toast.success('Joined chat');
      fetchData();
      fetchChatDetails(chatId);
    } catch (error) {
      toast.error('Failed to join chat');
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChat) return;
    
    try {
      await axios.post(`${API_URL}/api/chat/admin/message`, {
        session_id: selectedChat.session_id,
        text: messageInput
      }, { headers: getHeaders() });
      
      setMessageInput('');
      fetchChatDetails(selectedChat.id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const closeChat = async (chatId) => {
    try {
      await axios.post(`${API_URL}/api/chat/admin/close/${chatId}`, {}, { headers: getHeaders() });
      toast.success('Chat closed');
      setSelectedChat(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to close chat');
    }
  };

  const initiateChat = async (visitorId) => {
    try {
      setInitiatingChat(visitorId);
      const response = await axios.post(`${API_URL}/api/chat/admin/initiate-chat/${visitorId}`, {}, { headers: getHeaders() });
      toast.success('Chat initiated! Waiting for visitor to accept.');
      fetchData();
      fetchChatDetails(response.data.chat_id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate chat');
    } finally {
      setInitiatingChat(null);
    }
  };

  const getPageName = (url) => {
    if (!url) return 'Unknown';
    if (url === '/') return 'Home';
    if (url.includes('/peptides')) return 'Catalog Shop';
    if (url.includes('/peptides-research')) return 'Research Library';
    if (url.includes('/about')) return 'About Us';
    if (url.includes('/contact')) return 'Contact';
    if (url.includes('/cart')) return 'Shopping Cart';
    if (url.includes('/checkout')) return 'Checkout';
    if (url.includes('/location')) return 'Location Page';
    return url.replace(/^\//, '').replace(/-/g, ' ') || 'Home';
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const openChatWindow = (chatId) => {
    window.open(`/admin/chat/${chatId}`, 'chat_window', 'width=800,height=700');
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`${API_URL}/api/chat/admin/chat/${chatId}`, { headers: getHeaders() });
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
      fetchData();
      toast.success('Chat deleted');
    } catch (error) {
      toast.error('Failed to delete chat');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting_human':
        return <Badge className="bg-yellow-100 text-yellow-700"><AlertCircle className="w-3 h-3 mr-1" />Waiting</Badge>;
      case 'with_human':
        return <Badge className="bg-green-100 text-green-700"><UserCheck className="w-3 h-3 mr-1" />With Agent</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700"><Bot className="w-3 h-3 mr-1" />AI Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="chat-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat Dashboard</h2>
          <p className="text-muted-foreground">Manage customer conversations</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute notifications' : 'Enable notifications'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              checked={isAvailable}
              onCheckedChange={updateAvailability}
              id="availability"
              data-testid="chat-live-rep-online-switch"
            />
            <Label htmlFor="availability" className={isAvailable ? 'text-green-600' : 'text-gray-500'} data-testid="chat-live-rep-online-label">
              {isAvailable ? 'Live Rep Online' : 'Live Rep Offline'}
            </Label>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="border-[#6e2ea8]/30 bg-[#6e2ea8]/5">
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-[#6e2ea8]">{visitors.length}</div>
              <p className="text-xs text-muted-foreground">Visitors Online</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active Chats</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.waiting_for_human}</div>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.with_human}</div>
              <p className="text-xs text-muted-foreground">With Agent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold">{stats.closed}</div>
              <p className="text-xs text-muted-foreground">Closed Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-[#b9893d]">{stats.converted_to_leads}</div>
              <p className="text-xs text-muted-foreground">Leads Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.available_agents}</div>
              <p className="text-xs text-muted-foreground">Agents Online</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Live Visitors */}
          <Card className="border-[#6e2ea8]/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#6e2ea8]" />
                Live Visitors ({visitors.length})
              </CardTitle>
              <CardDescription>Click to start a proactive chat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {visitors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No visitors online</p>
              ) : (
                visitors.map(visitor => (
                  <div
                    key={visitor.visitor_id}
                    className="p-3 bg-gradient-to-r from-[#6e2ea8]/5 to-transparent rounded-lg border border-[#6e2ea8]/20 hover:border-[#6e2ea8]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="font-medium text-sm">{getPageName(visitor.page_url)}</span>
                      </div>
                      <span className="text-xs text-gray-400">{getTimeSince(visitor.last_seen)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MousePointer className="w-3 h-3" />
                        {visitor.page_views || 1} pages viewed
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs border-[#6e2ea8] text-[#6e2ea8] hover:bg-[#6e2ea8] hover:text-white"
                        onClick={() => initiateChat(visitor.visitor_id)}
                        disabled={initiatingChat === visitor.visitor_id}
                      >
                        {initiatingChat === visitor.visitor_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Chat
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pending Chats */}
          {pendingChats.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  Waiting for Agent ({pendingChats.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingChats.map(chat => (
                  <div
                    key={chat.id}
                    className="p-3 bg-white rounded-lg border border-yellow-200 cursor-pointer hover:border-yellow-400 transition-colors"
                    onClick={() => fetchChatDetails(chat.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{chat.visitor_name || 'Visitor'}</span>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); joinChat(chat.id); }}>
                        Join
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {chat.messages?.[chat.messages.length - 1]?.text || 'No messages'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Active Chats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                My Chats ({myChats.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myChats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No active chats</p>
              ) : (
                myChats.map(chat => (
                  <div
                    key={chat.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id ? 'border-[#6e2ea8] bg-[#6e2ea8]/5' : 'hover:border-gray-300'
                    }`}
                    onClick={() => fetchChatDetails(chat.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{chat.visitor_name || 'Visitor'}</span>
                      {getStatusBadge(chat.status)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {chat.messages?.[chat.messages.length - 1]?.text || 'No messages'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* All Active Chats (for supervisors) */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                All Active ({activeChats.filter(c => c.status === 'with_human').length})
              </CardTitle>
              <CardDescription>Monitor other agents' chats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {activeChats.filter(c => c.status === 'with_human' && c.agent_id).map(chat => (
                <div
                  key={chat.id}
                  className="p-3 rounded-lg border cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => fetchChatDetails(chat.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{chat.visitor_name || 'Visitor'}</span>
                    <Badge variant="outline" className="text-xs">{chat.agent_name}</Badge>
                  </div>
                  {chat.typing_text && (
                    <p className="text-xs text-[#b9893d] mt-1 italic">
                      Typing: {chat.typing_text.substring(0, 30)}...
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedChat ? (
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedChat.visitor_name || 'Visitor'}
                    </CardTitle>
                    <CardDescription>
                      {selectedChat.visitor_email || 'No email provided'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedChat.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openChatWindow(selectedChat.id)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Pop Out
                    </Button>
                    {selectedChat.status === 'with_human' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeChat(selectedChat.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Close
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the chat and all messages. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteChat(selectedChat.id)} 
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {/* AI Conversation History Accordion */}
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="ai-history">
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4" />
                        View AI Conversation History
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="max-h-40 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded">
                        {selectedChat.messages?.filter(m => m.type === 'ai' || (m.type === 'user' && selectedChat.messages.indexOf(m) < selectedChat.messages.findIndex(x => x.type === 'system' && x.text.includes('joined')))).map(msg => (
                          <div key={msg.id} className={`text-xs p-2 rounded ${msg.type === 'user' ? 'bg-blue-50 ml-4' : 'bg-[#b9893d]/10 mr-4'}`}>
                            <span className="font-medium">{msg.type === 'user' ? 'User' : 'Betty'}:</span> {msg.text}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardHeader>

              {/* Messages */}
              <CardContent ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedChat.messages?.filter(m => m.type !== 'whisper').map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.type === 'agent' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.type !== 'system' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.type === 'user' ? 'bg-blue-100' :
                        msg.type === 'agent' ? 'bg-green-100' : 'bg-[#b9893d]/10'
                      }`}>
                        {msg.type === 'user' && <User className="w-4 h-4 text-blue-600" />}
                        {msg.type === 'agent' && <UserCheck className="w-4 h-4 text-green-600" />}
                        {msg.type === 'ai' && <Bot className="w-4 h-4 text-[#b9893d]" />}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${msg.type === 'system' ? 'w-full text-center' : ''}`}>
                      {msg.type === 'system' ? (
                        <p className="text-xs text-gray-500 bg-gray-100 rounded px-3 py-2">{msg.text}</p>
                      ) : (
                        <div className={`rounded-2xl px-4 py-2 ${
                          msg.type === 'user' ? 'bg-blue-100' :
                          msg.type === 'agent' ? 'bg-green-100' :
                          'bg-[#b9893d]/10'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              {selectedChat.status === 'with_human' && selectedChat.agent_id && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                    />
                    <Button onClick={sendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Select a chat to view messages</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
