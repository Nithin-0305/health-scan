// import React, { useState, useEffect } from "react";

// const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// export default function Upload({ token }) {
//   const [file, setFile] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [reportId, setReportId] = useState(null);
//   const [status, setStatus] = useState(null);
//   const [report, setReport] = useState(null);
//   const [error, setError] = useState(null);

//   const handleUpload = () => {
//     if (!file) return setError("Please select a file");

//     setError(null);
//     setUploading(true);
//     setProgress(0);

//     const form = new FormData();
//     form.append("file", file);

//     const xhr = new XMLHttpRequest();
//     xhr.open("POST", `${API_BASE}/api/reports/upload`, true);
//     xhr.setRequestHeader("Authorization", "Bearer " + token);

//     xhr.upload.onprogress = (e) => {
//       if (e.lengthComputable) {
//         setProgress(Math.round((e.loaded / e.total) * 100));
//       }
//     };

//     xhr.onload = () => {
//       setUploading(false);
//       if (xhr.status === 200) {
//         const data = JSON.parse(xhr.responseText);
//         setReportId(data.reportId);
//         setStatus("uploaded");
//       } else {
//         setError("Upload failed");
//       }
//     };

//     xhr.onerror = () => {
//       setUploading(false);
//       setError("Network error");
//     };

//     xhr.send(form);
//   };

//   useEffect(() => {
//     if (!reportId) return;

//     const interval = setInterval(async () => {
//       try {
//         const res = await fetch(
//           `${API_BASE}/api/reports/${reportId}/status`,
//           {
//             headers: { Authorization: "Bearer " + token },
//           }
//         );

//         const data = await res.json();
//         setStatus(data.status);

//         if (data.status === "completed") {
//           clearInterval(interval);

//           const full = await fetch(
//             `${API_BASE}/api/reports/${reportId}`,
//             {
//               headers: { Authorization: "Bearer " + token },
//             }
//           );

//           const j = await full.json();
//           console.log("FULL REPORT RESPONSE:", j.report);

//           setReport(j.report);
//         }
//       } catch (err) {
//         console.error(err);
//         setError("Error fetching report status");
//       }
//     }, 1500);

//     return () => clearInterval(interval);
//   }, [reportId, token]);

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
//       <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
//         <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
//           Upload Medical Report
//         </h2>

//         {error && (
//           <div className="text-red-600 text-center mb-4 text-sm">{error}</div>
//         )}

//         <div className="flex flex-col items-center">
//           <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-sky-500 transition">
//             <input
//               type="file"
//               className="hidden"
//               onChange={(e) => setFile(e.target.files[0])}
//             />
//             <div className="text-gray-600">
//               {file ? (
//                 <span className="font-medium text-sky-600">
//                   {file.name} (ready)
//                 </span>
//               ) : (
//                 <>
//                   <p className="text-lg">Click to choose file</p>
//                   <p className="text-xs text-gray-400 mt-1">
//                     PDF, Images, Text reports allowed
//                   </p>
//                 </>
//               )}
//             </div>
//           </label>

//           <button
//             onClick={handleUpload}
//             disabled={uploading || !file}
//             className="mt-6 bg-sky-600 text-white px-6 py-2 rounded-lg shadow hover:bg-sky-700 transition disabled:opacity-50"
//           >
//             {uploading ? "Uploading..." : "Upload"}
//           </button>

//           {uploading && (
//             <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
//               <div
//                 className="bg-sky-600 h-2 rounded-full transition-all"
//                 style={{ width: `${progress}%` }}
//               ></div>
//             </div>
//           )}

//           {reportId && (
//             <p className="mt-4 text-sm text-gray-700">
//               Status:{" "}
//               <span className="font-semibold text-sky-700">{status}</span>
//             </p>
//           )}

//           {report && (
//             <div className="mt-6 w-full bg-gray-50 p-4 rounded-xl shadow-inner">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Analysis Result
//               </h3>

