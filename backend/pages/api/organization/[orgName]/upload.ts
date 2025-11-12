import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '@/lib/cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Set CORS headers for actual request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { orgName } = req.query;
    const { imageUrl, type, sceneData } = req.body; // type: 'editor' or 'mindmapping', sceneData: JSON string of Excalidraw scene
    
    if (!orgName || typeof orgName !== 'string') {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const folderPath = type ? `${orgName}/${type}` : orgName;
    
    // Upload image to Cloudinary first
    const uploadOptions: any = {
      folder: folderPath,
      use_filename: true,
      unique_filename: true
    };
    
    const result = await cloudinary.uploader.upload(imageUrl, uploadOptions);
    
    // Handle scene data - store as separate raw file if provided
    let sceneDataUrl = null;
    if (sceneData && typeof sceneData === 'string' && sceneData.length > 0) {
      try {
        // Store scene data as a separate raw text file in Cloudinary
        // Use the image's public_id as part of the scene file name for association
        const sceneFileName = `${result.public_id}_scene`;
        const sceneDataResult = await cloudinary.uploader.upload(`data:text/plain;base64,${Buffer.from(sceneData).toString('base64')}`, {
          folder: folderPath,
          public_id: sceneFileName,
          resource_type: 'raw',
          format: 'txt',
          overwrite: true
        });
        sceneDataUrl = sceneDataResult.secure_url;
      } catch (sceneError) {
        console.warn('Failed to store scene data separately:', sceneError);
        // If storing separately fails, try to store in context (limited size)
        if (sceneData.length <= 2000) {
          try {
            await cloudinary.uploader.add_context({
              context: { sceneData: sceneData },
              public_ids: [result.public_id]
            });
            sceneDataUrl = sceneData; // Return the data directly if small enough
          } catch (contextError) {
            console.warn('Failed to store scene data in context:', contextError);
          }
        }
      }
    }
    
    res.json({
      id: result.public_id,
      url: result.secure_url,
      thumbnail: cloudinary.url(result.public_id, {
        width: 200,
        height: 200,
        crop: 'fill',
        quality: 'auto'
      }),
      format: result.format,
      width: result.width,
      height: result.height,
      sceneData: sceneDataUrl
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image', message: error.message });
  }
}

