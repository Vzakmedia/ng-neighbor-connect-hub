import { useState, useEffect, useCallback, useRef } from 'react';
import { useNativeNetwork } from './mobile/useNativeNetwork';
import { useNetworkQuality } from './useNetworkQuality';
import { CongestionController } from '@/utils/congestionControl';
import { ReconnectionManager, ConnectionState } from '@/utils/reconnectionManager';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectionManagerState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'none';
  networkQuality: number;
  connectionState: ConnectionState;
  reconnectAttempts: number;
  lastConnectedAt: number;
  congestionLevel: 'none' | 'low' | 'medium' | 'high';
  currentRtt: number;
  effectiveBandwidth: number;
  pendingMessages: number;
  isProcessingQueue: boolean;
}

export const useConnectionManager = () => {
  const { isOnline, connectionType: rawConnectionType } = useNativeNetwork();
  const networkQuality = useNetworkQuality();
  
  const congestionController = useRef(new CongestionController());
  const reconnectionManager = useRef(new ReconnectionManager());
  
  const [state, setState] = useState<ConnectionManagerState>({
    isOnline,
    connectionType: 'none',
    networkQuality: 50,
    connectionState: 'disconnected',
    reconnectAttempts: 0,
    lastConnectedAt: 0,
    congestionLevel: 'none',
    currentRtt: 0,
    effectiveBandwidth: 0,
    pendingMessages: 0,
    isProcessingQueue: false,
  });

  const [previousConnectionType, setPreviousConnectionType] = useState<string>('');

  // Map raw connection type to simplified type
  const getConnectionType = useCallback((rawType: string): ConnectionManagerState['connectionType'] => {
    const type = rawType.toLowerCase();
    if (type.includes('wifi')) return 'wifi';
    if (type.includes('ethernet')) return 'ethernet';
    if (type.includes('cellular') || type.includes('mobile') || 
        type.includes('3g') || type.includes('4g') || type.includes('5g')) {
      return 'cellular';
    }
    return 'none';
  }, []);

  // Handle reconnection attempt
  const attemptReconnect = useCallback(async () => {
    try {
      // Test connection by making a simple query
      await supabase.from('profiles').select('user_id').limit(1).single();
      reconnectionManager.current.onConnected();
    } catch (error) {
      throw error;
    }
  }, []);

  // Initialize reconnection manager
  useEffect(() => {
    reconnectionManager.current.setOnReconnect(attemptReconnect);
    reconnectionManager.current.setOnStateChange((connectionState) => {
      const reconnectState = reconnectionManager.current.getState();
      setState(prev => ({
        ...prev,
        connectionState,
        reconnectAttempts: reconnectState.attempts,
        lastConnectedAt: reconnectState.lastConnectedAt,
      }));
    });
  }, [attemptReconnect]);

  // Handle network changes and handoffs
  useEffect(() => {
    if (!isOnline) {
      reconnectionManager.current.onDisconnected('Network offline');
      setState(prev => ({ ...prev, isOnline: false, connectionType: 'none' }));
      return;
    }

    const connectionType = getConnectionType(rawConnectionType);
    
    // Detect network handoff (WiFi <-> Cellular)
    if (previousConnectionType && previousConnectionType !== rawConnectionType) {
      console.log(`[ConnectionManager] Network handoff: ${previousConnectionType} -> ${rawConnectionType}`);
      reconnectionManager.current.onNetworkHandoff();
    }
    
    setPreviousConnectionType(rawConnectionType);
    setState(prev => ({ ...prev, isOnline: true, connectionType }));

    // Attempt connection if not connected
    if (reconnectionManager.current.getConnectionState() !== 'connected') {
      reconnectionManager.current.connect();
    }
  }, [isOnline, rawConnectionType, previousConnectionType, getConnectionType]);

  // Update network quality and congestion state
  useEffect(() => {
    const congestionState = congestionController.current.getState();
    const congestionLevel = congestionController.current.getCongestionLevel();
    const sendRate = congestionController.current.getSendRate();

    setState(prev => ({
      ...prev,
      networkQuality: networkQuality.qualityScore,
      congestionLevel,
      currentRtt: congestionState.rtt,
      effectiveBandwidth: sendRate,
      pendingMessages: congestionState.pendingAcks,
    }));
  }, [networkQuality.qualityScore]);

  // Track message send
  const trackMessageSend = useCallback((messageId: string) => {
    congestionController.current.trackSend(messageId);
    networkQuality.trackSuccess(0); // Will be updated on ACK
  }, [networkQuality]);

  // Track message acknowledgment
  const trackMessageAck = useCallback((messageId: string, rtt: number) => {
    congestionController.current.trackAck(messageId);
    networkQuality.trackSuccess(rtt);
  }, [networkQuality]);

  // Track message failure
  const trackMessageFailure = useCallback(() => {
    congestionController.current.onFailure();
    networkQuality.trackFailure();
  }, [networkQuality]);

  // Check if can send message
  const canSendMessage = useCallback((): boolean => {
    return isOnline && 
           reconnectionManager.current.isConnected() &&
           congestionController.current.canSend();
  }, [isOnline]);

  // Schedule message send with congestion control
  const scheduleMessageSend = useCallback(
    (messageId: string, data: any, priority: boolean = false) => {
      if (!canSendMessage() && !priority) {
        return false;
      }

      congestionController.current.addToBatch(messageId, data, priority);
      return true;
    },
    [canSendMessage]
  );

  // Manual retry connection
  const retryConnection = useCallback(async () => {
    await reconnectionManager.current.manualRetry();
  }, []);

  // Get optimal settings based on current conditions
  const getOptimalSettings = useCallback(() => {
    return {
      pollingInterval: networkQuality.getOptimalPollingInterval(),
      shouldBatch: networkQuality.shouldBatchRequests(),
      shouldUseCellular: networkQuality.shouldUseCellular(),
      maxConcurrentRequests: Math.floor(congestionController.current.getState().windowSize),
      isBackgroundMode: networkQuality.isBackgroundMode,
    };
  }, [networkQuality]);

  // Cleanup
  useEffect(() => {
    return () => {
      reconnectionManager.current.destroy();
      congestionController.current.reset();
    };
  }, []);

  // Subscribe to connection state changes
  const onConnectionStateChange = useCallback((callback: (state: ConnectionState) => void) => {
    reconnectionManager.current.setOnStateChange(callback);
  }, []);

  return {
    state,
    trackMessageSend,
    trackMessageAck,
    trackMessageFailure,
    canSendMessage,
    scheduleMessageSend,
    retryConnection,
    getOptimalSettings,
    networkQuality,
    onConnectionStateChange,
  };
};
