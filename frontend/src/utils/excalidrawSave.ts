import axios from 'axios';
import { getApiUrl, API_CONFIG, handleApiError } from '../config/api';
import { exportToBlob } from '@excalidraw/excalidraw';

/**
 * Save Excalidraw scene as image to organization folder in Cloudinary
 */
export async function saveExcalidrawToOrganization(
  excalidrawAPI: any,
  organizationName: string,
  type: 'editor' | 'mindmapping' = 'mindmapping'
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!excalidrawAPI) {
    return { success: false, error: 'Excalidraw API is not available' };
  }

  if (!organizationName) {
    return { success: false, error: 'Organization name is required' };
  }

  try {
    // Get the current scene elements and app state
    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();

    // Check if there are any elements to save
    if (!elements || elements.length === 0) {
      return { success: false, error: 'No content to save' };
    }

    // Export Excalidraw scene to blob
    const blob = await exportToBlob({
      elements,
      appState,
      files: excalidrawAPI.getFiles(),
      mimeType: 'image/png',
      getDimensions: (width, height) => {
        // Export at 2x resolution for better quality
        return { width: width * 2, height: height * 2 };
      }
    });

    // Convert blob to data URL
    const dataURL = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to data URL'));
        }
      };
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      reader.readAsDataURL(blob);
    });

    if (!dataURL || dataURL === 'data:,') {
      return { success: false, error: 'Failed to export Excalidraw scene' };
    }

    // Prepare scene data for saving (elements, appState, files)
    const files = excalidrawAPI.getFiles() || {};
    const filesObj = files instanceof Map ? Object.fromEntries(files) : files;
    
    // Convert files to a serializable format (only keep dataURL, not full file objects)
    const serializableFiles: Record<string, any> = {};
    Object.keys(filesObj).forEach(fileId => {
      const file = filesObj[fileId];
      if (file && file.dataURL) {
        serializableFiles[fileId] = {
          id: file.id || fileId,
          mimeType: file.mimeType || 'image/png',
          dataURL: file.dataURL
        };
      }
    });

    const sceneData = {
      elements,
      appState,
      files: serializableFiles,
      version: 2,
      type: 'excalidraw'
    };

    // Upload to Cloudinary via backend with both image and scene data
    const response = await axios.post(
      getApiUrl(API_CONFIG.ORGANIZATION.UPLOAD(organizationName)),
      {
        imageUrl: dataURL,
        sceneData: JSON.stringify(sceneData), // Send scene data as JSON string
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
    console.error('Error saving Excalidraw scene to organization:', error);
    const errorMessage = handleApiError(error);
    return { success: false, error: errorMessage };
  }
}

