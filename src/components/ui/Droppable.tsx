import React from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';

interface DroppableProps {
  type: string;
  onDrop: (item: string) => void;
  children: React.ReactNode;
}

import { useCallback } from 'react';


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

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      drop(node);
    },
    [drop],
  );

  return (
    <div
      ref={setRef}
      style={{ backgroundColor: isOver ? 'lightgreen' : 'white' }}
    >
      {children}
    </div>
  );
};

export default Droppable;
