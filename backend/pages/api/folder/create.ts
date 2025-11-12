import type { NextApiRequest, NextApiResponse } from 'next';
import { createCloudinaryFolder } from '@/lib/cloudinary';
import cloudinary from '@/lib/cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { folderPath } = req.body;
    
    if (!folderPath || folderPath.trim().length === 0) {
      return res.status(400).json({ error: 'Folder path is required' });
    }
    
    // Sanitize folder path
    const sanitizedPath = folderPath.trim().replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
    
    if (sanitizedPath.length === 0) {
      return res.status(400).json({ error: 'Invalid folder path' });
    }
    
    // Check if folder already exists
    try {
      const searchResult = await cloudinary.search
        .expression(`folder:${sanitizedPath}/*`)
        .max_results(1)
        .execute();
      
      if (searchResult.total_count > 0) {
        return res.json({ 
          success: true,
          message: 'Folder already exists',
          folderPath: sanitizedPath,
          exists: true
        });
      }
    } catch (searchError) {
      // Folder doesn't exist, continue with creation
    }
    
    // Create the folder
    const result = await createCloudinaryFolder(sanitizedPath);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Folder created successfully in Cloudinary',
        folderPath: sanitizedPath,
        public_id: result.public_id
      });
    } else {
      res.status(500).json({
        error: 'Failed to create folder',
        folderPath: sanitizedPath,
        details: result.error
      });
    }
  } catch (error: any) {
    console.error('Error creating folder:', error);
    res.status(500).json({ 
      error: 'Failed to create folder', 
      message: error.message 
    });
  }
}

