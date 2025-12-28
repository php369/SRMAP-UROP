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
    const { path } = req.params;
    // path = group-submissions/reports/1766879837219_sample.pdf
    const cloudinaryUrl = `https://res.cloudinary.com/dz1ytivuu/raw/upload/${path}`;
    
    const response = await axios.get(cloudinaryUrl, {
      responseType: "stream",
      auth: {
        username: process.env.CLOUDINARY_API_KEY,
        password: process.env.CLOUDINARY_API_SECRET,
      },
    });
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    response.data.pipe(res);
  } catch (err: any) {
    console.error(err?.response?.data || err);
    res.status(500).send("Unable to load PDF");
  }
}

// Route: GET /api/v1/files/pdf/:path(*)
router.get('/pdf/:path(*)', streamPdf);

export default router;