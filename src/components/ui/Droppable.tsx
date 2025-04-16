import React from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';

interface DroppableProps {
  type: string;
  onDrop: (item: string) => void;
  children: React.ReactNode;
}

const Droppable: React.FC<DroppableProps> = ({ type, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: (item: string) => {
      onDrop(item);
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{ backgroundColor: isOver ? 'lightgreen' : 'white' }}
    >
      {children}
    </div>
  );
};

export default Droppable;
