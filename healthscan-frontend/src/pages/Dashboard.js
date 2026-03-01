// src/pages/Dashboard.js
import React, { useState } from "react";
import Upload from "./Upload";

export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("upload");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* NAVIGATION */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-sky-700">HealthScan</h1>

        <div className="flex items-center gap-4">
          <span className="text-gray-700">{user.name}</span>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="mt-6">
        {page === "upload" && <Upload token={localStorage.getItem("token")} />}
      </div>
    </div>
  );
}
