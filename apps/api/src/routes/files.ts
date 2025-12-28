import express from 'express';

const router = express.Router();

/**
 * Legacy PDF route - redirect to Supabase Storage
 * This route is kept for backward compatibility but files are now served directly from Supabase
 */
router.get('/pdf/*', (req, res) => {
  // Since Supabase Storage provides direct public URLs, 
  // this route should not be needed anymore
  res.status(410).json({
    success: false,
    error: 'This endpoint is deprecated. Files are now served directly from Supabase Storage.',
    message: 'Please use the direct Supabase Storage URLs provided in submission data.'
  });
});

export default router;