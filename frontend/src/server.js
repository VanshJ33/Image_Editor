import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
const PORT = 5000;

app.get("/api/klippy", async (req, res) => {
  try {
    const response = await fetch("https://api.klippy.ai/v1/elements?limit=20&format=svg&sort=popular", {
      headers: {
        Authorization: "Bearer X4eTCMg7rLGxEVw0r3lIaBrxuVfhGrGGZblYCdqQWZP9zx4xTsIWSwQTU67tnhqa"
      }
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Failed to fetch from Klippy" });
  }
});

app.listen(PORT, () => console.log(`✅ Proxy running at http://localhost:${PORT}`));
