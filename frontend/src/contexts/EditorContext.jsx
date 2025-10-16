import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

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
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [layers, setLayers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
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
      });
    }
  }, [canvas, history, historyStep]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1 && canvas) {
      const nextState = history[historyStep + 1];
      canvas.loadFromJSON(nextState, () => {
        canvas.renderAll();
        setHistoryStep(prev => prev + 1);
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
    setIsDarkMode
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};
