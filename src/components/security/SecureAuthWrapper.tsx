import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecurityHeaders } from './SecurityHeaders';
import { useAuth } from '@/hooks/useAuth';

interface SecureAuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const SecureAuthWrapper: React.FC<SecureAuthWrapperProps> = ({ 
  children, 
  requireAuth = false 
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Implement session timeout (30 minutes of inactivity)
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        if (user && requireAuth) {
          // Log user out after 30 minutes of inactivity
          navigate('/auth');
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [user, requireAuth, navigate]);

  useEffect(() => {
    if (requireAuth && !loading && !user) {
      navigate('/auth');
    }
  }, [requireAuth, loading, user, navigate]);

  if (requireAuth && !loading && !user) {
    return null;
  }

  return (
    <>
      <SecurityHeaders />
      {children}
    </>
  );
};
