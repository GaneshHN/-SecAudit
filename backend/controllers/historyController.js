const Scan = require("../models/Scan");

// GET /api/history?userId=...
async function getHistory(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: "userId is required to fetch history." });
    }

    // Sort by newest first
    const scans = await Scan.find({ userId }).sort({ scanDate: -1 }).lean();

    res.json(scans);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ error: "Failed to fetch scan history." });
  }
}

// GET /api/history/:id
async function getScanDetails(req, res) {
  try {
    const { id } = req.params;
    const scan = await Scan.findById(id).lean();

    if (!scan) {
      return res.status(404).json({ error: "Scan not found." });
    }

    res.json(scan);
  } catch (err) {
    console.error("Error fetching scan details:", err);
    res.status(500).json({ error: "Failed to fetch scan details." });
  }
}

// DELETE /api/history/:id
async function deleteScan(req, res) {
  try {
    const { id } = req.params;
    const scan = await Scan.findByIdAndDelete(id);

    if (!scan) {
      return res.status(404).json({ error: "Scan not found." });
    }

    res.json({ message: "Scan deleted successfully.", id });
  } catch (err) {
    console.error("Error deleting scan:", err);
    res.status(500).json({ error: "Failed to delete scan." });
  }
}

module.exports = {
  getHistory,
  getScanDetails,
  deleteScan,
};
