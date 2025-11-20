// FILE: frontend/src/context/CallProviderWrapper.jsx
/**
 * Global Call Provider Wrapper
 * Makes call overlay work on EVERY page (WhatsApp-style)
 */
import React from 'react';
import { CallProvider } from './CallContext';
import GlobalCallOverlay from '@/components/Call/GlobalCallOverlay';

const CallProviderWrapper = ({ children }) => {
  return (
    <CallProvider>
      {/* Your app content */}
      {children}
      
      {/* ✅ Global Call Overlay - Always rendered, works everywhere */}
      <GlobalCallOverlay />
    </CallProvider>
  );
};

export default CallProviderWrapper;