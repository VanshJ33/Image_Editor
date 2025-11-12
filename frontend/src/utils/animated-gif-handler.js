/**
 * Animated GIF Handler for Fabric.js Canvas
 * This creates HTML img elements that preserve GIF animation and syncs them with Fabric objects
 */

class AnimatedGifHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.gifElements = new Map(); // Map of fabric object id to HTML img element
    this.containerElement = null;
    this.isExporting = false; // Flag to prevent GIF creation during export
    this.isLoadingTemplate = false; // Flag to prevent GIF processing during template loading
    this.exportReplacements = new Map(); // Map of replacement object to original object for restoration
    this.init();
  }

  init() {
    // Create container for GIF elements
    this.containerElement = document.createElement('div');
    this.containerElement.style.position = 'absolute';
    this.containerElement.style.top = '0';
    this.containerElement.style.left = '0';
    this.containerElement.style.width = '100%';
    this.containerElement.style.height = '100%';
    this.containerElement.style.pointerEvents = 'none';
    this.containerElement.style.zIndex = '10';
    this.containerElement.style.overflow = 'visible';
    // Ensure smooth rendering
    this.containerElement.style.willChange = 'transform';
    this.containerElement.style.imageRendering = 'auto';
    
    // Insert container inside the canvas wrapper (which has relative positioning)
    const canvasWrapper = this.canvas.wrapperEl;
    if (canvasWrapper) {
      // Make sure wrapper has relative positioning
      const wrapperStyle = window.getComputedStyle(canvasWrapper);
      if (wrapperStyle.position === 'static') {
        canvasWrapper.style.position = 'relative';
      }
      canvasWrapper.appendChild(this.containerElement);
    } else {
      // Fallback: insert after canvas element
      const canvasElement = this.canvas.getElement();
      if (canvasElement && canvasElement.parentNode) {
        canvasElement.parentNode.insertBefore(this.containerElement, canvasElement.nextSibling);
      }
    }
    
    // Listen to canvas events
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Update GIF positions when canvas renders (but not during export)
    this.canvas.on('after:render', () => {
      if (!this.isExporting) {
        this.updateGifPositions();
      }
    });

    // Update positions during object modification (real-time updates)
    this.canvas.on('object:modified', (e) => {
      if (e.target && e.target.isAnimatedGif && !this.isExporting) {
        this.updateGifPosition(e.target);
      }
    });

    // Update positions during object moving (real-time updates)
    this.canvas.on('object:moving', (e) => {
      if (e.target && e.target.isAnimatedGif && !this.isExporting) {
        this.updateGifPosition(e.target);
      }
    });

    // Update positions during object scaling (real-time updates)
    this.canvas.on('object:scaling', (e) => {
      if (e.target && e.target.isAnimatedGif && !this.isExporting) {
        this.updateGifPosition(e.target);
      }
    });

    // Update positions during object rotating (real-time updates)
    this.canvas.on('object:rotating', (e) => {
      if (e.target && e.target.isAnimatedGif && !this.isExporting) {
        this.updateGifPosition(e.target);
      }
    });

    // Handle object removal
    this.canvas.on('object:removed', (e) => {
      if (e.target && e.target.isAnimatedGif) {
        this.removeGifElement(e.target);
      }
    });

    // Handle object added - check if it's a GIF that needs an animated element
    // But only if it doesn't already have one (prevent duplicates)
    // Use a flag to prevent duplicate creation when addAnimatedGif is called
    this.isAddingGif = false;
    this.canvas.on('object:added', async (e) => {
      // Skip if we're in the middle of adding a GIF (to prevent duplicates)
      if (this.isAddingGif) {
        return;
      }
      
      // Skip if we're loading a template (will handle GIFs after template loads)
      if (this.isLoadingTemplate) {
        return;
      }
      
      if (e.target && e.target.isAnimatedGif && !this.isExporting) {
        // Check if animated element already exists
        const existingElement = this.gifElements.get(e.target.id);
        if (!existingElement && e.target.gifUrl) {
          // Check if an element with the same URL already exists (prevent duplicates)
          const normalizedUrl = this.normalizeUrl(e.target.gifUrl);
          const existingElementByUrl = Array.from(this.gifElements.entries()).find(([id, element]) => {
            const elementNormalized = this.normalizeUrl(element.src);
            return elementNormalized === normalizedUrl;
          });
          
          if (existingElementByUrl) {
            // Link this object to the existing element
            this.gifElements.set(e.target.id, existingElementByUrl[1]);
            console.log('GIF object linked to existing animated element:', e.target.id);
          } else {
            // Animated element is missing - create one (e.g., for GIFs loaded from templates)
            console.log('GIF object added but animated element missing, creating one:', e.target.id);
            try {
              await this.createAnimatedElementForExistingGif(e.target);
            } catch (error) {
              console.error('Failed to create animated element for existing GIF:', error);
            }
          }
        }
      }
    });

    // Handle selection changes
    this.canvas.on('selection:created', (e) => {
      this.updateGifVisibility();
    });

    this.canvas.on('selection:updated', (e) => {
      this.updateGifVisibility();
    });

    this.canvas.on('selection:cleared', (e) => {
      this.updateGifVisibility();
    });
  }

  // Helper to normalize URLs for comparison
  normalizeUrl(url) {
    if (!url) return '';
    // Remove query parameters and fragments for comparison
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch (e) {
      // If URL parsing fails, return as-is
      return url.split('?')[0].split('#')[0];
    }
  }

  async addAnimatedGif(gifUrl, options = {}) {
    try {
      console.log('AnimatedGifHandler.addAnimatedGif called:', { gifUrl, options, hasContainer: !!this.containerElement });
      
      if (!this.containerElement) {
        throw new Error('GIF container not initialized');
      }
      
      // Normalize the URL for comparison
      const normalizedUrl = this.normalizeUrl(gifUrl);
      
      // Check if this GIF already exists (prevent duplicates)
      // First check HTML elements
      const existingGifElement = Array.from(this.gifElements.entries()).find(([id, element]) => {
        const elementNormalized = this.normalizeUrl(element.src);
        return elementNormalized === normalizedUrl;
      });
      
      if (existingGifElement) {
        console.log('GIF already exists in HTML elements, skipping duplicate creation');
        // Find the corresponding fabric object
        const fabricObj = this.canvas.getObjects().find(obj => obj.id === existingGifElement[0]);
        if (fabricObj) {
          // Select the existing object instead of creating a duplicate
          this.canvas.setActiveObject(fabricObj);
          this.canvas.renderAll();
          return fabricObj;
        }
      }
      
      // Also check canvas objects for GIFs with the same URL (e.g., from templates)
      const existingGifObject = this.canvas.getObjects().find(obj => {
        if (!obj.isAnimatedGif || !obj.gifUrl) return false;
        const objNormalized = this.normalizeUrl(obj.gifUrl);
        return objNormalized === normalizedUrl;
      });
      
      if (existingGifObject) {
        console.log('GIF already exists on canvas, skipping duplicate creation', {
          existingId: existingGifObject.id,
          existingUrl: existingGifObject.gifUrl,
          newUrl: gifUrl
        });
        // If it doesn't have an HTML element, create one
        if (!this.gifElements.has(existingGifObject.id)) {
          await this.createAnimatedElementForExistingGif(existingGifObject);
        }
        // Select the existing object instead of creating a duplicate
        this.canvas.setActiveObject(existingGifObject);
        this.canvas.renderAll();
        // Show a message to the user
        if (typeof window !== 'undefined' && window.toast) {
          // GIF already on canvas - selected existing one
        }
        return existingGifObject;
      }
      
      console.log('No duplicate found, creating new GIF', {
        normalizedUrl,
        existingGifs: this.canvas.getObjects().filter(obj => obj.isAnimatedGif).map(obj => ({
          id: obj.id,
          url: obj.gifUrl,
          normalized: this.normalizeUrl(obj.gifUrl)
        }))
      });
      
      // Create a placeholder fabric image (static version)
      console.log('Creating static placeholder...');
      const staticImg = await this.createStaticPlaceholder(gifUrl);
      console.log('Static placeholder created:', staticImg);
      
      // Create animated HTML img element
      const animatedImg = document.createElement('img');
      animatedImg.src = gifUrl;
      animatedImg.crossOrigin = 'anonymous';
      animatedImg.style.position = 'absolute';
      animatedImg.style.pointerEvents = 'none';
      animatedImg.style.userSelect = 'none';
      animatedImg.style.objectFit = 'contain';
      // Ensure smooth rendering and animation
      animatedImg.style.imageRendering = 'auto';
      animatedImg.style.willChange = 'transform';
      animatedImg.style.backfaceVisibility = 'hidden';
      animatedImg.style.transformStyle = 'preserve-3d';
      
      // Wait for image to load
      console.log('Waiting for GIF to load...');
      await new Promise((resolve, reject) => {
        animatedImg.onload = () => {
          console.log('GIF loaded successfully:', { width: animatedImg.width, height: animatedImg.height });
          resolve();
        };
        animatedImg.onerror = (err) => {
          console.error('GIF failed to load:', err);
          reject(new Error(`Failed to load GIF: ${gifUrl}`));
        };
        // Set timeout for loading
        setTimeout(() => {
          if (!animatedImg.complete) {
            reject(new Error('GIF loading timeout'));
          }
        }, 10000);
      });

      // Configure fabric object
      const fabricObj = staticImg;
      
      // Override the _renderBorders method to prevent selection box rendering
      // But keep controls (handles) visible for resizing
      fabricObj._renderBorders = function(ctx) {
        // Don't render borders/selection box for GIF objects
        return;
      };
      
      // Also override _drawBorder to ensure no border is drawn
      fabricObj._drawBorder = function(ctx) {
        // Don't draw border for GIF objects
        return;
      };
      
      // Ensure the object is properly configured for interaction
      fabricObj.set({
        ...options,
        isAnimatedGif: true,
        gifUrl: gifUrl,
        selectable: true,
        evented: true,
        // Make the Fabric object transparent so only the HTML animated GIF shows
        opacity: 0,
        // Keep the object visible for selection but transparent
        visible: true,
        // Hide selection border box but keep resize handles
        borderColor: 'transparent',
        borderScaleFactor: 0,
        hasBorders: false,
        // Ensure border is not drawn
        strokeWidth: 0,
        stroke: 'transparent',
        // Enable controls (handles) for resizing, rotating, etc.
        hasControls: true,
        cornerColor: '#4f46e5',
        cornerStrokeColor: '#ffffff',
        cornerSize: 12,
        cornerStyle: 'rect',
        transparentCorners: false,
        touchCornerSize: 16,
        rotatingPointOffset: 40,
        lockScalingFlip: true,
        lockUniScaling: false,
        // Ensure object can be moved and transformed
        moveCursor: 'move',
        // Preserve aspect ratio by default (can be changed by user)
        lockUniScaling: false
      });

      // Generate unique ID
      const objId = 'gif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      fabricObj.id = objId;
      console.log('Fabric object ID:', objId);

      // Store the animated element
      this.gifElements.set(objId, animatedImg);
      this.containerElement.appendChild(animatedImg);
      console.log('GIF element added to container:', { 
        containerExists: !!this.containerElement, 
        gifElementExists: !!animatedImg,
        containerChildren: this.containerElement.children.length 
      });

      // Set flag to prevent object:added handler from creating duplicates
      this.isAddingGif = true;
      
      // Add to canvas
      this.canvas.add(fabricObj);
      console.log('Fabric object added to canvas');
      
      // Reset flag after a short delay
      setTimeout(() => {
        this.isAddingGif = false;
      }, 100);
      
      // Initial position update
      this.updateGifPosition(fabricObj);
      console.log('GIF position updated');
      
      // Force a render
      this.canvas.renderAll();
      
      return fabricObj;
    } catch (error) {
      console.error('Failed to add animated GIF:', error);
      throw error;
    }
  }

  async createStaticPlaceholder(gifUrl) {
    // Create a canvas to extract first frame
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      tempImg.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = tempImg.width;
          canvas.height = tempImg.height;
          ctx.drawImage(tempImg, 0, 0);
          
          const staticDataUrl = canvas.toDataURL();
          const { FabricImage } = await import('fabric');
          
          FabricImage.fromURL(staticDataUrl, { crossOrigin: 'anonymous' }).then(resolve).catch(reject);
        } catch (error) {
          reject(error);
        }
      };
      tempImg.onerror = reject;
      tempImg.src = gifUrl;
    });
  }

  // Method to set template loading flag
  setLoadingTemplate(isLoading) {
    this.isLoadingTemplate = isLoading;
  }

  // Method to process GIFs after template is loaded
  async processGifsAfterTemplateLoad() {
    const gifObjects = this.canvas.getObjects().filter(obj => obj.isAnimatedGif);
    console.log('Processing GIFs after template load:', gifObjects.length);
    
    for (const gifObj of gifObjects) {
      // Ensure GIF objects have IDs
      if (!gifObj.id) {
        gifObj.id = 'gif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }
      
      // Override the _renderBorders method to prevent selection box rendering
      // But keep controls (handles) visible for resizing
      if (!gifObj._renderBordersOverridden) {
        gifObj._renderBorders = function(ctx) {
          // Don't render borders/selection box for GIF objects
          return;
        };
        // Also override _drawBorder to ensure no border is drawn
        gifObj._drawBorder = function(ctx) {
          // Don't draw border for GIF objects
          return;
        };
        gifObj._renderBordersOverridden = true;
      }
      
      // Make Fabric object transparent, hide border box but keep resize handles
      gifObj.set({ 
        opacity: 0,
        borderColor: 'transparent',
        borderScaleFactor: 0,
        hasBorders: false,
        // Ensure border is not drawn
        strokeWidth: 0,
        stroke: 'transparent',
        // Enable controls (handles) for resizing
        hasControls: true,
        cornerColor: '#4f46e5',
        cornerStrokeColor: '#ffffff',
        cornerSize: 12,
        cornerStyle: 'rect',
        transparentCorners: false,
        touchCornerSize: 16
      });
      
      // Check if animated element already exists
      if (!this.gifElements.has(gifObj.id) && gifObj.gifUrl) {
        try {
          await this.createAnimatedElementForExistingGif(gifObj);
        } catch (error) {
          console.error('Failed to create animated element for template GIF:', error);
        }
      }
    }
  }

  async createAnimatedElementForExistingGif(fabricObj) {
    // Create animated HTML img element for an existing GIF object (e.g., from template)
    if (!fabricObj.gifUrl || !fabricObj.id) {
      console.warn('GIF object missing gifUrl or id:', fabricObj);
      return;
    }

    // Check if element already exists
    if (this.gifElements.has(fabricObj.id)) {
      console.log('Animated element already exists for GIF:', fabricObj.id);
      return;
    }
    
    // Also check if an element with the same URL already exists (prevent duplicates)
    const normalizedUrl = this.normalizeUrl(fabricObj.gifUrl);
    const existingElement = Array.from(this.gifElements.entries()).find(([id, element]) => {
      const elementNormalized = this.normalizeUrl(element.src);
      return elementNormalized === normalizedUrl && id !== fabricObj.id;
    });
    
    if (existingElement) {
      console.log('Animated element with same URL already exists, skipping duplicate:', {
        existingId: existingElement[0],
        newId: fabricObj.id,
        url: normalizedUrl
      });
      // Link this fabric object to the existing element
      this.gifElements.set(fabricObj.id, existingElement[1]);
      return;
    }

    const animatedImg = document.createElement('img');
    animatedImg.src = fabricObj.gifUrl;
    animatedImg.crossOrigin = 'anonymous';
    animatedImg.style.position = 'absolute';
    animatedImg.style.pointerEvents = 'none';
    animatedImg.style.userSelect = 'none';
    animatedImg.style.objectFit = 'contain';
    // Ensure smooth rendering and animation
    animatedImg.style.imageRendering = 'auto';
    animatedImg.style.willChange = 'transform';
    animatedImg.style.backfaceVisibility = 'hidden';
    animatedImg.style.transformStyle = 'preserve-3d';

    // Wait for image to load
    await new Promise((resolve, reject) => {
      animatedImg.onload = () => {
        console.log('GIF loaded for existing object:', fabricObj.id);
        resolve();
      };
      animatedImg.onerror = (err) => {
        console.error('GIF failed to load for existing object:', err);
        reject(new Error(`Failed to load GIF: ${fabricObj.gifUrl}`));
      };
      // Set timeout for loading
      setTimeout(() => {
        if (!animatedImg.complete) {
          reject(new Error('GIF loading timeout'));
        }
      }, 10000);
    });

    // Store the animated element
    this.gifElements.set(fabricObj.id, animatedImg);
    this.containerElement.appendChild(animatedImg);

    // Update position
    this.updateGifPosition(fabricObj);
  }

  updateGifPositions() {
    this.canvas.getObjects().forEach(obj => {
      if (obj.isAnimatedGif) {
        this.updateGifPosition(obj);
      }
    });
  }

  updateGifPosition(fabricObj) {
    const gifElement = this.gifElements.get(fabricObj.id);
    if (!gifElement) return;

    const zoom = this.canvas.getZoom();
    const vpt = this.canvas.viewportTransform;

    // Get object bounding box for accurate positioning (handles rotation properly)
    const objBounds = fabricObj.getBoundingRect();
    
    // Calculate position with transformations (in canvas coordinates)
    // Use bounding box for accurate positioning with rotation
    const objLeft = objBounds.left * zoom + vpt[4];
    const objTop = objBounds.top * zoom + vpt[5];
    const objWidth = objBounds.width * zoom;
    const objHeight = objBounds.height * zoom;

    // Position the GIF element relative to the container (which is positioned relative to canvas wrapper)
    gifElement.style.left = objLeft + 'px';
    gifElement.style.top = objTop + 'px';
    gifElement.style.width = objWidth + 'px';
    gifElement.style.height = objHeight + 'px';
    gifElement.style.transformOrigin = 'center center';
    
    // Apply rotation - use the object's angle
    const angle = fabricObj.angle || 0;
    gifElement.style.transform = `rotate(${angle}deg)`;
    
    // HTML element should always be visible (opacity 1) - Fabric object is transparent
    // Use a stored opacity value if set, otherwise default to 1
    const storedOpacity = fabricObj._gifElementOpacity !== undefined ? fabricObj._gifElementOpacity : 1;
    gifElement.style.opacity = storedOpacity;
    gifElement.style.display = fabricObj.visible !== false ? 'block' : 'none';
    
    // Ensure z-index matches object order (higher z-index for objects on top)
    const objectIndex = this.canvas.getObjects().indexOf(fabricObj);
    gifElement.style.zIndex = (1000 + objectIndex).toString();
  }

  updateGifVisibility() {
    const activeObject = this.canvas.getActiveObject();
    
    this.canvas.getObjects().forEach(obj => {
      if (obj.isAnimatedGif) {
        const gifElement = this.gifElements.get(obj.id);
        if (gifElement) {
          // Show yellow border outline for active objects (matching regular images exactly)
          if (activeObject === obj) {
            // Yellow border like regular images - match the exact style
            gifElement.style.outline = '2px solid #fbbf24';
            gifElement.style.outlineOffset = '0px';
            gifElement.style.boxShadow = '0 0 0 1px #4f46e5';
            // Add a subtle outer border to match regular images
            gifElement.style.border = '1px solid #4f46e5';
          } else {
            gifElement.style.outline = 'none';
            gifElement.style.boxShadow = 'none';
            gifElement.style.border = 'none';
          }
        }
        
        // Override the _renderBorders method to prevent selection box rendering
        // But keep controls (handles) visible for resizing
        if (!obj._renderBordersOverridden) {
          obj._renderBorders = function(ctx) {
            // Don't render borders/selection box for GIF objects
            return;
          };
          // Also override _drawBorder to ensure no border is drawn
          obj._drawBorder = function(ctx) {
            // Don't draw border for GIF objects
            return;
          };
          obj._renderBordersOverridden = true;
        }
        
        // Ensure Fabric object is transparent, hide border box but keep resize handles
        // Always ensure controls are enabled and properly configured
        const needsUpdate = obj.opacity !== 0 || 
                           obj.hasBorders !== false || 
                           obj.hasControls !== true ||
                           obj.cornerSize !== 12;
        
        if (needsUpdate) {
          obj.set({ 
            opacity: 0,
            borderColor: 'transparent',
            borderScaleFactor: 0,
            hasBorders: false,
            // Ensure border is not drawn
            strokeWidth: 0,
            stroke: 'transparent',
            // Enable controls (handles) for resizing, rotating, etc.
            hasControls: true,
            cornerColor: '#4f46e5',
            cornerStrokeColor: '#ffffff',
            cornerSize: 12,
            cornerStyle: 'rect',
            transparentCorners: false,
            touchCornerSize: 16,
            rotatingPointOffset: 40,
            lockScalingFlip: true,
            lockUniScaling: false
          });
        }
        
        // Update position to ensure sync
        this.updateGifPosition(obj);
      }
    });
  }

  removeGifElement(fabricObj) {
    const gifElement = this.gifElements.get(fabricObj.id);
    if (gifElement) {
      this.containerElement.removeChild(gifElement);
      this.gifElements.delete(fabricObj.id);
    }
  }

  setExporting(isExporting) {
    this.isExporting = isExporting;
  }

  /**
   * Renders GIF frames onto the canvas for export
   * This temporarily replaces the static placeholder with the current GIF frame
   */
  async renderGifsForExport() {
    const gifObjects = this.canvas.getObjects().filter(obj => obj.isAnimatedGif);
    
    console.log('Rendering GIFs for export:', { gifCount: gifObjects.length });
    
    if (gifObjects.length === 0) {
      return;
    }
    
    const { FabricImage } = await import('fabric');
    
    const updatePromises = gifObjects.map(async (fabricObj) => {
      const gifElement = this.gifElements.get(fabricObj.id);
      console.log('Processing GIF object:', { 
        objId: fabricObj.id, 
        hasGifElement: !!gifElement,
        gifComplete: gifElement?.complete,
        gifWidth: gifElement?.naturalWidth,
        gifHeight: gifElement?.naturalHeight
      });
      
      if (gifElement && gifElement.complete && gifElement.naturalWidth > 0) {
        try {
          // Create a temporary canvas to draw the GIF frame
          const tempCanvas = document.createElement('canvas');
          const ctx = tempCanvas.getContext('2d');
          const width = gifElement.naturalWidth || fabricObj.width || 200;
          const height = gifElement.naturalHeight || fabricObj.height || 200;
          
          tempCanvas.width = width;
          tempCanvas.height = height;
          
          // Try to draw the GIF frame onto the temp canvas
          // If the GIF is from a different origin without CORS, this will fail
          // In that case, we need to use a proxy or convert to blob first
          let dataURL;
          
          try {
            // First, try to draw directly if crossOrigin is set
            if (gifElement.crossOrigin === 'anonymous' || gifElement.crossOrigin === 'use-credentials') {
              ctx.drawImage(gifElement, 0, 0, width, height);
              // Try to get data URL - if canvas is tainted, this will throw
              dataURL = tempCanvas.toDataURL('image/png');
            } else {
              // If crossOrigin is not set, try setting it and reloading
              throw new Error('GIF element missing crossOrigin');
            }
          } catch (drawError) {
            console.warn('Direct draw failed, trying CORS approach:', drawError);
            
            // If direct draw fails, try to reload the image with CORS
            try {
              const corsImg = new Image();
              corsImg.crossOrigin = 'anonymous';
              
              await new Promise((resolve, reject) => {
                corsImg.onload = () => {
                  try {
                    // Clear and redraw
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(corsImg, 0, 0, width, height);
                    dataURL = tempCanvas.toDataURL('image/png');
                    resolve();
                  } catch (err) {
                    reject(err);
                  }
                };
                corsImg.onerror = () => {
                  reject(new Error('Failed to load GIF with CORS'));
                };
                corsImg.src = gifElement.src;
              });
            } catch (corsError) {
              console.error('CORS approach failed, using fetch proxy:', corsError);
              
              // Last resort: fetch the image as blob and convert to data URL
              try {
                const response = await fetch(gifElement.src);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                const blobImg = new Image();
                blobImg.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                  blobImg.onload = () => {
                    try {
                      ctx.clearRect(0, 0, width, height);
                      ctx.drawImage(blobImg, 0, 0, width, height);
                      dataURL = tempCanvas.toDataURL('image/png');
                      URL.revokeObjectURL(blobUrl);
                      resolve();
                    } catch (err) {
                      URL.revokeObjectURL(blobUrl);
                      reject(err);
                    }
                  };
                  blobImg.onerror = () => {
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error('Failed to load blob image'));
                  };
                  blobImg.src = blobUrl;
                });
              } catch (fetchError) {
                console.error('All CORS approaches failed:', fetchError);
                // Fallback: use the original GIF URL and hope the server supports CORS
                // Or use a placeholder
                throw new Error('Unable to export GIF due to CORS restrictions. The GIF server must support CORS.');
              }
            }
          }
          console.log('GIF frame captured:', { width, height, dataURLLength: dataURL.length });
          
          // Store original properties if not already stored
          if (!fabricObj._originalExportProps) {
            fabricObj._originalExportProps = {
              src: fabricObj.gifUrl,
              left: fabricObj.left,
              top: fabricObj.top,
              scaleX: fabricObj.scaleX,
              scaleY: fabricObj.scaleY,
              angle: fabricObj.angle,
              opacity: fabricObj.opacity,
              width: fabricObj.width,
              height: fabricObj.height,
              id: fabricObj.id,
              isAnimatedGif: true
            };
          }
          
          // Create a new FabricImage from the captured frame and replace the object
          // This ensures the GIF frame is properly rendered on the canvas (visible, not transparent)
          // Use data URL directly - no CORS issues since it's already a data URL
          // IMPORTANT: dataURL is already a data URL, so no CORS issues
          const newFabricImg = await FabricImage.fromURL(dataURL, {
            crossOrigin: 'anonymous',
            left: fabricObj.left,
            top: fabricObj.top,
            scaleX: fabricObj.scaleX,
            scaleY: fabricObj.scaleY,
            angle: fabricObj.angle,
            opacity: 1, // Make visible for export (original is transparent)
            selectable: false,
            evented: false,
            // Ensure no CORS issues
            withoutTransform: false
          });
          
          // Ensure the underlying image element has crossOrigin set
          const imgElement = newFabricImg.getElement();
          if (imgElement) {
            imgElement.crossOrigin = 'anonymous';
            // Force reload if needed to ensure CORS is applied
            if (imgElement.src && !imgElement.src.startsWith('data:')) {
              // If somehow the src is not a data URL, reload it
              const currentSrc = imgElement.src;
              imgElement.src = '';
              imgElement.crossOrigin = 'anonymous';
              imgElement.src = currentSrc;
            }
          }
          
          // Mark this as a converted image to avoid re-processing
          newFabricImg._isConvertedForExport = true;
          
          // Store the original object for restoration
          const originalObj = fabricObj;
          
          // Remove the original transparent GIF object
          this.canvas.remove(originalObj);
          
          // Add the new visible image with the GIF frame
          this.canvas.add(newFabricImg);
          
          // Store the replacement mapping
          this.exportReplacements.set(newFabricImg, {
            original: originalObj,
            props: fabricObj._originalExportProps
          });
          
          // Wait for the new image to load (with timeout)
          await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 5 seconds max (50ms * 100)
            const checkComplete = () => {
              attempts++;
              const imgElement = newFabricImg.getElement();
              if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
                resolve();
              } else if (attempts >= maxAttempts) {
                console.warn('Image load timeout, continuing anyway');
                resolve(); // Continue even if timeout
              } else {
                setTimeout(checkComplete, 50);
              }
            };
            checkComplete();
          });
          
          console.log('GIF object replaced with visible frame for export');
          
        } catch (error) {
          console.error('Error rendering GIF for export:', error);
          // Continue with other GIFs even if one fails
        }
      } else {
        console.warn('GIF element not ready for export:', { 
          hasElement: !!gifElement,
          complete: gifElement?.complete,
          width: gifElement?.naturalWidth
        });
        // If GIF element is not ready, skip it but continue export
      }
    });
    
    // Wait for all promises, but don't fail if some fail
    const results = await Promise.allSettled(updatePromises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error('GIF export promise rejected:', result.reason, 'at index:', index);
      }
    });
    
    console.log('All GIFs processed for export, rendering canvas...');
    console.log('Canvas objects after GIF processing:', this.canvas.getObjects().length);
    console.log('Replacement map size:', this.exportReplacements.size);
    
    // Force canvas to re-render with updated images
    this.canvas.renderAll();
    
    // Wait a bit for render to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Canvas rendered after GIF processing');
  }

  /**
   * Restores GIF objects to their original state after export
   */
  async restoreGifsAfterExport() {
    console.log('Restoring GIFs after export, replacements:', this.exportReplacements.size);
    
    // Restore from exportReplacements (objects that were replaced during export)
    if (this.exportReplacements.size > 0) {
      for (const [replacementObj, data] of this.exportReplacements.entries()) {
        try {
          const { original, props } = data;
          
          // Remove the replacement object
          this.canvas.remove(replacementObj);
          
          // Restore the original GIF object
          if (props && props.src) {
            // Create a static placeholder first
            const staticPlaceholder = await this.createStaticPlaceholder(props.src);
            
            // Configure as original GIF object
            staticPlaceholder.set({
              left: props.left,
              top: props.top,
              scaleX: props.scaleX,
              scaleY: props.scaleY,
              angle: props.angle,
              opacity: 0, // Transparent (HTML element shows the animation)
              selectable: true,
              evented: true,
              isAnimatedGif: true,
              gifUrl: props.src,
              // Hide selection border
              borderColor: 'transparent',
              borderScaleFactor: 0,
              hasBorders: false,
              hasControls: true,
              cornerColor: '#4f46e5',
              cornerStrokeColor: '#ffffff',
              cornerSize: 12,
              cornerStyle: 'rect',
              transparentCorners: false,
              touchCornerSize: 16,
              rotatingPointOffset: 40,
              lockScalingFlip: true,
              lockUniScaling: false
            });
            
            // Restore ID
            if (props.id) {
              staticPlaceholder.id = props.id;
            }
            
            // Override border rendering
            staticPlaceholder._renderBorders = function(ctx) {
              return;
            };
            staticPlaceholder._drawBorder = function(ctx) {
              return;
            };
            
            // Set flag to prevent object:added handler from creating duplicate
            this.isAddingGif = true;
            
            // Add back to canvas
            this.canvas.add(staticPlaceholder);
            
            // Reset flag after a short delay
            setTimeout(() => {
              this.isAddingGif = false;
            }, 100);
            
            // Restore animated element if needed (check after adding to canvas)
            if (!this.gifElements.has(staticPlaceholder.id)) {
              await this.createAnimatedElementForExistingGif(staticPlaceholder);
            }
            
            console.log('GIF object restored:', staticPlaceholder.id);
          }
        } catch (error) {
          console.error('Error restoring GIF from replacement:', error);
        }
      }
      
      this.exportReplacements.clear();
    }
    
    // Force canvas to re-render
    this.canvas.renderAll();
    console.log('All GIFs restored after export');
  }

  destroy() {
    // Clean up all GIF elements
    this.gifElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    this.gifElements.clear();

    // Remove container
    if (this.containerElement && this.containerElement.parentNode) {
      this.containerElement.parentNode.removeChild(this.containerElement);
    }

    // Remove event listeners
    this.canvas.off('after:render');
    this.canvas.off('object:removed');
    this.canvas.off('object:added');
    this.canvas.off('selection:created');
    this.canvas.off('selection:updated');
    this.canvas.off('selection:cleared');
  }
}

export default AnimatedGifHandler;