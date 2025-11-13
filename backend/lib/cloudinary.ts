import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;

// Helper function to create folder structure in Cloudinary
export async function createCloudinaryFolder(folderPath: string) {
  // Cloudinary creates folders automatically when you upload to them
  // We'll upload a small transparent 1x1 PNG placeholder
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const result = await cloudinary.uploader.upload(placeholderImage, {
      folder: folderPath,
      public_id: '.folder_marker',
      overwrite: true,
      invalidate: true,
      resource_type: 'image'
    });
    return { success: true, public_id: result.public_id };
  } catch (error: any) {
    console.error(`Error creating folder ${folderPath}:`, error);
    return { success: false, error: error.message };
  }
}


