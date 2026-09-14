import React, { useContext, useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import NotificationDrawer from "./NotificationDrawer";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext); // logout yahan se aayega
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // new
  const profileRef = useRef(null);

  // bahar click pe band ho jaye
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current &&!profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout(); // AuthContext wala logout
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src="https://ushayarns.com/wp-content/uploads/2024/11/logo-final-usha.svg#1173" alt="Usha Yarns" className="h-9 w-auto" />
        </div>

        <div className="flex items-center gap-4">
          <div onClick={() => navigate('/search')} className="hidden sm:flex items-center gap-2.5 bg-gray-50 border rounded-full px-3.5 py-1.5 w-64 text-gray-400 hover:bg-gray-100 cursor-pointer group">
            <Search className="h-4 w-4" />
            <span className="text-xs font-medium">Search anything...</span>
          </div>

          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-gray-500 hover:text-green-800 hover:bg-green-50 rounded-full transition-all cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
          </button>

          {/* USER PILL WITH LOGOUT */}
          <div className="relative" ref={profileRef}>
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 cursor-pointer p-1.5 pr-2.5 rounded-full hover:bg-gray-50 group border border-transparent hover:border-gray-100"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-800 to-emerald-600 text-white flex items-center justify-center font-semibold text-xs">
                {user?.name? user.name.split(' ').map(n => n[0]).join("").slice(0,2).toUpperCase() : "?"}
              </div>
              <div className="hidden md:flex flex-col items-start leading-none">
                <span className="text-xs font-semibold text-gray-800">{user?.name}</span>
                <span className="text- text-gray-400 mt-0.5">{user?.role}</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isProfileOpen? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg shadow-gray-200/50 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-50">
                  <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text- text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}