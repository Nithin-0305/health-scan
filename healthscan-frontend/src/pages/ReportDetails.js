import { useState } from "react";

/* ===== ImageAnalysisViewer (helper inside page) ===== */
const ImageAnalysisViewer = ({ imageUrl, heatmapUrl, label, confidence }) => {
  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <div className="image-analysis">
      <h3>Image Analysis Result</h3>

      <p><strong>Label:</strong> {label}</p>
      <p><strong>Confidence:</strong> {(confidence * 100).toFixed(2)}%</p>

      <button onClick={() => setShowHeatmap(!showHeatmap)}>
        {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
      </button>

      <div className="image-box">
        <img
          src={showHeatmap ? heatmapUrl : imageUrl}
          alt="Medical Scan"
          width="400"
        />
      </div>
    </div>
  );
};

/* ===== Main Page ===== */
const ReportDetails = () => {
  return (
    <div>
      <h2>Report Details</h2>

      {/* Later you will pass real data here */}
      <ImageAnalysisViewer
        imageUrl="/uploads/sample.png"
        heatmapUrl="/uploads/heatmaps/sample_heatmap.png"
        label="Pneumonia"
        confidence={0.87}
      />
    </div>
  );
};

export default ReportDetails;
