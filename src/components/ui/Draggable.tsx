import React from 'react';
import { DragSourceMonitor, useDrag } from 'react-dnd';

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

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

export default Draggable;
