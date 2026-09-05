import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, MessageSquare, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      navigate('/login?next=/messages', { replace: true });
      return;
    }
    loadMessages();
  }, [isLoadingAuth, user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const records = await api.entities.Message.list('-created_date', 100);
      setMessages(records);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.entities.Message.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  if (isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <PullToRefresh onRefresh={async () => { await queryClientInstance.invalidateQueries(); }}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Messages</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Messages</h1>

        {messages.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">Messages you send to sellers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => {
              const isSentByMe = msg.sender_email === user.email;
              return (
                <div key={msg.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSentByMe ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                          {isSentByMe ? 'Sent' : 'Received'}
                        </span>
                        <span className="text-sm font-medium text-foreground">{isSentByMe ? msg.seller_name : msg.sender_name}</span>
                      </div>
                      {msg.ad_title && <p className="text-xs text-muted-foreground mb-2">Re: {msg.ad_title}</p>}
                      <p className="text-sm text-foreground">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {msg.created_date ? new Date(msg.created_date).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </PullToRefresh>
      <Footer />
    </div>
  );
}