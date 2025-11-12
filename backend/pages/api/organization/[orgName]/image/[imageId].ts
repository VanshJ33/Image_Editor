import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '@/lib/cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Set CORS headers for actual request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'GET') {
    try {
      const { imageId } = req.query;
      
      if (!imageId || typeof imageId !== 'string') {
        return res.status(400).json({ error: 'Image ID is required' });
      }
      
      const result = await cloudinary.api.resource(imageId);
      
      res.json({
        id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height
      });
    } catch (error: any) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: 'Failed to fetch image', message: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { imageId } = req.query;
      
      if (!imageId || typeof imageId !== 'string') {
        return res.status(400).json({ error: 'Image ID is required' });
      }
      
      // Delete the image from Cloudinary
      const deleteResult = await cloudinary.uploader.destroy(imageId);
      
      // Also try to delete associated scene file if it exists
      const sceneFileName = `${imageId}_scene`;
      try {
        await cloudinary.uploader.destroy(sceneFileName, { resource_type: 'raw' });
      } catch (sceneError) {
        // Scene file might not exist, that's okay
        console.log('Scene file not found or already deleted:', sceneFileName);
      }
      
      if (deleteResult.result === 'ok' || deleteResult.result === 'not found') {
        res.json({
          success: true,
          message: 'Image deleted successfully',
          id: imageId
        });
      } else {
        res.status(500).json({
          error: 'Failed to delete image',
          result: deleteResult.result
        });
      }
    } catch (error: any) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Failed to delete image', message: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'DELETE', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
