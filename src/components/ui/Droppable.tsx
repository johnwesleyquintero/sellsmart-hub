import React from 'react';
import { useDrop } from 'react-dnd';

interface DroppableProps {
  type: string;
  onDrop: (item: any) => void;
  children: React.ReactNode;
}

const Droppable: React.FC<DroppableProps> = ({ type, onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: type,
    drop: (item: any) => onDrop(item),
    collect: (monitor) => ({
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
