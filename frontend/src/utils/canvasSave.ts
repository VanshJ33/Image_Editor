import axios from 'axios';
import { getApiUrl, API_CONFIG, handleApiError } from '../config/api';
import { FabricImage } from 'fabric';

/**
 * Convert image objects on canvas to data URLs to avoid CORS issues
 */
async function convertImageUrlsToDataUrls(canvas: any): Promise<void> {
  const objects = canvas.getObjects();
  const imageObjects = objects.filter((obj: any) => 
    obj.type === 'image' && 
    obj.src && 
    !obj.src.startsWith('data:') && 
    !obj.src.startsWith('blob:') &&
    !obj.isAnimatedGif // Skip animated GIFs as they're handled separately
  );

  // Convert each image to data URL
  for (const obj of imageObjects) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const dataURL = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
          try {
            const tempCanvas = document.createElement('canvas');
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not get canvas context'));
              return;
            }
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataUrl = tempCanvas.toDataURL('image/png');
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          // If CORS fails, try fetching via proxy/backend
          reject(new Error('Failed to load image with crossOrigin'));
        };
        
        img.src = obj.src;
      }).catch(async (error) => {
        // Fallback: try to fetch via backend proxy if direct load fails
        console.warn('Direct image load failed, trying alternative method:', error);
        try {
          // Try fetching the image as blob and converting
          const response = await fetch(obj.src, { mode: 'cors' });
          if (response.ok) {
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
          throw new Error('Failed to fetch image');
        } catch (fetchError) {
          console.error('Failed to convert image URL to data URL:', obj.src);
          // Return original src if conversion fails (might still work if it's same-origin)
          return obj.src;
        }
      });

      // Replace the object with a new one created from the data URL
      if (dataURL && dataURL.startsWith('data:')) {
        try {
          const newImg = await FabricImage.fromURL(dataURL, { crossOrigin: 'anonymous' });
          
          // Copy all properties from the old object
          newImg.set({
            left: obj.left,
            top: obj.top,
            scaleX: obj.scaleX,
            scaleY: obj.scaleY,
            angle: obj.angle,
            opacity: obj.opacity,
            flipX: obj.flipX,
            flipY: obj.flipY,
            selectable: obj.selectable,
            evented: obj.evented,
            visible: obj.visible,
            lockMovementX: obj.lockMovementX,
            lockMovementY: obj.lockMovementY,
            lockRotation: obj.lockRotation,
            lockScalingX: obj.lockScalingX,
            lockScalingY: obj.lockScalingY,
            lockSkewingX: obj.lockSkewingX,
            lockSkewingY: obj.lockSkewingY,
            hasControls: obj.hasControls,
            hasBorders: obj.hasBorders,
            isBackgroundImage: obj.isBackgroundImage,
            zIndex: obj.zIndex
          });
          
          // Get the index of the old object
          const objects = canvas.getObjects();
          const index = objects.indexOf(obj);
          
          // Remove the old object and add the new one at the same position
          canvas.remove(obj);
          canvas.insertAt(newImg, index);
        } catch (replaceError) {
          console.warn('Failed to replace image object:', replaceError);
        }
      }
    } catch (error) {
      console.warn('Failed to convert image to data URL, keeping original:', error);
      // Continue with other images even if one fails
    }
  }
}

/**
 * Save canvas as image to organization folder in Cloudinary
 */
export async function saveCanvasToOrganization(
  canvas: any,
  organizationName: string,
  type: 'editor' | 'mindmapping' = 'editor'
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!canvas) {
    return { success: false, error: 'Canvas is not available' };
  }

  if (!organizationName) {
    return { success: false, error: 'Organization name is required' };
  }

  try {
    // Ensure all objects are visible and rendered
    canvas.discardActiveObject();
    canvas.renderAll();

    // First, try direct export (works if no CORS issues)
    let dataURL: string;
    try {
      dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
      
      // Check if export was successful (not tainted)
      if (dataURL && dataURL !== 'data:,' && !dataURL.includes('CORS')) {
        // Export successful, proceed with upload
      } else {
        throw new Error('Canvas export returned invalid data');
      }
    } catch (directExportError: any) {
      // If direct export fails (likely CORS), convert images to data URLs first
      console.log('Direct export failed, converting images to data URLs:', directExportError.message);
      
      await convertImageUrlsToDataUrls(canvas);
      
      // Wait a bit for images to be converted and rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-render after conversion
      canvas.renderAll();
      
      // Try export again after conversion
      dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });
    }

    if (!dataURL || dataURL === 'data:,') {
      return { success: false, error: 'Failed to export canvas' };
    }

    // Upload to Cloudinary via backend
    const response = await axios.post(
      getApiUrl(API_CONFIG.ORGANIZATION.UPLOAD(organizationName)),
      {
        imageUrl: dataURL,
        type: type
      }
    );

    if (response.data && response.data.url) {
      return {
        success: true,
        url: response.data.url
      };
    } else {
      return { success: false, error: 'Upload failed - no URL returned' };
    }
  } catch (error: any) {
    console.error('Error saving canvas to organization:', error);
    
    // If the error is about tainted canvas, try one more time with a different approach
    if (error.message && error.message.includes('Tainted')) {
      try {
        // Try using toJSON and then rendering to a new canvas
        const json = canvas.toJSON();
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.getWidth();
        tempCanvas.height = canvas.getHeight();
        const tempFabricCanvas = new (window as any).fabric.Canvas(tempCanvas);
        
        await tempFabricCanvas.loadFromJSON(json);
        tempFabricCanvas.renderAll();
        
        const dataURL = tempFabricCanvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 2
        });
        
        if (dataURL && dataURL !== 'data:,') {
          const response = await axios.post(
            getApiUrl(API_CONFIG.ORGANIZATION.UPLOAD(organizationName)),
            {
              imageUrl: dataURL,
              type: type
            }
          );
          
          if (response.data && response.data.url) {
            return { success: true, url: response.data.url };
          }
        }
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
      }
    }
    
    const errorMessage = handleApiError(error);
    return { success: false, error: errorMessage };
  }
}

