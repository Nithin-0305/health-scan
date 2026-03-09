import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function History({ token, onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true); // NEW

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true); // NEW

        const res = await fetch(`${API_BASE}/api/reports`, {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        const data = await res.json();
        setReports(data.reports || []);

      } catch (err) {
        console.error("History fetch error", err);
      } finally {
        setLoading(false); // NEW
      }
    };

    fetchReports();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Report History
        </h2>

        {/* Loading state */}
        {loading && (
          <p className="text-gray-500">
            Loading reports...
          </p>
        )}

        {/* No reports AFTER loading */}
        {!loading && reports.length === 0 && (
          <p className="text-gray-500">
            No reports found.
          </p>
        )}

        {/* Report list */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="border p-4 rounded-lg shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">
                    {report.originalFilename}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(report.uploadedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">

                  {report.aiExplanation && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        report.aiExplanation.riskLevel === "High"
                          ? "bg-red-100 text-red-700"
                          : report.aiExplanation.riskLevel === "Moderate"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {report.aiExplanation.riskLevel}
                    </span>
                  )}

                  <button
                    onClick={() => onSelectReport(report._id)}
                    className="bg-sky-600 text-white px-3 py-1 rounded text-sm hover:bg-sky-700"
                  >
                    View
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}