import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Dashboard from './pages/Dashboard.jsx'
import ProjectPage from './pages/ProjectPage.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projet/:slug" element={<ProjectPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
