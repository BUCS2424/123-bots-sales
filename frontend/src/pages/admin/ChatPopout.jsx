import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Send, User, UserCheck, Bot, Trash2, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ChatPopout = () => {
  const { chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchChat();
    const interval = setInterval(fetchChat, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  const fetchChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/chat/admin/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChat(response.data);
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !chat) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/chat/admin/message/${chat.id}`, null, {
        params: { message: messageInput },
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessageInput('');
      fetchChat();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const deleteChat = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/chat/admin/chat/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Chat Deleted', description: 'The chat has been removed.' });
      window.close();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete chat', variant: 'destructive' });
    }
  };

  const closeChat = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/chat/admin/close/${chatId}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Chat Closed' });
      fetchChat();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to close chat', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting_human':
        return <Badge className="bg-yellow-100 text-yellow-700">Waiting</Badge>;
      case 'with_human':
        return <Badge className="bg-green-100 text-green-700">With Agent</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700">AI Active</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Chat not found</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {chat.visitor_name || 'Visitor'}
                {getStatusBadge(chat.status)}
              </CardTitle>
              <CardDescription>
                {chat.visitor_email || 'No email provided'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {chat.status === 'with_human' && (
                <Button variant="outline" size="sm" onClick={closeChat}>
                  <X className="w-4 h-4 mr-1" />
                  Close Chat
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
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
                    <AlertDialogAction onClick={deleteChat} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chat.messages?.filter(m => m.type !== 'whisper').map(msg => (
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
        </CardContent>

        {/* Input */}
        {chat.status === 'with_human' && (
          <div className="p-4 border-t flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                placeholder="Type a message..."
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        {chat.status === 'closed' && (
          <div className="p-4 border-t text-center text-gray-500 text-sm">
            This chat has been closed
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChatPopout;
