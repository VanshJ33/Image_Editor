import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '@/lib/cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { orgName } = req.query;
    const { type } = req.query; // 'editor' or 'mindmapping'
    
    if (!orgName || typeof orgName !== 'string') {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    // Search for images in the organization folder
    // If type is specified, look in subfolder
    const folderPath = type ? `${orgName}/${type}` : orgName;
    
    const result = await cloudinary.search
      .expression(`folder:${folderPath}/*`)
      .with_field('tags')
      .max_results(500)
      .execute();
    
    const images = await Promise.all(result.resources.map(async (resource: any) => {
      // Try to get scene data from associated raw file
      let sceneData = null;
      
      // Check for associated scene file (named as {public_id}_scene)
      const sceneFileName = `${resource.public_id}_scene`;
      try {
        const sceneResource = await cloudinary.api.resource(sceneFileName, { resource_type: 'raw' });
        // Fetch the actual content
        const sceneResponse = await fetch(sceneResource.secure_url);
        if (sceneResponse.ok) {
          sceneData = await sceneResponse.text();
        }
      } catch (e) {
        // Scene file doesn't exist, check context as fallback
        if (resource.context && resource.context.custom && resource.context.custom.sceneData) {
          sceneData = resource.context.custom.sceneData;
        }
      }
      
      return {
        id: resource.public_id,
        url: resource.secure_url,
        thumbnail: cloudinary.url(resource.public_id, {
          width: 200,
          height: 200,
          crop: 'fill',
          quality: 'auto'
        }),
        format: resource.format,
        width: resource.width,
        height: resource.height,
        createdAt: resource.created_at,
        name: resource.public_id.split('/').pop(),
        sceneData: sceneData
      };
    }));
    
    res.json({ images, count: images.length });
  } catch (error: any) {
    console.error('Error fetching organization images:', error);
    res.status(500).json({ error: 'Failed to fetch images', message: error.message });
  }
}

