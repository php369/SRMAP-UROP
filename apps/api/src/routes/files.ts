import express from 'express';
const axios = require('axios');

const router = express.Router();

/**
 * Stream PDF from Cloudinary using authenticated server-side request
 * GET /api/v1/files/pdf/:path(*)
 * Path format: group-submissions/reports/1766879837219_sample.pdf
 */
async function streamPdf(req: any, res: any) {
  try {
    const path = req.params.path;
    const cloudinaryUrl = `https://res.cloudinary.com/dz1ytivuu/raw/upload/${path}`;
    
    const cloudinaryResponse = await axios.get(cloudinaryUrl, {
      responseType: "stream",
      auth: {
        username: process.env.CLOUDINARY_API_KEY,
        password: process.env.CLOUDINARY_API_SECRET,
      },
      headers: {
        Range: req.headers.range || "bytes=0-",
      },
    });
    
    // 🔴 CRITICAL HEADERS (THIS FIXES THE ISSUE)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", cloudinaryResponse.headers["content-length"]);
    res.setHeader("Accept-Ranges", cloudinaryResponse.headers["accept-ranges"] || "bytes");
    res.setHeader("Content-Range", cloudinaryResponse.headers["content-range"]);
    res.setHeader("Content-Disposition", "inline");
    
    // Important for Vercel
    res.status(206);
    cloudinaryResponse.data.pipe(res);
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Unable to load PDF");
  }
}

// Route: GET /api/v1/files/pdf/:path(*)
router.get('/pdf/:path(*)', streamPdf);

export default router;