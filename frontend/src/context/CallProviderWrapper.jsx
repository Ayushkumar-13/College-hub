// FILE: frontend/src/context/CallProviderWrapper.jsx

import React from "react";
import { CallProvider } from "./CallContext";
import { useAuth } from "@/hooks";

const CallProviderWrapper = ({ children }) => {
  const { user, loading } = useAuth();

  // 1️⃣ Wait until AuthContext finishes verifying token
  if (loading) {
    console.log("Auth is loading… delaying CallProvider");
    return <>{children}</>; // UI should still render normally
  }

  // 2️⃣ If user is not logged in → DO NOT initialize CallProvider
  if (!user) {
    console.warn("CallProviderWrapper: No authenticated user.");
    return <>{children}</>;
  }

  // 3️⃣ User is ready → Initialize CallProvider with user
  console.log("CallProviderWrapper → Authenticated User:", user);

  return (
    <CallProvider currentUser={user}>
      {children}
    </CallProvider>
  );
};

export default CallProviderWrapper;