//               {/* OCR TEXT */}
//               {report.extractedText && (
//                 <div className="mt-3">
//                   <strong>OCR Extracted Text:</strong>
//                   <pre className="text-xs bg-white p-3 border rounded-lg shadow overflow-auto max-h-40 mt-1">
//                     {report.extractedText}
//                   </pre>
//                 </div>
//               )}

//               {/* OCR SECTIONS */}
//               {report.ocrSections && (
//                 <div className="mt-4 text-sm text-gray-700 space-y-1">
//                   <p>
//                     <strong>Diagnosis:</strong>{" "}
//                     {report.ocrSections.diagnosis || "Not detected"}
//                   </p>
//                   <p>
//                     <strong>Findings:</strong>{" "}
//                     {report.ocrSections.findings || "Not detected"}
//                   </p>
//                   <p>
//                     <strong>Impression:</strong>{" "}
//                     {report.ocrSections.impression || "Not detected"}
//                   </p>
//                 </div>
//               )}

//               {/* ========================= */}
//               {/* WEEK 4 GEMINI VISION */}
//               {/* ========================= */}
//               {report.visionAnalysis && (
//                 <div className="mt-6">
//                   <h3 className="text-lg font-semibold text-gray-800">
//                     Vision Analysis Result
//                   </h3>

//                   <p className="mt-2 text-sm">
//                     <strong>Observation:</strong>{" "}
//                     {report.visionAnalysis.observation}
//                   </p>

//                   <p className="text-sm">
//                     <strong>Possible Interpretation:</strong>{" "}
//                     {report.visionAnalysis.possibleInterpretation}
//                   </p>

//                   <p className="text-sm">
//                     <strong>Severity:</strong>{" "}
//                     {report.visionAnalysis.severity}
//                   </p>

//                   <p className="text-sm">
//                     <strong>Suspected Region:</strong>{" "}
//                     {report.visionAnalysis.suspectedRegion}
//                   </p>

//                   {report.highlightedImage && (
//                     <div className="mt-4">
//                       <img
//                         src={`${API_BASE}/${report.highlightedImage.replace(
//                           /\\/g,
//                           "/"
//                         )}`}
//                         alt="Highlighted"
//                         className="rounded-lg shadow max-w-full"
//                       />
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Upload({ token, onLogout, selectedReportId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportId, setReportId] = useState(null);
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  console.log("Selected Report ID:", selectedReportId);
  const handleUpload = () => {
    if (!file) return setError("Please select a file");

    

    setError(null);
    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/reports/upload`, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setReportId(data.reportId);
        setStatus("uploaded");
      } else {
        setError("Upload failed");
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Network error");
    };

    xhr.send(form);
  };

  useEffect(() => {
  if (selectedReportId) {
    setFile(null); // clear upload file
  }
}, [selectedReportId]);

  useEffect(() => {
    if (!reportId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/reports/${reportId}/status`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );

        const data = await res.json();
        setStatus(data.status);

        if (data.status === "completed") {
          clearInterval(interval);

          const full = await fetch(
            `${API_BASE}/api/reports/${reportId}`,
            {
              headers: { Authorization: "Bearer " + token },
            }
          );

          const j = await full.json();
          setReport(j.report);
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching report status");
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [reportId, token]);

  useEffect(() => {
  if (status === "processing") {
    setAnalysisStage(1);

    const stage1 = setTimeout(() => setAnalysisStage(2), 2000);
    const stage2 = setTimeout(() => setAnalysisStage(3), 4000);
    const stage3 = setTimeout(() => setAnalysisStage(4), 6000);

    return () => {
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);
    };
  }

  if (status === "completed") {
    setAnalysisStage(4);
  }
}, [status]);

