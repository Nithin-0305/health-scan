import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import Report from "../models/Report.js";

export const runBrainSegmentation = async (reportId, filePath) => {
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      "http://127.0.0.1:8000/predict",
      form,
      {
        headers: form.getHeaders(),
      }
    );

    const { status, image } = response.data;

    const report = await Report.findById(reportId);

    report.brainModelResult = {
      status,
      segmentedImage: image,
    };

    await report.save();

    console.log("🧠 Brain segmentation completed:", reportId);

  } catch (error) {
    console.error("Brain model error:", error.message);
  }
};