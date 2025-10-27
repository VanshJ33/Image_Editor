// Replace the maskImageWithCustomShape function with this simpler approach:

const maskImageWithCustomShape = useCallback(() => {
  if (!canvas || !activeObject || activeObject.type !== 'image') {
    toast.error('Please select an image to mask');
    return;
  }

  // Get all objects on canvas
  const objects = canvas.getObjects();
  let shapeToUse = null;
  
  // Look for any selectable shape object (not the active image, not visual indicators, not grid lines)
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    
    // Skip if it's the active image or visual indicators
    if (obj === activeObject || 
        obj.id === 'grid-line' || 
        obj.name === 'customShapePoint' || 
        obj.name === 'customShapeLine') {
      continue;
    }
    
    // Check if it's a valid shape to use for masking
    const validTypes = ['path', 'rect', 'circle', 'ellipse', 'triangle', 'polygon'];
    
    if (validTypes.includes(obj.type) || obj.selectable) {
      shapeToUse = obj;
      break;
    }
  }

  if (!shapeToUse) {
    toast.error('Please create a shape first (circle, rectangle, custom shape, etc.). Then select the image and click "Mask with Shape".');
    return;
  }

  try {
    // Create a new shape object directly instead of cloning
    let clipShape;
    
    if (shapeToUse.type === 'rect') {
      clipShape = new fabric.Rect({
        left: shapeToUse.left - activeObject.left,
        top: shapeToUse.top - activeObject.top,
        width: shapeToUse.width,
        height: shapeToUse.height,
        scaleX: shapeToUse.scaleX,
        scaleY: shapeToUse.scaleY,
        angle: shapeToUse.angle
      });
    } else if (shapeToUse.type === 'circle') {
      clipShape = new fabric.Circle({
        left: shapeToUse.left - activeObject.left,
        top: shapeToUse.top - activeObject.top,
        radius: shapeToUse.radius,
        scaleX: shapeToUse.scaleX,
        scaleY: shapeToUse.scaleY,
        angle: shapeToUse.angle
      });
    } else {
      // For other shapes, use a simple rect as fallback
      clipShape = new fabric.Rect({
        left: shapeToUse.left - activeObject.left,
        top: shapeToUse.top - activeObject.top,
        width: shapeToUse.width || 100,
        height: shapeToUse.height || 100,
        scaleX: shapeToUse.scaleX || 1,
        scaleY: shapeToUse.scaleY || 1,
        angle: shapeToUse.angle || 0
      });
    }
    
    // Remove the original shape from canvas
    canvas.remove(shapeToUse);
    
    // Apply as clipPath
    activeObject.clipPath = clipShape;
    activeObject.dirty = true;
    
    canvas.renderAll();
    updateLayers();
    saveToHistory();
    toast.success(`Image masked with ${shapeToUse.type} shape!`);
    
  } catch (error) {
    console.error('Masking error:', error);
    toast.error('Failed to apply mask. Please try again.');
  }
}, [canvas, activeObject, updateLayers, saveToHistory]);