import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, AuthContext } from "./Context/AuthContext";
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";

import Dashboard from "./Pages/Dashboard";
import Candidates from "./Pages/Candidates/Candidates";
import Vacancies from "./Pages/Vacancies/Vacancies";
import Interviews from "./Pages/Interviews";
import SearchPage from "./Pages/Search";
import ApplicationsList from "./Pages/Applications/ApplicationsList";
import Login from "./Pages/Login"; // 1. Login import karo

import ReportsLayout from "./Pages/Reports/index";
import Overview from "./Pages/Reports/Overview";
import PipelineReport from "./Pages/Reports/PipelineReport";

import SettingsLayout from "./Pages/Settings/index";
import UsersSettings from "./Pages/Settings/Users";

// 2. Ye Gatekeeper hai - PHP ke session check jaisa
function ProtectedRoute() {
  const { isLoggedIn, loading } = useContext(AuthContext);
  if (loading) return <div className="p-10">Checking session...</div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// 3. Ye Layout hai - Navbar/Sidebar sirf login ke baad dikhega
function ProtectedLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-50/30">
          <div className="h-[calc(100vh-64px)] overflow-y-auto p-0">
            <Outlet /> {/* Yahan Dashboard, Candidates etc ayenge */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public - bina login ke khulega */}
          <Route path="/login" element={<Login />} />

          {/* Protected - login ke bina kuch nahi khulega */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/candidates/:id" element={<Candidates />} /> 
              <Route path="/vacancies" element={<Vacancies />} />
              <Route path="/interviews" element={<Interviews />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/applications" element={<ApplicationsList />} />

              <Route path="/settings" element={<SettingsLayout />}>
                <Route index element={<div className="p-4">General Settings - Coming Soon</div>} />
                <Route path="users" element={<UsersSettings />} />
              </Route>

              <Route path="/reports" element={<ReportsLayout />}>
                <Route index element={<Overview />} />
                <Route path="pipeline" element={<PipelineReport />} />
                <Route path="source" element={<div className="p-4">Source Report - Coming Soon</div>} />
              </Route>
            </Route>
          </Route>

          {/* Galat URL pe login pe bhej do */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}