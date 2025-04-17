import React from 'react';
import { DragSourceMonitor, useDrag } from 'react-dnd';

interface DraggableProps {
  id: string;
  type: string;
  data?: Record<string, unknown>;
  children: React.ReactNode;
}

interface DraggableProps {
  id: string;
  type: string;
  data?: Record<string, unknown>;
  children: React.ReactNode;
}

import { useCallback } from 'react';

interface DraggableProps {
  id: string;
  type: string;
  data?: Record<string, unknown>;
  children: React.ReactNode;
}

const Draggable: React.FC<DraggableProps> = ({ id, type, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { id: id },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      drag(node);
    },
    [drag],
  );

  return (
    <div ref={setRef} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

export default Draggable;
