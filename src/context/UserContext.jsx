import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import DeviceFingerprintService from '../utils/fingerprinting';
export const UserContext = createContext(null);

import init from "../init";
import axios from "axios";

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

const getHeaders = (rawIdToken) => {
  return {
    "Authorization": `Bearer ${rawIdToken}`,
  }
};

const getActiveUser = '/' + init.appName + '/api/users/';

const createAuthlog = async (rawIdToken, eventType, status, error) => {
  await axios.post(`/${init.appName}/api/authlogs`, {
    eventType: eventType,
    status: status,
    userAgent: navigator.userAgent,
    metadataJson: {
      "reason": status,
      "browser": DeviceFingerprintService.getBrowserVendor(),
      "device_type": navigator.userAgentData.platform,
      "eror": error
    },
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${rawIdToken}`,
    }
  });
}


export function UserContextProvider({ children }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    getIdTokenClaims
  } = useAuth0();

  let beingLogin = false;

  const [appUser, setAppUser] = useState(undefined);
  const [error, setError] = useState(undefined);
  const [token, setToken] = useState(undefined);

  const getUser = async (rawIdToken) => {

    try {
      const response = await fetch(`${getActiveUser}`, { headers: getHeaders(rawIdToken, '') });
      
      if (!response.ok) throw new Error('Failed to fetch user');
      const user = await response.json();
      setAppUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('User fetched:', user);
      if (!localStorage.getItem(rawIdToken)) {
        await createAuthlog(rawIdToken, `login`, `success`, `none`);
        localStorage.setItem(rawIdToken, `login`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!localStorage.getItem(rawIdToken)) {
        await createAuthlog(rawIdToken, `login`, `failure`, error);
        localStorage.setItem(rawIdToken, error);
      }
    } finally {

    }
  };

  const cleanupAndLogout = async () => {
    console.log(`clear the localStorage`);
    await createAuthlog(token, `logout`, `success`, `none`);
    setAppUser(undefined);
    setToken(undefined);
    localStorage.clear();
    logout({ logoutParams: { returnTo: window.location.origin } });
  }

  useEffect(() => {
    const initialize = async () => {
      if (appUser) return;

      if (beingLogin) return;
      beingLogin = !beingLogin;

      if (import.meta.env.VITE_DEV) {
        console.log(`user context: get user from local dev user ${import.meta.env.VITE_DEV}`);
        setToken(import.meta.env.VITE_DEV);
        await getUser(import.meta.env.VITE_DEV);
      } else if (user && !appUser) {
        const claims = await getIdTokenClaims();
        const rawIdToken = claims.__raw;
        console.log(rawIdToken);
        setToken(rawIdToken);
        await getUser(rawIdToken);
      }
      beingLogin = !beingLogin;
    }
    initialize();
  }, [isAuthenticated, appUser]);

  const value = {
    user,
    appUser,
    isAuthenticated,
    isLoading,
    token,
    loginWithRedirect,
    login: () => loginWithRedirect(),
    logout: () => cleanupAndLogout(),
    getAccessTokenSilently
  };



  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
