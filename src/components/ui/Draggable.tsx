import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableProps {
  id: string;
  type: string;
  children: React.ReactNode;
}

const Draggable: React.FC<DraggableProps> = ({ id, type, children }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: type,
    item: { id: id },
    collect: (monitor) => ({
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
