import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import MessagingContent from '@/components/messaging/MessagingContent';
import TestAudioButton from '@/components/TestAudioButton';

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-64 pb-16 md:pb-0">
        <div className="container py-6 max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <TestAudioButton />
          </div>
          <MessagingContent />
        </div>
      </main>
    </div>
  );
};

export default Messages;