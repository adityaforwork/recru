import React, { useContext } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const {user, token} = useContext(AuthContext)

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Brand Logo & Name */}
      <div 
        className="flex items-center gap-2 cursor-pointer transition-transform active:scale-98"
        onClick={() => navigate('/')}
      >
        <img 
          src="https://ushayarns.com/wp-content/uploads/2024/11/logo-final-usha.svg#1173" 
          alt="Usha Yarns" 
          className="h-9 w-auto object-contain"
        />
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Integrated Search Bar (Highly Professional UX) */}
        <div 
          onClick={() => navigate('/search')}
          className="hidden sm:flex items-center gap-2.5 bg-gray-50 border border-gray-200/80 rounded-full px-3.5 py-1.5 w-64 text-gray-400 hover:bg-gray-100/70 hover:border-gray-300 transition-all duration-200 cursor-pointer group"
        >
          <Search className="h-4 w-4 text-gray-400 group-hover:text-green-800 transition-colors" />
          <span className="text-xs font-medium text-gray-400 group-hover:text-gray-500 transition-colors">Search anything...</span>
        </div>

        {/* Mobile Search Button */}
        <button
          onClick={() => navigate('/search')}
          className="sm:hidden p-2 text-gray-500 hover:text-green-800 hover:bg-green-50 rounded-full transition-all duration-200 cursor-pointer"
          title="Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications Icon */}
        <button className="relative p-2 text-gray-500 hover:text-green-800 hover:bg-green-50 rounded-full transition-all duration-200 cursor-pointer group">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
        </button>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-2 cursor-pointer p-1.5 pr-2.5 rounded-full border border-transparent hover:border-gray-200/60 hover:bg-gray-50/80 transition-all duration-200 group">
          {/* Avatar with corporate green accent matching the company profile */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-800 to-emerald-600 text-white flex items-center justify-center font-semibold text-xs tracking-wide shadow-sm">
            {user?.name? user.name.split().map(n => n[0]).join("").toUpperCase() : "?"}
          </div>
          <div className="hidden md:flex flex-col items-start leading-none">
            <span className="text-xs font-semibold text-gray-800 group-hover:text-green-900 transition-colors">{user.name}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{user.role}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-all duration-200 group-hover:translate-y-0.5" />
        </div>
      </div>
    </header>
  );
}
