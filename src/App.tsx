/**
 * Main App component - layout wrapper
 */

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { Canvas, Sidebar, PropertiesPanel, Toolbar } from './components';

const App: React.FC = () => {
  return (
    <ReactFlowProvider>
      <div className="w-screen h-screen flex flex-col overflow-hidden">
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 relative">
            <Canvas />
          </div>
          <PropertiesPanel />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default App;
