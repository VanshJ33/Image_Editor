/**
 * Shape Drawing Tool - MiniPaint-inspired drag-to-draw functionality
 * Allows users to draw shapes by clicking and dragging on the canvas
 */

import * as fabric from 'fabric';

class ShapeDrawingTool {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.currentShape = null;
    this.startPoint = null;
    this.shapeType = null;
    this.shapeParams = {};
    this.isActive = false;
    
    // Bind handlers once in constructor
    this.onMouseDownHandler = this.onMouseDown.bind(this);
    this.onMouseMoveHandler = this.onMouseMove.bind(this);
    this.onMouseUpHandler = this.onMouseUp.bind(this);
  }

  /**
   * Activate shape drawing mode
   */
  activate(shapeType, params = {}) {
    if (!this.canvas) {
      console.error('Canvas not available');
      return;
    }

    // Deactivate first to clean up
    this.deactivate();

    this.shapeType = shapeType;
    this.shapeParams = {
      fill: params.fill || '#667eea',
      stroke: params.stroke || 'transparent',
      strokeWidth: params.strokeWidth || 0,
      rx: params.rx || 0,
      ry: params.ry || 0,
      ...params
    };
    
    this.isActive = true;
    
    // Disable canvas selection
    this.canvas.selection = false;
    this.canvas.defaultCursor = 'crosshair';
    this.canvas.hoverCursor = 'crosshair';
    this.canvas.moveCursor = 'crosshair';
    
    // Remove any existing handlers first
    this.canvas.off('mouse:down', this.onMouseDownHandler);
    this.canvas.off('mouse:move', this.onMouseMoveHandler);
    this.canvas.off('mouse:up', this.onMouseUpHandler);
    
    // Add event listeners
    this.canvas.on('mouse:down', this.onMouseDownHandler);
    this.canvas.on('mouse:move', this.onMouseMoveHandler);
    this.canvas.on('mouse:up', this.onMouseUpHandler);
    
    console.log('✅ Shape drawing tool activated:', shapeType);
    console.log('Canvas selection:', this.canvas.selection);
    console.log('Canvas cursor:', this.canvas.defaultCursor);
  }

  /**
   * Deactivate shape drawing mode
   */
  deactivate() {
    this.isActive = false;
    this.isDrawing = false;
    
    // Remove shape if still drawing
    if (this.currentShape && this.canvas) {
      try {
        this.canvas.remove(this.currentShape);
      } catch (e) {
        // Shape might already be removed
      }
    }
    
    this.currentShape = null;
    this.startPoint = null;
    this.shapeType = null;
    
    // Restore canvas settings
    if (this.canvas) {
      this.canvas.selection = true;
      this.canvas.defaultCursor = 'default';
      this.canvas.hoverCursor = 'move';
      this.canvas.moveCursor = 'move';
      
      // Remove event listeners
      this.canvas.off('mouse:down', this.onMouseDownHandler);
      this.canvas.off('mouse:move', this.onMouseMoveHandler);
      this.canvas.off('mouse:up', this.onMouseUpHandler);
    }
  }

  /**
   * Handle mouse down
   */
  onMouseDown(e) {
    if (!this.isActive || !this.shapeType) {
      console.log('Tool not active or no shape type');
      return;
    }
    
    console.log('Shape tool mouse down, target:', e.target);
    
    // Don't start if clicking on existing object (but allow background image)
    if (e.target && e.target.type && e.target !== this.canvas.backgroundImage) {
      console.log('Clicked on existing object, deactivating');
      this.deactivate();
      return;
    }
    
    // Stop event from propagating to other handlers
    if (e.e) {
      e.e.stopPropagation();
      e.e.stopImmediatePropagation();
    }
    
    const pointer = this.canvas.getPointer(e.e);
    this.startPoint = { x: pointer.x, y: pointer.y };
    this.isDrawing = true;

    console.log('Creating shape at:', pointer.x, pointer.y);
    
    // Create shape
    this.createShape(pointer.x, pointer.y);
    
    if (!this.currentShape) {
      console.error('Failed to create shape');
      this.isDrawing = false;
      return;
    }
    
    console.log('Shape created:', this.currentShape.type, 'fill:', this.currentShape.fill);
    
    // Add to canvas
    this.canvas.add(this.currentShape);
    this.canvas.renderAll();
    
    console.log('Shape added to canvas, objects count:', this.canvas.getObjects().length);
  }

  /**
   * Handle mouse move
   */
  onMouseMove(e) {
    if (!this.isDrawing || !this.currentShape || !this.startPoint) {
      return;
    }

    const pointer = this.canvas.getPointer(e.e);
    const startX = this.startPoint.x;
    const startY = this.startPoint.y;
    const currentX = pointer.x;
    const currentY = pointer.y;

    // Calculate dimensions
    let left = Math.min(startX, currentX);
    let top = Math.min(startY, currentY);
    let width = Math.abs(currentX - startX);
    let height = Math.abs(currentY - startY);

    // Minimum size to ensure visibility
    if (width < 2) width = 2;
    if (height < 2) height = 2;

    // Perfect shapes with Ctrl/Cmd
    const isPerfectShape = e.e && (e.e.ctrlKey || e.e.metaKey);

    // Update shape
    this.updateShape(left, top, width, height, isPerfectShape, pointer);
    
    // Force render
    this.canvas.renderAll();
    this.canvas.requestRenderAll();
  }

  /**
   * Handle mouse up
   */
  onMouseUp(e) {
    if (!this.isDrawing || !this.currentShape) {
      this.isDrawing = false;
      this.currentShape = null;
      this.startPoint = null;
      return;
    }

    const pointer = this.canvas.getPointer(e.e);
    const startX = this.startPoint.x;
    const startY = this.startPoint.y;
    const currentX = pointer.x;
    const currentY = pointer.y;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    // Remove if too small
    if (width < 5 && height < 5) {
      this.canvas.remove(this.currentShape);
      this.canvas.renderAll();
    } else {
      // Finalize
      this.finalizeShape();
    }

    this.isDrawing = false;
    this.currentShape = null;
    this.startPoint = null;
  }

  /**
   * Create shape
   */
  createShape(x, y) {
    const params = this.shapeParams;

    try {
      switch (this.shapeType) {
        case 'rectangle':
          this.currentShape = new fabric.Rect({
            left: x,
            top: y,
            width: 1,
            height: 1,
            fill: params.fill || '#667eea',
            stroke: params.stroke || 'transparent',
            strokeWidth: params.strokeWidth || 0,
            rx: params.rx || 0,
            ry: params.ry || 0,
            selectable: false,
            evented: false,
            opacity: 1,
            visible: true,
          });
          console.log('Rectangle created with fill:', this.currentShape.fill);
          break;

        case 'ellipse':
        case 'circle':
          this.currentShape = new fabric.Ellipse({
            left: x,
            top: y,
            rx: 1,
            ry: 1,
            fill: params.fill || '#667eea',
            stroke: params.stroke || 'transparent',
            strokeWidth: params.strokeWidth || 0,
            selectable: false,
            evented: false,
            opacity: 1,
            visible: true,
          });
          console.log('Ellipse created with fill:', this.currentShape.fill);
          break;

        case 'triangle':
          this.currentShape = new fabric.Triangle({
            left: x,
            top: y,
            width: 1,
            height: 1,
            fill: params.fill || '#667eea',
            stroke: params.stroke || 'transparent',
            strokeWidth: params.strokeWidth || 0,
            selectable: false,
            evented: false,
            opacity: 1,
            visible: true,
          });
          break;

        case 'line':
          this.currentShape = new fabric.Line(
            [x, y, x, y],
            {
              stroke: params.stroke || '#1e293b',
              strokeWidth: params.strokeWidth || 3,
              selectable: false,
              evented: false,
              opacity: 1,
              visible: true,
            }
          );
          break;

        default:
          this.currentShape = new fabric.Rect({
            left: x,
            top: y,
            width: 0,
            height: 0,
            fill: params.fill || '#667eea',
            stroke: params.stroke || 'transparent',
            strokeWidth: params.strokeWidth || 0,
            selectable: false,
            evented: false,
            opacity: 1,
            visible: true,
          });
      }

      // Set properties
      if (this.currentShape) {
        this.currentShape.set({
          cornerStyle: 'circle',
          cornerSize: 12,
          transparentCorners: false,
          cornerColor: '#4f46e5',
          borderColor: '#4f46e5',
        });
        
        if (!this.currentShape.id) {
          this.currentShape.id = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        this.currentShape.setCoords();
      }
    } catch (error) {
      console.error('Error creating shape:', error);
      this.currentShape = null;
    }
  }

  /**
   * Update shape dimensions
   */
  updateShape(left, top, width, height, isPerfectShape, currentPointer) {
    if (!this.currentShape) return;

    try {
      switch (this.shapeType) {
        case 'rectangle':
          if (isPerfectShape) {
            const size = Math.max(width, height);
            width = size;
            height = size;
            if (this.startPoint.x > currentPointer.x) {
              left = this.startPoint.x - size;
            }
            if (this.startPoint.y > currentPointer.y) {
              top = this.startPoint.y - size;
            }
          }
          this.currentShape.set({ left, top, width, height });
          break;

        case 'ellipse':
        case 'circle':
          if (isPerfectShape || this.shapeType === 'circle') {
            const radius = Math.max(width, height) / 2;
            width = radius * 2;
            height = radius * 2;
            if (this.startPoint.x > currentPointer.x) {
              left = this.startPoint.x - width;
            }
            if (this.startPoint.y > currentPointer.y) {
              top = this.startPoint.y - height;
            }
          }
          this.currentShape.set({
            left,
            top,
            rx: width / 2,
            ry: height / 2,
          });
          break;

        case 'triangle':
          if (isPerfectShape) {
            const size = Math.max(width, height);
            width = size;
            height = size;
          }
          this.currentShape.set({ left, top, width, height });
          break;

        case 'line':
          const startX = this.startPoint.x;
          const startY = this.startPoint.y;
          const endX = currentPointer.x;
          const endY = currentPointer.y;
          
          if (isPerfectShape) {
            const dx = Math.abs(endX - startX);
            const dy = Math.abs(endY - startY);
            if (dx > dy) {
              this.currentShape.set({
                x1: startX,
                y1: startY,
                x2: endX,
                y2: startY,
              });
            } else {
              this.currentShape.set({
                x1: startX,
                y1: startY,
                x2: startX,
                y2: endY,
              });
            }
          } else {
            this.currentShape.set({
              x1: startX,
              y1: startY,
              x2: endX,
              y2: endY,
            });
          }
          break;
      }

      this.currentShape.setCoords();
    } catch (error) {
      console.error('Error updating shape:', error);
    }
  }

  /**
   * Finalize shape
   */
  finalizeShape() {
    if (!this.currentShape) return;

    try {
      if (!this.currentShape.id) {
        this.currentShape.id = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      if (!this.currentShape.name) {
        const shapeName = this.shapeType.charAt(0).toUpperCase() + this.shapeType.slice(1);
        this.currentShape.name = `${shapeName} #${Date.now()}`;
      }

      this.currentShape.set({
        selectable: true,
        evented: true,
      });
      
      this.currentShape.setCoords();
      
      setTimeout(() => {
        try {
          if (this.currentShape && this.canvas) {
            const objects = this.canvas.getObjects();
            if (objects.includes(this.currentShape)) {
              this.canvas.setActiveObject(this.currentShape);
              this.canvas.renderAll();
            }
          }
        } catch (error) {
          console.warn('Failed to set active object:', error);
          if (this.canvas) {
            this.canvas.renderAll();
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error finalizing shape:', error);
    }
  }
}

export default ShapeDrawingTool;
