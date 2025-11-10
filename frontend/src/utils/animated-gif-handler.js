/**
 * Animated GIF Handler for Fabric.js Canvas
 * This creates HTML img elements that preserve GIF animation and syncs them with Fabric objects
 */

class AnimatedGifHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.gifElements = new Map(); // Map of fabric object id to HTML img element
    this.containerElement = null;
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
    // Update GIF positions when canvas renders
    this.canvas.on('after:render', () => {
      this.updateGifPositions();
    });

    // Handle object removal
    this.canvas.on('object:removed', (e) => {
      if (e.target && e.target.isAnimatedGif) {
        this.removeGifElement(e.target);
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

  async addAnimatedGif(gifUrl, options = {}) {
    try {
      console.log('AnimatedGifHandler.addAnimatedGif called:', { gifUrl, options, hasContainer: !!this.containerElement });
      
      if (!this.containerElement) {
        throw new Error('GIF container not initialized');
      }
      
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
      fabricObj.set({
        ...options,
        isAnimatedGif: true,
        gifUrl: gifUrl,
        selectable: true,
        evented: true
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

      // Add to canvas
      this.canvas.add(fabricObj);
      console.log('Fabric object added to canvas');
      
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

    // Calculate position with transformations (in canvas coordinates)
    const objLeft = (fabricObj.left || 0) * zoom + vpt[4];
    const objTop = (fabricObj.top || 0) * zoom + vpt[5];
    const objWidth = (fabricObj.width || 0) * (fabricObj.scaleX || 1) * zoom;
    const objHeight = (fabricObj.height || 0) * (fabricObj.scaleY || 1) * zoom;

    // Position the GIF element relative to the container (which is positioned relative to canvas wrapper)
    gifElement.style.left = objLeft + 'px';
    gifElement.style.top = objTop + 'px';
    gifElement.style.width = objWidth + 'px';
    gifElement.style.height = objHeight + 'px';
    gifElement.style.transformOrigin = 'center center';
    gifElement.style.transform = `rotate(${fabricObj.angle || 0}deg)`;
    gifElement.style.opacity = fabricObj.opacity !== undefined ? fabricObj.opacity : 1;
    gifElement.style.display = fabricObj.visible !== false ? 'block' : 'none';
  }

  updateGifVisibility() {
    const activeObject = this.canvas.getActiveObject();
    
    this.canvas.getObjects().forEach(obj => {
      if (obj.isAnimatedGif) {
        const gifElement = this.gifElements.get(obj.id);
        if (gifElement) {
          // Show selection outline for active objects
          if (activeObject === obj) {
            gifElement.style.outline = '2px solid #4f46e5';
            gifElement.style.outlineOffset = '2px';
          } else {
            gifElement.style.outline = 'none';
          }
        }
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
    this.canvas.off('selection:created');
    this.canvas.off('selection:updated');
    this.canvas.off('selection:cleared');
  }
}

export default AnimatedGifHandler;