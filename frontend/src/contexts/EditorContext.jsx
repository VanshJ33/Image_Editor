import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Group, Rect, Circle, Text, FabricImage } from 'fabric';

const EditorContext = createContext(null);

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
};

export const EditorProvider = ({ children }) => {
  const [canvas, setCanvas] = useState(null);
  const [activeObject, setActiveObject] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [layers, setLayers] = useState([]);
  const [selectedLayers, setSelectedLayers] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [clipboardObject, setClipboardObject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    blur: 0
  });
  const [boards, setBoards] = useState([{ id: 1, name: 'Board 1', data: null }]);
  const [activeBoard, setActiveBoard] = useState(1);
  const [canvasRotation, setCanvasRotation] = useState(0);
  const canvasRef = useRef(null);
  const boardDataRef = useRef({});
  const isInitialized = useRef(false);

  // Initialize history when canvas is first set
  useEffect(() => {
    if (canvas && !isInitialized.current) {
      // Save initial empty canvas state
      const initialState = canvas.toJSON();
      setHistory([initialState]);
      setHistoryStep(0);
      isInitialized.current = true;
    }
  }, [canvas]);

  const updateLayers = useCallback(() => {
    if (canvas) {
      const objects = canvas.getObjects();
      const layerList = [];
      
      const processObject = (obj, index, parentId = null) => {
        const layerId = `layer-${objects.length - 1 - index}`;
        const layer = {
          id: layerId,
          name: obj.name || (obj.type === 'textbox' ? obj.text?.substring(0, 20) + '...' : obj.type) || 'Layer',
          type: obj.type,
          visible: obj.visible !== false,
          locked: obj.selectable === false,
          index: objects.length - 1 - index,
          parentId: parentId,
          isGroup: obj.type === 'group',
          children: []
        };
        
        if (obj.type === 'group' && obj.getObjects) {
          // Process children of the group
          const groupObjects = obj.getObjects();
          groupObjects.forEach((childObj, childIndex) => {
            const childLayer = processObject(childObj, index, layerId);
            layer.children.push(childLayer);
          });
        }
        
        return layer;
      };
      
      objects.forEach((obj, index) => {
        const layer = processObject(obj, index);
        layerList.push(layer);
      });
      
      setLayers(layerList.reverse());
    }
  }, [canvas]);

  const saveToHistory = useCallback(() => {
    if (canvas) {
      const json = canvas.toJSON();
      setHistory(prev => {
        const newHistory = prev.slice(0, historyStep + 1);
        const updatedHistory = [...newHistory, json];
        // Limit history to prevent memory issues
        return updatedHistory.slice(-50);
      });
      setHistoryStep(prev => prev + 1);
    }
  }, [canvas, historyStep]);

  const undo = useCallback(() => {
    if (historyStep > 0 && canvas && history[historyStep - 1]) {
      const prevState = history[historyStep - 1];
      canvas.loadFromJSON(prevState, () => {
        canvas.renderAll();
        canvas.requestRenderAll();
        setHistoryStep(prev => prev - 1);
        updateLayers();
        // Update active object after undo
        const activeObj = canvas.getActiveObject();
        setActiveObject(activeObj);
      });
    }
  }, [canvas, history, historyStep, updateLayers, setActiveObject]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1 && canvas) {
      const nextStep = historyStep + 1;
      const nextState = history[nextStep];
      if (nextState) {
        canvas.loadFromJSON(nextState, () => {
          canvas.renderAll();
          canvas.requestRenderAll();
          setHistoryStep(nextStep);
          updateLayers();
          // Update active object after redo
          const activeObj = canvas.getActiveObject();
          setActiveObject(activeObj);
        });
      }
    }
  }, [canvas, history, historyStep, updateLayers, setActiveObject]);

  const copyObject = useCallback(() => {
    if (activeObject) {
      setClipboardObject(activeObject);
    }
  }, [activeObject]);

  const pasteObject = useCallback(() => {
    if (clipboardObject && canvas) {
      clipboardObject.clone((cloned) => {
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveToHistory();
      });
    }
  }, [clipboardObject, canvas, saveToHistory]);

  const deleteObject = useCallback(() => {
    if (activeObject && canvas) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveToHistory();
    }
  }, [activeObject, canvas, saveToHistory]);
  
  const exportCanvas = useCallback((format = 'png', quality = 1) => {
    if (canvas) {
      setIsLoading(true);
      try {
        const dataURL = canvas.toDataURL({
          format: format,
          quality: quality,
          multiplier: 2 // Higher resolution export
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `design.${format}`;
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return dataURL;
      } finally {
        setIsLoading(false);
      }
    }
  }, [canvas]);
  
  const duplicateObject = useCallback(() => {
    if (activeObject && canvas) {
      activeObject.clone((cloned) => {
        cloned.set({
          left: cloned.left + 20,
          top: cloned.top + 20,
        });
        canvas.add(cloned);
        canvas.setActiveObject(cloned);
        canvas.renderAll();
        saveToHistory();
      });
    }
  }, [activeObject, canvas, saveToHistory]);
  
  const centerObject = useCallback(() => {
    if (activeObject && canvas) {
      activeObject.center();
      canvas.renderAll();
      saveToHistory();
    }
  }, [activeObject, canvas, saveToHistory]);
  
  const resetCanvas = useCallback(() => {
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      setBackgroundColor('#ffffff');
      canvas.renderAll();
      saveToHistory();
    }
  }, [canvas, saveToHistory]);

  const switchBoard = useCallback((boardId) => {
    if (canvas && activeBoard !== boardId) {
      // Save current board data
      boardDataRef.current[activeBoard] = {
        json: canvas.toJSON(),
        backgroundColor,
        canvasSize,
        history,
        historyStep
      };
      
      // Switch to new board
      setActiveBoard(boardId);
      
      // Load new board data
      const boardData = boardDataRef.current[boardId];
      if (boardData && boardData.json) {
        canvas.loadFromJSON(boardData.json, () => {
          canvas.renderAll();
          setBackgroundColor(boardData.backgroundColor || '#ffffff');
          setCanvasSize(boardData.canvasSize || { width: 1080, height: 1080 });
          setHistory(boardData.history || []);
          setHistoryStep(boardData.historyStep || 0);
          updateLayers();
        });
      } else {
        // New board - clear canvas
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        setBackgroundColor('#ffffff');
        setCanvasSize({ width: 1080, height: 1080 });
        canvas.setDimensions({ width: 1080, height: 1080 });
        setHistory([]);
        setHistoryStep(0);
        canvas.renderAll();
        updateLayers();
      }
    }
  }, [canvas, activeBoard, backgroundColor, canvasSize, history, historyStep, updateLayers]);

  const createBoard = useCallback(() => {
    const newId = Math.max(...boards.map(b => b.id)) + 1;
    const newBoard = { id: newId, name: `Board ${newId}`, data: null };
    setBoards(prev => [...prev, newBoard]);
    switchBoard(newId);
  }, [boards, switchBoard]);

  const closeBoard = useCallback((boardId) => {
    if (boards.length > 1) {
      setBoards(prev => prev.filter(b => b.id !== boardId));
      delete boardDataRef.current[boardId];
      
      if (activeBoard === boardId) {
        const remainingBoards = boards.filter(b => b.id !== boardId);
        switchBoard(remainingBoards[0].id);
      }
    }
  }, [boards, activeBoard, switchBoard]);

  const duplicateBoard = useCallback((boardId) => {
    const boardToDuplicate = boards.find(b => b.id === boardId);
    if (boardToDuplicate && canvas) {
      const newId = Math.max(...boards.map(b => b.id)) + 1;
      const newBoard = { id: newId, name: `${boardToDuplicate.name} Copy`, data: null };
      
      // If duplicating the currently active board, use current canvas state
      if (boardId === activeBoard) {
        boardDataRef.current[newId] = {
          json: canvas.toJSON(),
          backgroundColor,
          canvasSize: { ...canvasSize },
          history: [...history],
          historyStep
        };
      } else {
        // Copy from stored board data
        const sourceBoardData = boardDataRef.current[boardId];
        if (sourceBoardData) {
          boardDataRef.current[newId] = {
            json: JSON.parse(JSON.stringify(sourceBoardData.json)),
            backgroundColor: sourceBoardData.backgroundColor,
            canvasSize: { ...sourceBoardData.canvasSize },
            history: sourceBoardData.history.map(h => JSON.parse(JSON.stringify(h))),
            historyStep: sourceBoardData.historyStep
          };
        }
      }
      
      setBoards(prev => [...prev, newBoard]);
      switchBoard(newId);
    }
  }, [boards, canvas, backgroundColor, canvasSize, history, historyStep, activeBoard, switchBoard]);

  const bringForward = useCallback(() => {
    if (activeObject && canvas) {
      canvas.bringForward(activeObject);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  }, [activeObject, canvas, updateLayers, saveToHistory]);

  const sendBackward = useCallback(() => {
    if (activeObject && canvas) {
      canvas.sendBackwards(activeObject);
      canvas.renderAll();
      updateLayers();
      saveToHistory();
    }
  }, [activeObject, canvas, updateLayers, saveToHistory]);

  const resizeCanvas = useCallback((newWidth, newHeight) => {
    if (!canvas) return;
    
    const scaleX = newWidth / canvasSize.width;
    const scaleY = newHeight / canvasSize.height;
    
    // Scale all objects to fit new canvas dimensions
    canvas.getObjects().forEach(obj => {
      obj.set({
        left: obj.left * scaleX,
        top: obj.top * scaleY,
        scaleX: obj.scaleX * scaleX,
        scaleY: obj.scaleY * scaleY
      });
      obj.setCoords();
    });
    
    const newSize = { width: newWidth, height: newHeight };
    setCanvasSize(newSize);
    canvas.setDimensions(newSize);
    canvas.renderAll();
    updateLayers();
    saveToHistory();
  }, [canvas, canvasSize, setCanvasSize, updateLayers, saveToHistory]);

  const rotateCanvas = useCallback((direction) => {
    if (!canvas) return;
    
    const rotation = direction === 'left' ? -90 : 90;
    const newRotation = (canvasRotation + rotation) % 360;
    
    // Swap canvas dimensions for 90/270 degree rotations
    if (Math.abs(newRotation) === 90 || Math.abs(newRotation) === 270) {
      resizeCanvas(canvasSize.height, canvasSize.width);
    }
    
    setCanvasRotation(newRotation);
    canvas.renderAll();
    saveToHistory();
  }, [canvas, canvasRotation, canvasSize, saveToHistory, resizeCanvas]);

  const selectLayer = useCallback((layerId) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  }, []);

  const selectAllLayers = useCallback(() => {
    setSelectedLayers(layers.map(layer => layer.id));
  }, [layers]);

  const clearLayerSelection = useCallback(() => {
    setSelectedLayers([]);
  }, []);

  const toggleGroupExpansion = useCallback((groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);
const groupSelectedLayers = useCallback(() => {
    if (!canvas || selectedLayers.length < 2) return;
    
    const objects = canvas.getObjects();
    const objectsToGroup = selectedLayers.map(layerId => {
      const layerIndex = layers.findIndex(layer => layer.id === layerId);
      return objects[objects.length - 1 - layerIndex];
    }).filter(obj => obj);

    if (objectsToGroup.length >= 2) {
      // Remove original objects
      objectsToGroup.forEach(obj => canvas.remove(obj));
      
      const group = new Group(objectsToGroup, {
        subTargetCheck: true,
        interactive: true
      });
      
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();
      clearLayerSelection();

    }
  }, [canvas, selectedLayers, layers, updateLayers, saveToHistory, clearLayerSelection]);

  const ungroupObjects = useCallback(() => {
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === 'group') {
      const objects = activeObject.getObjects();
      canvas.remove(activeObject);
      objects.forEach(obj => canvas.add(obj));
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();

    }
  }, [canvas, updateLayers, saveToHistory]);

  const ungroupLayer = useCallback((layerId) => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    const obj = objects[objects.length - 1 - layerIndex];
    
    if (obj && obj.type === 'group') {
      const groupObjects = obj.getObjects();
      canvas.remove(obj);
      groupObjects.forEach(groupObj => canvas.add(groupObj));
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();
      clearLayerSelection();

    }
  }, [canvas, layers, updateLayers, saveToHistory, clearLayerSelection]);

  const moveLayerUp = useCallback((layerId) => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    const objectIndex = objects.length - 1 - layerIndex;
    const obj = objects[objectIndex];
    
    if (obj && objectIndex < objects.length - 1) {
      canvas.bringForward(obj);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();
    }
  }, [canvas, layers, updateLayers, saveToHistory]);

  const moveLayerDown = useCallback((layerId) => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    const objectIndex = objects.length - 1 - layerIndex;
    const obj = objects[objectIndex];
    
    if (obj && objectIndex > 0) {
      canvas.sendBackwards(obj);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();
    }
  }, [canvas, layers, updateLayers, saveToHistory]);

  const moveLayerToTop = useCallback((layerId) => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    const obj = objects[objects.length - 1 - layerIndex];
    
    if (obj) {
      canvas.bringToFront(obj);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();
    }
  }, [canvas, layers, updateLayers, saveToHistory]);

  const moveLayerToBottom = useCallback((layerId) => {
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    const obj = objects[objects.length - 1 - layerIndex];
    
    if (obj) {
      canvas.sendToBack(obj);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();
    }
  }, [canvas, layers, updateLayers, saveToHistory]);

  const groupObjects = useCallback(() => {
    if (!canvas) return;
    const activeSelection = canvas.getActiveObject();
    if (activeSelection && activeSelection.type === 'activeSelection') {
      const group = activeSelection.toGroup();
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();

    }
  }, [canvas, updateLayers, saveToHistory]);

  const cropImage = useCallback(() => {
    if (!canvas || !activeObject || activeObject.type !== 'image') return;
    
    const cropRect = new Rect({
      left: activeObject.left,
      top: activeObject.top,
      width: activeObject.width * activeObject.scaleX,
      height: activeObject.height * activeObject.scaleY,
      fill: 'transparent',
      stroke: '#ff0000',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true
    });
    
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.requestRenderAll();

  }, [canvas, activeObject]);

  const applyCrop = useCallback(() => {
    if (!canvas) return;
    const cropRect = canvas.getActiveObject();
    const image = canvas.getObjects().find(obj => obj.type === 'image');
    
    if (cropRect && image && cropRect.stroke === '#ff0000') {
      image.set({
        cropX: (cropRect.left - image.left) / image.scaleX,
        cropY: (cropRect.top - image.top) / image.scaleY,
        width: cropRect.width / image.scaleX,
        height: cropRect.height / image.scaleY
      });
      
      canvas.remove(cropRect);
      canvas.setActiveObject(image);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();

    }
  }, [canvas, updateLayers, saveToHistory]);

  const maskWithShape = useCallback((shape) => {
    if (!canvas || !activeObject || activeObject.type !== 'image') return;
    
    const imgElement = activeObject.getElement();
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    const size = Math.min(activeObject.width * activeObject.scaleX, activeObject.height * activeObject.scaleY);
    tempCanvas.width = size;
    tempCanvas.height = size;
    
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
      ctx.clip();
    }
    
    ctx.drawImage(imgElement, 0, 0, size, size);
    
    const dataURL = tempCanvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      const fabricImg = new FabricImage(img);
      fabricImg.set({
        left: activeObject.left,
        top: activeObject.top,
        scaleX: 1,
        scaleY: 1
      });
      
      canvas.remove(activeObject);
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();

    };
    img.src = dataURL;
  }, [canvas, activeObject, updateLayers, saveToHistory]);

  const maskWithText = useCallback((text) => {
    if (!canvas || !activeObject || !text || activeObject.type !== 'image') return;
    
    const imgElement = activeObject.getElement();
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    const width = activeObject.width * activeObject.scaleX;
    const height = activeObject.height * activeObject.scaleY;
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    ctx.font = `bold ${Math.min(width, height) / 3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillText(text, width/2, height/2);
    
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(imgElement, 0, 0, width, height);
    
    const dataURL = tempCanvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      const fabricImg = new FabricImage(img);
      fabricImg.set({
        left: activeObject.left,
        top: activeObject.top,
        scaleX: 1,
        scaleY: 1
      });
      
      canvas.remove(activeObject);
      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.requestRenderAll();
      updateLayers();
      saveToHistory();

    };
    img.src = dataURL;
  }, [canvas, activeObject, updateLayers, saveToHistory]);

  const removeMask = useCallback(() => {
    if (!canvas || !activeObject || !activeObject.clipPath) return;
    
    activeObject.clipPath = null;
    canvas.requestRenderAll();
    updateLayers();
    saveToHistory();

  }, [canvas, activeObject, updateLayers, saveToHistory]);

  // Add keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);



  const value = {
    canvas,
    setCanvas,
    canvasRef,
    activeObject,
    setActiveObject,
    zoom,
    setZoom,
    canvasSize,
    setCanvasSize,
    backgroundColor,
    setBackgroundColor,
    history,
    historyStep,
    saveToHistory,
    undo,
    redo,
    layers,
    updateLayers,
    selectedTemplate,
    setSelectedTemplate,
    isDarkMode,
    setIsDarkMode,
    showGrid,
    setShowGrid,
    copyObject,
    pasteObject,
    deleteObject,
    bringForward,
    sendBackward,
    clipboardObject,
    isLoading,
    setIsLoading,
    filters,
    setFilters,
    exportCanvas,
    duplicateObject,
    centerObject,
    resetCanvas,
    boards,
    activeBoard,
    createBoard,
    switchBoard,
    closeBoard,
    duplicateBoard,
    rotateCanvas,
    canvasRotation,
    groupObjects,
    ungroupObjects,
    selectedLayers,
    selectLayer,
    selectAllLayers,
    clearLayerSelection,
    groupSelectedLayers,
    expandedGroups,
    toggleGroupExpansion,
    ungroupLayer,
    cropImage,
    applyCrop,
    maskWithShape,
    maskWithText,
    removeMask,
    resizeCanvas,
    moveLayerUp,
    moveLayerDown,
    moveLayerToTop,
    moveLayerToBottom
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
