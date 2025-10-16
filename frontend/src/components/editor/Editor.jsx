import React from 'react';
import { EditorProvider } from '../../contexts/EditorContext';
import Navbar from './Navbar';
import LeftSidebar from './LeftSidebar';
import Canvas from './Canvas';
import RightSidebar from './RightSidebar';

const Editor = () => {
  return (
    <EditorProvider>
      <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <Canvas />
          <RightSidebar />
        </div>
      </div>
    </EditorProvider>
  );
};

export default Editor;
