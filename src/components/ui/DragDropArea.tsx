import React from 'react';

interface DragDropAreaProps {
  isDragActive: boolean;
  children: React.ReactNode;
}

const DragDropArea: React.FC<DragDropAreaProps> = ({
  isDragActive,
  children,
}) => {
  return (
    <div className="relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-background p-6 text-center hover:bg-primary/5">
      {children}
      {isDragActive && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-primary/10">
          <p>Drop the files here ...</p>
        </div>
      )}
    </div>
  );
};

export default DragDropArea;
