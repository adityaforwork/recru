import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Calendar,
  UserCheck,
  BarChart3,
  Settings,
} from "lucide-react";

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Vacancies", icon: Briefcase, path: "/vacancies" },
  { name: "Candidates", icon: Users, path: "/candidates" },
  { name: "Applications", icon: FileText, path: "/applications" },
  { name: "Interviews", icon: Calendar, path: "/interviews" },
];

const bottomNavItems = [
  { name: "Reports", icon: BarChart3, path: "/reports" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      {/* Main Navigation Links */}
      <nav className="space-y-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-green-50 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-green-700" : "text-gray-400"
                    }`}
                  />

                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Secondary Bottom Links */}
      <div className="pt-4 border-t border-gray-100 space-y-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-600 hover:bg-green-50 hover:text-gray-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-green-700" : "text-gray-400"
                    }`}
                  />

                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
