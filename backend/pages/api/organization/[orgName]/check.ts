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
    
    if (!orgName || typeof orgName !== 'string') {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    // Try multiple methods to check if folder exists
    let exists = false;
    
    // Method 1: Check if folder has any resources
    try {
      const searchResult = await cloudinary.search
        .expression(`folder:${orgName}/*`)
        .max_results(1)
        .execute();
      
      if (searchResult.total_count > 0) {
        exists = true;
      }
    } catch (searchError) {
      // Search might fail if folder doesn't exist, continue to other methods
    }
    
    // Method 2: Check for subfolders (editor or mindmapping)
    if (!exists) {
      try {
        const subFolders = await cloudinary.api.sub_folders(orgName);
        if (subFolders && subFolders.folders && subFolders.folders.length > 0) {
          exists = true;
        }
      } catch (folderError) {
        // Folder doesn't exist or no subfolders
      }
    }
    
    // Method 3: Check if folder exists at root level
    if (!exists) {
      try {
        const rootFolders = await cloudinary.api.root_folders();
        if (rootFolders && rootFolders.folders) {
          const folderNames = rootFolders.folders.map((f: any) => f.name || f.path);
          if (folderNames.includes(orgName)) {
            exists = true;
          }
        }
      } catch (rootError) {
        // Couldn't check root folders
      }
    }
    
    res.json({ exists, organizationName: orgName });
  } catch (error: any) {
    console.error('Error checking organization:', error);
    // Default to false if any error occurs
    res.json({ exists: false, organizationName: req.query.orgName });
  }
}