useEffect(() => {
  if (!selectedReportId) return;

  const fetchReport = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/reports/${selectedReportId}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await res.json();

      if (data.report) {
        setReport(data.report);
        setStatus("completed");
        setReportId(selectedReportId);  
      }

    } catch (err) {
      console.error("Error loading report", err);
    }
  };

  fetchReport();
}, [selectedReportId, token]);
  const getStatusMessage = (status) => {
  switch (status) {
    case "uploaded":
      return "📄 Report uploaded successfully.";
    case "processing":
      return "🧠 The model  is analyzing your report...";
    case "completed":
      return "✅ Analysis complete.";
    case "failed":
      return "❌ Analysis failed.";
    default:
      return "";
  }
};

const sendMessage = async () => {
  if (!chatInput.trim()) return;

  try {
    setSending(true);

    const res = await fetch(
      `${API_BASE}/api/reports/${report._id}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ message: chatInput }),
      }
    );

    const data = await res.json();

    if (data.reply) {
      // Refresh report to get updated chat
      const full = await fetch(
        `${API_BASE}/api/reports/${report._id}`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      const updated = await full.json();
      setReport(updated.report);
    }

    setChatInput("");
  } catch (err) {
    console.error("Chat send error", err);
  } finally {
    setSending(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Upload Medical Report
        </h2>

        {error && (
          <div className="text-red-600 text-center mb-4 text-sm">{error}</div>
        )}

        {/* Upload Box */}
        <div className="flex flex-col items-center">
          <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-sky-500 transition">
            <input
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <div className="text-gray-600">
              {file ? (
                <span className="font-medium text-sky-600">
                  {file.name} (ready)
                </span>
              ) : (
                <>
                  <p className="text-lg">Click to choose file</p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, Images, Text reports allowed
                  </p>
                </>
              )}
            </div>
          </label>

          <button
          onClick={handleUpload}
          disabled={uploading || status === "processing" || !file}
            className="mt-6 bg-sky-600 text-white px-6 py-2 rounded-lg shadow hover:bg-sky-700 transition disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div
                className="bg-sky-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}

          {reportId && status === "processing" && (
  <div className="mt-4 text-sm text-gray-700 space-y-2">

    {analysisStage >= 1 && (
      <p className="animate-pulse">📄 Reading report text...</p>
    )}

    {analysisStage >= 2 && (
      <p className="animate-pulse">🔍 Analyzing medical image...</p>
    )}

    {analysisStage >= 3 && (
      <p className="animate-pulse">💡 Generating explanation...</p>
    )}

    {analysisStage >= 4 && (
      <p className="text-green-600 font-semibold">
        ✅ Finalizing results...
      </p>
    )}

  </div>
)}

{reportId && status === "completed" && (
  <p className="mt-4 text-green-600 font-semibold">
    ✅ Analysis complete.
  </p>
)}

          {/* ========================== */}
          {/* FINAL RESULT DISPLAY */}
          {/* ========================== */}
          {report && (
            <div className="mt-6 w-full bg-gray-50 p-4 rounded-xl shadow-inner">

              <h3 className="text-lg font-semibold text-gray-800">
                Analysis Result
              </h3>

              {/* ========================= */}
                {/* SMART OCR DISPLAY */}
                {/* ========================= */}
                {/* {report.extractedText &&
                  report.extractedText.length > 30 &&
                  /[a-zA-Z]{3,}/.test(report.extractedText) && (
                    <div className="mt-3">
                      <strong>OCR Extracted Text:</strong>
                      <pre className="text-xs bg-white p-3 border rounded-lg shadow overflow-auto max-h-40 mt-1">
                        {report.extractedText}
                      </pre>
                    </div>
                )}

                {report.extractedText &&
                  (!/[a-zA-Z]{3,}/.test(report.extractedText) ||
                    report.extractedText.length < 30) && (
                    <div className="mt-3 text-sm text-gray-500 italic">
                      No readable medical text detected in this image.
                    </div>
                )} */}

              {/* ========================= */}
              {/* VISION ANALYSIS */}
              {/* ========================= */}
              {report.visionAnalysis && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Vision Analysis Result
                  </h3>

                  <p className="mt-2 text-sm">
                    <strong>Observation:</strong> {report.visionAnalysis.observation}
                  </p>

                  <p className="text-sm">
                    <strong>Possible Interpretation:</strong> {report.visionAnalysis.possibleInterpretation}
                  </p>

                  <p className="text-sm">
                    <strong>Severity:</strong> {report.visionAnalysis.severity}
                  </p>

                  <p className="text-sm">
                    <strong>Suspected Region:</strong> {report.visionAnalysis.suspectedRegion}
                  </p>

                  {/* {report.highlightedImage && (
                    <div className="mt-4">
                      <img
                        src={`${API_BASE}/${report.highlightedImage.replace(/\\/g, "/")}`}
                        alt="Highlighted"
                        className="rounded-lg shadow max-w-full"
                      />
                    </div>
                  )} */}

                  {/* Show Gemini highlight only if NO brain segmentation */}
                {report.highlightedImage && !report.brainModelResult && (
                  <div className="mt-4">
                    <img
                      src={`${API_BASE}/${report.highlightedImage.replace(/\\/g, "/")}`}
                      alt="Highlighted"
                      className="rounded-lg shadow max-w-full"
                    />
                  </div>
                )}
                </div>
              )}

              {/* ========================= */}
              {/* BRAIN SEGMENTATION RESULT */}
              {/* ========================= */}
              {report.brainModelResult && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Brain Tumor Segmentation
                  </h3>

                  <p className="mt-2 text-sm font-semibold">
                    Status: {report.brainModelResult.status}
                  </p>

                  {report.brainModelResult.segmentedImage && (
                    <div className="mt-4">
                      <img
                        src={`data:image/jpeg;base64,${report.brainModelResult.segmentedImage}`}
                        alt="Brain Segmentation"
                        className="rounded-lg shadow max-w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ========================= */}
              {/* AI EXPLANATION (WEEK 5) */}
              {/* ========================= */}
              {report.aiExplanation && (
                <div className="mt-8 border-t pt-6">

                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                     Medical Explanation
                  </h3>

                  {/* Risk Badge */}
                  <div className="mb-4">
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-semibold ${
                        report.aiExplanation.riskLevel === "High"
                          ? "bg-red-100 text-red-700"
                          : report.aiExplanation.riskLevel === "Moderate"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Risk Level: {report.aiExplanation.riskLevel}
                    </span>
                  </div>

                  {/* Patient Summary */}
                  <div className="bg-white p-4 rounded-lg shadow border mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">
                      Summary for Patient
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {report.aiExplanation.summaryForPatient}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      Recommended Action
                    </h4>
                    <p className="text-sm text-blue-800">
                      {report.aiExplanation.recommendedAction}
                    </p>
                  </div>

                  {/* Disclaimer */}
                  {/* <div className="text-xs text-gray-500 border-t pt-3">
                    ⚠ {report.aiExplanation.disclaimer}
                  </div> */}

                </div>
              )}

              {/* ========================= */}
            {/* REPORT CHAT */}
            {/* ========================= */}
            {report && report.status === "completed" && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Ask About This Report
                </h3>

                {/* Chat Messages */}
                <div className="bg-gray-100 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3 mb-4">
                  {report.chat && report.chat.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Ask a question about your report.
                    </p>
                  )}

                  {report.chat &&
                    report.chat.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg text-sm ${
                          msg.role === "user"
                            ? "bg-blue-100 text-blue-800 self-end"
                            : "bg-white text-gray-700"
                        }`}
                      >
                        <strong>
                          {msg.role === "user" ? "You:" : "AI:"}
                        </strong>{" "}
                        {msg.message}
                      </div>
                    ))}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending}
                    className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-sky-700 disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}