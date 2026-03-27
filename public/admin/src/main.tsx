import React from 'react';
import ReactDOM from 'react-dom/client';
import { connect } from "@/services/websocket";

import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

import { AppThemeProvider } from './contexts/AppThemeContext';

const root = document.getElementById('root');

if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </React.StrictMode>
);