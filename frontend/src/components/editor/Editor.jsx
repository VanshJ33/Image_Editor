import React, { useEffect, useRef } from 'react';
import { EditorProvider, useEditor } from '../../contexts/EditorContext.tsx';
import Navbar from './Navbar';
import BoardTabs from './BoardTabs';
import LeftSidebar from './LeftSidebar';
import Canvas from './Canvas';
import RightSidebar from './RightSidebar';
import { QuickStartGuide } from '../ui/quick-start';
import OrganizationImageBar from './OrganizationImageBar';
import { saveCanvasToOrganization } from '../../utils/canvasSave';
import { toast } from 'sonner';

const EditorContent = ({ organizationName }) => {
  const { canvas, saveToHistory, updateLayers, historyStep } = useEditor();
  const lastSaveStepRef = useRef(-1);
  const autoSaveTimeoutRef = useRef(null);
  
  // Save canvas when entering Image Editor (component mounts with canvas ready)
  useEffect(() => {
    if (!canvas || !organizationName) return;
    
    // Wait for canvas to be fully initialized
    const timer = setTimeout(async () => {
      try {
        // Check if canvas has any objects before saving
        const objects = canvas.getObjects();
        if (objects.length > 0) {
          const result = await saveCanvasToOrganization(canvas, organizationName, 'editor');
          if (result.success) {
            lastSaveStepRef.current = historyStep;
            console.log('Canvas saved to organization folder on editor entry');
          }
        }
      } catch (error) {
        console.error('Failed to save canvas on entry:', error);
      }
    }, 2000); // Wait 2 seconds for canvas to be fully rendered
    
    return () => clearTimeout(timer);
  }, [canvas, organizationName]); // Only run when canvas or organization changes
  
  // Auto-save canvas to organization folder when it changes significantly
  useEffect(() => {
    if (!canvas || !organizationName) return;
    
    // Save when canvas changes (historyStep increases)
    if (historyStep > 0 && lastSaveStepRef.current < historyStep) {
      // Clear any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Debounce auto-save (save 5 seconds after last change to avoid too many saves)
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await saveCanvasToOrganization(canvas, organizationName, 'editor');
          if (result.success) {
            lastSaveStepRef.current = historyStep;
            // Silent save - don't show toast for auto-saves to avoid spam
            console.log('Canvas auto-saved to organization folder');
          }
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 5000); // 5 second debounce
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [canvas, organizationName, historyStep]);
  
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
      <Navbar organizationName={organizationName} />
      {organizationName && (
        <OrganizationImageBar 
          organizationName={organizationName} 
          mode="editor"
          canvas={canvas}
          saveToHistory={saveToHistory}
          updateLayers={updateLayers}
        />
      )}
      <BoardTabs />
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar />
        <Canvas />
        <RightSidebar />
      </div>
      <QuickStartGuide />
    </div>
  );
};

const Editor = ({ organizationName }) => {
  return (
    <EditorProvider>
      <EditorContent organizationName={organizationName} />
    </EditorProvider>
  );
};

export default Editor;
