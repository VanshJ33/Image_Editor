import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

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
  const [historyStep, setHistoryStep] = useState(0);
  const [layers, setLayers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [clipboardObject, setClipboardObject] = useState(null);
  const canvasRef = useRef(null);

  const saveToHistory = useCallback(() => {
    if (canvas) {
      const json = canvas.toJSON();
      setHistory(prev => {
        const newHistory = prev.slice(0, historyStep + 1);
        return [...newHistory, json];
      });
      setHistoryStep(prev => prev + 1);
    }
  }, [canvas, historyStep]);

  const undo = useCallback(() => {
    if (historyStep > 0 && canvas) {
      const prevState = history[historyStep - 1];
      canvas.loadFromJSON(prevState, () => {
        canvas.renderAll();
        setHistoryStep(prev => prev - 1);
        updateLayers();
      });
    }
  }, [canvas, history, historyStep]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1 && canvas) {
      const nextState = history[historyStep + 1];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryStep(prev => prev + 1);
        updateLayers();
      });
    }
  }, [canvas, history, historyStep]);

  const updateLayers = useCallback(() => {
    if (canvas) {
      const objects = canvas.getObjects();
      const layerList = objects.map((obj, index) => ({
        id: obj.id || `layer-${index}`,
        name: obj.name || obj.type || 'Layer',
        type: obj.type,
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        index
      }));
      setLayers(layerList.reverse());
    }
  }, [canvas]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        redo();
      }
      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeObject) {
        e.preventDefault();
        copyObject();
      }
      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteObject();
      }
      // Delete: Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeObject) {
        e.preventDefault();
        deleteObject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, copyObject, pasteObject, deleteObject, activeObject]);

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
    clipboardObject
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
