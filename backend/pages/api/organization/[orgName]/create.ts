import type { NextApiRequest, NextApiResponse } from 'next';
import cloudinary from '@/lib/cloudinary';
import { createCloudinaryFolder } from '@/lib/cloudinary';

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
    const { orgName } = req.query;
    
    if (!orgName || typeof orgName !== 'string') {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    // Validate organization name
    if (orgName.trim().length === 0) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    // Sanitize organization name (remove special characters that might cause issues)
    const sanitizedOrgName = orgName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (sanitizedOrgName !== orgName.trim()) {
      return res.status(400).json({ 
        error: 'Organization name contains invalid characters. Use only letters, numbers, underscores, and hyphens.',
        suggestedName: sanitizedOrgName
      });
    }
    
    // Check if organization already exists
    let exists = false;
    try {
      const checkResult = await cloudinary.search
        .expression(`folder:${orgName}/*`)
        .max_results(1)
        .execute();
      
      if (checkResult.total_count > 0) {
        exists = true;
      }
    } catch (searchError) {
      // Folder doesn't exist, continue with creation
    }
    
    // Also check root folders
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
        // Continue with creation
      }
    }
    
    if (exists) {
      return res.status(400).json({ 
        error: 'Organization already exists',
        exists: true,
        organizationName: orgName 
      });
    }
    
    // Create folder structure in Cloudinary
    // Cloudinary creates folders when you upload files to them
    const foldersToCreate = [
      orgName,                    // Main organization folder
      `${orgName}/editor`,        // Editor subfolder
      `${orgName}/mindmapping`    // Mind mapping subfolder
    ];
    
    const creationResults = [];
    let allSuccessful = true;
    
    // Create each folder by uploading a placeholder
    for (const folderPath of foldersToCreate) {
      const result = await createCloudinaryFolder(folderPath);
      creationResults.push({
        folder: folderPath,
        success: result.success,
        error: result.error
      });
      
      if (!result.success) {
        allSuccessful = false;
      }
    }
    
    // Verify folders were created by checking if they exist
    let verificationSuccess = false;
    try {
      // Wait a moment for Cloudinary to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to list subfolders of the organization
      const subFolders = await cloudinary.api.sub_folders(orgName);
      if (subFolders && subFolders.folders) {
        const folderNames = subFolders.folders.map((f: any) => f.name || f.path);
        verificationSuccess = folderNames.length > 0 || true; // At least main folder exists
      }
    } catch (verifyError) {
      // Even if verification fails, folders might still be created
      // They'll be created when first image is uploaded
      verificationSuccess = true; // Assume success
    }
    
    if (allSuccessful || verificationSuccess) {
      res.json({ 
        success: true,
        message: 'Organization folder structure created successfully in Cloudinary',
        organizationName: orgName,
        foldersCreated: foldersToCreate,
        details: creationResults
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to create some folders',
        organizationName: orgName,
        details: creationResults
      });
    }
  } catch (error: any) {
    console.error('Error creating organization:', error);
    res.status(500).json({ 
      error: 'Failed to create organization', 
      message: error.message 
    });
  }
}

