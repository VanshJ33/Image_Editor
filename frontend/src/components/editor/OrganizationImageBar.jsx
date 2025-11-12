import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { FabricImage } from 'fabric';
import { getApiUrl, API_CONFIG, handleApiError } from '../../config/api';

// Wrapper component for editor mode that uses the editor context
const OrganizationImageBarEditor = ({ organizationName, mode, canvas, saveToHistory, updateLayers }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (organizationName) {
      fetchImages();
    }
  }, [organizationName, mode]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const endpoint = API_CONFIG.ORGANIZATION.IMAGES(organizationName, mode);
      const response = await axios.get(getApiUrl(endpoint));
      setImages(response.data.images || []);
      setIsOpen(response.data.images && response.data.images.length > 0);
    } catch (error) {
      console.error('Error fetching organization images:', error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage || 'Failed to load organization images');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = async (imageUrl) => {
    if (!canvas) {
      toast.error('Canvas not ready');
      return;
    }

    try {
      const img = await FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
      
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = img.width || 200;
      const imgHeight = img.height || 200;
      
      // Scale image to fit canvas while maintaining aspect ratio
      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY, 1) * 0.8; // 80% of canvas size
      
      img.set({
        left: (canvasWidth - (imgWidth * scale)) / 2,
        top: (canvasHeight - (imgHeight * scale)) / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true
      });
      
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
      
      toast.success('Image loaded to canvas');
    } catch (error) {
      console.error('Error loading image to canvas:', error);
      toast.error('Failed to load image to canvas');
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation(); // Prevent triggering the image click
    
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const endpoint = API_CONFIG.ORGANIZATION.DELETE_IMAGE(organizationName, imageId);
      await axios.delete(getApiUrl(endpoint));
      
      // Remove the image from the list
      setImages(images.filter(img => img.id !== imageId));
      
      toast.success('Image deleted successfully');
      
      // If no images left, close the panel
      if (images.length === 1) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage || 'Failed to delete image');
    }
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Organization Images ({images.length})
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all"
              onClick={() => handleImageClick(image.url)}
            >
              <img
                src={image.thumbnail || image.url}
                alt={image.name || 'Organization image'}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Click to load
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteImage(image.id, e)}
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {image.name && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{image.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component for mind mapping mode (uses Excalidraw API)
const OrganizationImageBarMindMapping = ({ organizationName, mode, excalidrawAPI }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (organizationName) {
      fetchImages();
    }
  }, [organizationName, mode]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const endpoint = API_CONFIG.ORGANIZATION.IMAGES(organizationName, mode);
      const response = await axios.get(getApiUrl(endpoint));
      setImages(response.data.images || []);
      setIsOpen(response.data.images && response.data.images.length > 0);
    } catch (error) {
      console.error('Error fetching organization images:', error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage || 'Failed to load organization images');
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation(); // Prevent triggering the image click
    
    if (!window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      return;
    }

    try {
      const endpoint = API_CONFIG.ORGANIZATION.DELETE_IMAGE(organizationName, imageId);
      await axios.delete(getApiUrl(endpoint));
      
      // Remove the image from the list
      setImages(images.filter(img => img.id !== imageId));
      
      toast.success('Image deleted successfully');
      
      // If no images left, close the panel
      if (images.length === 1) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      const errorMessage = handleApiError(error);
      toast.error(errorMessage || 'Failed to delete image');
    }
  };

  const handleImageClick = async (image) => {
    if (!excalidrawAPI) {
      toast.error('Excalidraw is not ready');
      return;
    }

    try {
      // Check if scene data is available (for loading full editable scene)
      if (image.sceneData) {
        try {
          console.log('Loading scene data:', image.sceneData.substring(0, 100));
          let sceneData;
          
          // If sceneData is a URL, fetch it
          if (image.sceneData.startsWith('http')) {
            const response = await fetch(image.sceneData);
            const text = await response.text();
            sceneData = JSON.parse(text);
          } else {
            // If it's already a JSON string, parse it
            sceneData = typeof image.sceneData === 'string' 
              ? JSON.parse(image.sceneData) 
              : image.sceneData;
          }
          
          console.log('Parsed scene data:', {
            elementsCount: sceneData.elements?.length,
            hasAppState: !!sceneData.appState,
            hasFiles: !!sceneData.files
          });
          
          // Load the full scene into Excalidraw
          if (sceneData.elements && Array.isArray(sceneData.elements) && sceneData.elements.length > 0) {
            // Restore files if available
            const filesObj = {};
            if (sceneData.files) {
              Object.keys(sceneData.files).forEach(fileId => {
                const file = sceneData.files[fileId];
                filesObj[fileId] = {
                  id: file.id || fileId,
                  mimeType: file.mimeType || 'image/png',
                  dataURL: file.dataURL,
                  created: Date.now(),
                  lastRetrieved: Date.now()
                };
              });
            }
            
            // Prepare appState with scrollToContent to fit the scene
            const restoredAppState = {
              ...sceneData.appState,
              scrollToContent: true // This will make Excalidraw fit the content to viewport
            };
            
            // Clear current scene first by setting empty elements, then load new scene
            // This ensures we're replacing, not adding
            excalidrawAPI.updateScene({
              elements: [],
              appState: {}
            });
            
            // Small delay to ensure scene is cleared
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Now load the saved scene
            excalidrawAPI.updateScene({
              elements: sceneData.elements,
              appState: restoredAppState,
              files: Object.keys(filesObj).length > 0 ? filesObj : undefined
            });
            
            // Force a refresh to ensure the scene is properly displayed
            if (excalidrawAPI.history && excalidrawAPI.history.clear) {
              excalidrawAPI.history.clear();
            }
            
            console.log('Scene loaded successfully with', sceneData.elements.length, 'elements');
            toast.success('Mind map scene loaded!');
            return;
          } else {
            console.warn('Scene data missing required fields:', {
              hasElements: !!sceneData.elements,
              elementsIsArray: Array.isArray(sceneData.elements),
              elementsLength: sceneData.elements?.length,
              hasAppState: !!sceneData.appState
            });
          }
        } catch (sceneError) {
          console.error('Failed to load scene data, falling back to image:', sceneError);
          console.error('Scene error details:', sceneError.message, sceneError.stack);
          // Fall through to image loading
        }
      } else {
        console.log('No scene data available for image:', image.id);
      }
      
      // Fallback: Load as image if no scene data available
      const imageUrl = image.url || image;
      // Load the image to get its dimensions and convert to blob
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
      
      // Convert blob to data URL
      const imageDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert blob to data URL'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });

      // Load image to get dimensions
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Image load timeout'));
        }, 10000);
        
        img.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageDataUrl;
      });

      // Get current scene elements and app state
      const currentElements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      
      // Calculate center position for the image
      const viewportCenterX = appState.scrollX + (appState.width || 800) / 2;
      const viewportCenterY = appState.scrollY + (appState.height || 600) / 2;
      
      // Scale image to fit nicely (max 400px width or height)
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Create a file entry for the image
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create BinaryFileData structure for Excalidraw
      const binaryFileData = {
        id: fileId,
        mimeType: blob.type || 'image/png',
        dataURL: imageDataUrl,
        created: Date.now(),
        lastRetrieved: Date.now()
      };

      // Create image element for Excalidraw with all required properties
      const imageElement = {
        type: 'image',
        version: 1,
        versionNonce: Math.floor(Math.random() * 1000000000),
        isDeleted: false,
        id: `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fillStyle: 'solid',
        strokeWidth: 1,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: 100,
        angle: 0,
        x: viewportCenterX - scaledWidth / 2,
        y: viewportCenterY - scaledHeight / 2,
        width: scaledWidth,
        height: scaledHeight,
        seed: Math.floor(Math.random() * 1000000),
        groupIds: [],
        frameId: null,
        roundness: null,
        boundElements: [],
        updated: Date.now(),
        link: null,
        locked: false,
        status: 'saved',
        fileId: fileId,
        scale: [1, 1],
        // Required properties for image elements
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        strokeSharpness: 'round'
      };

      // Get existing files - Excalidraw returns a Map or object
      const existingFiles = excalidrawAPI.getFiles() || {};
      
      // Convert to object if it's a Map
      const filesObj = existingFiles instanceof Map 
        ? Object.fromEntries(existingFiles)
        : existingFiles;
      
      // Add the new file to the files object
      const updatedFiles = {
        ...filesObj,
        [fileId]: binaryFileData
      };

      // First add the file, then update scene with the element
      // This ensures the file is available when Excalidraw processes the image element
      try {
        // Try using addFiles if available
        if (typeof excalidrawAPI.addFiles === 'function') {
          excalidrawAPI.addFiles([binaryFileData]);
        }
      } catch (e) {
        console.warn('addFiles not available, using updateScene with files');
      }

      // Update scene with new image element and files
      excalidrawAPI.updateScene({
        elements: [...currentElements, imageElement],
        appState: {
          ...appState,
          selectedElementIds: { [imageElement.id]: true }
        },
        files: updatedFiles
      });

      toast.success('Image loaded to mind map');
    } catch (error) {
      console.error('Error loading image to Excalidraw:', error);
      toast.error('Failed to load image to mind map');
    }
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Organization Images ({images.length})
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image.thumbnail || image.url}
                alt={image.name || 'Organization image'}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {image.sceneData ? 'Click to load scene' : 'Click to load'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteImage(image.id, e)}
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {image.name && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs truncate">{image.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main component that routes to the appropriate sub-component
const OrganizationImageBar = ({ organizationName, mode = 'editor', canvas, saveToHistory, updateLayers, excalidrawAPI }) => {
  // For editor mode, we need to use the editor context
  if (mode === 'editor') {
    return (
      <OrganizationImageBarEditor 
        organizationName={organizationName} 
        mode={mode}
        canvas={canvas}
        saveToHistory={saveToHistory}
        updateLayers={updateLayers}
      />
    );
  } else {
    return <OrganizationImageBarMindMapping organizationName={organizationName} mode={mode} excalidrawAPI={excalidrawAPI} />;
  }
};

export default OrganizationImageBar;

