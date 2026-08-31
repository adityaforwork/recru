import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";

import Dashboard from "./Pages/Dashboard";
import Candidates from "./Pages/Candidates/Candidates";
import Vacancies from "./Pages/Vacancies/Vacancies";
import Interviews from "./Pages/Interviews";

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-h-full flex flex-col bg-white">
        <Navbar />

        <div className="flex flex-1 ">
          <Sidebar />

          <main className="flex-1">
            <div className="h-[90vh] overflow-y-scroll">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/vacancies" element={<Vacancies />} />
                <Route path="/interviews" element={<Interviews />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
