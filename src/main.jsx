import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css"; // Tailwind compiled here
import Test from './test.jsx';
import { Auth0Provider } from '@auth0/auth0-react';

import { UserContextProvider } from './context/UserContext.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
    >
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </Auth0Provider>
  </StrictMode>,
)
