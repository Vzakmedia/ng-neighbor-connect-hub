import { useState, useEffect, useCallback } from 'react';
import { useNativeNetwork } from './mobile/useNativeNetwork';

export interface NetworkPath {
  type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  qualityScore: number;
  isAvailable: boolean;
  lastUsed: number;
  successRate: number;
  rtt: number;
  packetLoss: number;
}

export interface NetworkQualityState {
  currentPath: NetworkPath;
  qualityScore: number;
  isBackgroundMode: boolean;
  shouldThrottle: boolean;
}

const BASE_SCORES = {
  wifi: 80,
  ethernet: 90,
  '5g': 75,
  '4g': 70,
  '3g': 40,
  '2g': 20,
  unknown: 50,
};

export const useNetworkQuality = () => {
  const { isOnline, connectionType } = useNativeNetwork();
  const [networkState, setNetworkState] = useState<NetworkQualityState>({
    currentPath: {
      type: 'unknown',
      qualityScore: 50,
      isAvailable: true,
      lastUsed: Date.now(),
      successRate: 100,
      rtt: 0,
      packetLoss: 0,
    },
    qualityScore: 50,
    isBackgroundMode: false,
    shouldThrottle: false,
  });

  // Track request performance
  const [performanceMetrics, setPerformanceMetrics] = useState({
    successCount: 0,
    failureCount: 0,
    totalRtt: 0,
    rttSamples: 0,
  });

  // Calculate quality score based on connection type and performance
  const calculateQualityScore = useCallback((
    type: string,
    rtt: number,
    packetLoss: number,
    successRate: number
  ): number => {
    // Get base score from connection type
    let baseScore = BASE_SCORES.unknown;
    
    if (type.includes('wifi')) {
      baseScore = BASE_SCORES.wifi;
    } else if (type.includes('ethernet')) {
      baseScore = BASE_SCORES.ethernet;
    } else if (type.includes('5g')) {
      baseScore = BASE_SCORES['5g'];
    } else if (type.includes('4g') || type.includes('lte')) {
      baseScore = BASE_SCORES['4g'];
    } else if (type.includes('3g')) {
      baseScore = BASE_SCORES['3g'];
    } else if (type.includes('2g')) {
      baseScore = BASE_SCORES['2g'];
    }

    // Adjust based on RTT (lower is better)
    let rttPenalty = 0;
    if (rtt > 500) rttPenalty = -30;
    else if (rtt > 300) rttPenalty = -20;
    else if (rtt > 150) rttPenalty = -10;
    else if (rtt > 50) rttPenalty = -5;

    // Adjust based on packet loss (lower is better)
    const lossPenalty = packetLoss * -2; // -2 points per 1% loss

    // Adjust based on success rate
    const successBonus = (successRate - 95) * 0.5;

    const finalScore = Math.max(0, Math.min(100, 
      baseScore + rttPenalty + lossPenalty + successBonus
    ));

    return finalScore;
  }, []);

  // Determine network path type
  const getNetworkPathType = useCallback((connectionType: string): NetworkPath['type'] => {
    const type = connectionType.toLowerCase();
    if (type.includes('wifi')) return 'wifi';
    if (type.includes('ethernet')) return 'ethernet';
    if (type.includes('cellular') || type.includes('mobile') || 
        type.includes('3g') || type.includes('4g') || type.includes('5g')) {
      return 'cellular';
    }
    return 'unknown';
  }, []);

  // Track successful request
  const trackSuccess = useCallback((rtt: number) => {
    setPerformanceMetrics(prev => ({
      successCount: prev.successCount + 1,
      failureCount: prev.failureCount,
      totalRtt: prev.totalRtt + rtt,
      rttSamples: prev.rttSamples + 1,
    }));
  }, []);

  // Track failed request
  const trackFailure = useCallback(() => {
    setPerformanceMetrics(prev => ({
      ...prev,
      failureCount: prev.failureCount + 1,
    }));
  }, []);

  // Update network quality based on current metrics
  useEffect(() => {
    const totalRequests = performanceMetrics.successCount + performanceMetrics.failureCount;
    const successRate = totalRequests > 0 
      ? (performanceMetrics.successCount / totalRequests) * 100 
      : 100;
    
    const avgRtt = performanceMetrics.rttSamples > 0
      ? performanceMetrics.totalRtt / performanceMetrics.rttSamples
      : 0;

    const packetLoss = totalRequests > 0
      ? (performanceMetrics.failureCount / totalRequests) * 100
      : 0;

    const pathType = getNetworkPathType(connectionType);
    const qualityScore = calculateQualityScore(connectionType, avgRtt, packetLoss, successRate);

    setNetworkState(prev => ({
      ...prev,
      currentPath: {
        type: pathType,
        qualityScore,
        isAvailable: isOnline,
        lastUsed: Date.now(),
        successRate,
        rtt: avgRtt,
        packetLoss,
      },
      qualityScore,
      shouldThrottle: qualityScore < 40 || packetLoss > 10,
    }));
  }, [
    connectionType, 
    isOnline, 
    performanceMetrics, 
    calculateQualityScore, 
    getNetworkPathType
  ]);

  // Detect background mode
  useEffect(() => {
    const handleVisibilityChange = () => {
      setNetworkState(prev => ({
        ...prev,
        isBackgroundMode: document.hidden,
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Get optimal polling interval based on quality and background mode
  const getOptimalPollingInterval = useCallback((): number => {
    if (networkState.isBackgroundMode) {
      return 30000; // 30s in background
    }

    if (networkState.qualityScore > 70) return 2000;
    if (networkState.qualityScore > 50) return 5000;
    if (networkState.qualityScore > 30) return 10000;
    return 15000;
  }, [networkState.qualityScore, networkState.isBackgroundMode]);

  // Check if should use cellular data
  const shouldUseCellular = useCallback((): boolean => {
    return networkState.currentPath.type === 'cellular' && 
           !networkState.isBackgroundMode;
  }, [networkState.currentPath.type, networkState.isBackgroundMode]);

  // Check if should batch requests
  const shouldBatchRequests = useCallback((): boolean => {
    return networkState.shouldThrottle || 
           networkState.isBackgroundMode ||
           networkState.qualityScore < 50;
  }, [networkState.shouldThrottle, networkState.isBackgroundMode, networkState.qualityScore]);

  return {
    ...networkState,
    trackSuccess,
    trackFailure,
    getOptimalPollingInterval,
    shouldUseCellular,
    shouldBatchRequests,
    isOnline,
  };
};
