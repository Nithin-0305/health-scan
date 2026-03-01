import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from "./pages/Upload";
import History from "./pages/History";

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [page, setPage] = useState("upload"); // 👈 NEW
const [selectedReportId, setSelectedReportId] = useState(null);
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          return;
        }
        const json = await res.json();
        setUser(json.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      });
  }, [token]);

  const onAuth = ({ token, user }) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /* ===== AUTH SCREENS ===== */
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">

          <div className="flex mb-6">
            <button
              className={`flex-1 p-2 font-semibold ${
                showLogin ? 'bg-sky-600 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>

            <button
              className={`flex-1 p-2 font-semibold ${
                !showLogin ? 'bg-sky-600 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setShowLogin(false)}
            >
              Register
            </button>
          </div>

          {showLogin ? (
            <Login onLogin={onAuth} apiBase={API_BASE} />
          ) : (
            <Register onRegister={onAuth} apiBase={API_BASE} />
          )}

        </div>
      </div>
    );
  }

  /* ===== MAIN APP ===== */
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Top Navigation */}
      <div className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">HealthScan</h1>

        <div className="space-x-6">
          <button
            onClick={() => setPage("upload")}
            className={`text-sm font-semibold ${
              page === "upload" ? "text-sky-600" : "text-gray-600"
            }`}
          >
            Upload
          </button>

          <button
            onClick={() => setPage("history")}
            className={`text-sm font-semibold ${
              page === "history" ? "text-sky-600" : "text-gray-600"
            }`}
          >
            History
          </button>

          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Page Content */}
      {page === "upload" && (
      <Upload
        token={token}
        onLogout={logout}
        selectedReportId={selectedReportId}
      />
    )}

      {page === "history" && (
      <History
        token={token}
        onSelectReport={(id) => {
          setSelectedReportId(id);
          console.log("Selected from History:", id);
          setPage("upload");
        }}
      />
    )}

    </div>
  );
}

export default App;