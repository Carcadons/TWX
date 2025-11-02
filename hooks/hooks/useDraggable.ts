import { useState, useEffect, useRef, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DraggableOptions {
  storageKey: string;
  defaultPosition: Position;
}

export function useDraggable({ storageKey, defaultPosition }: DraggableOptions) {
  const [position, setPosition] = useState<Position>(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const elementStart = useRef<Position>({ x: 0, y: 0 });

  // Load position from localStorage on mount and clamp to viewport
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Clamp to current viewport bounds
          const maxX = window.innerWidth - 400; // Assume min panel width
          const maxY = window.innerHeight - 200; // Assume min panel height
          setPosition({
            x: Math.max(0, Math.min(parsed.x, maxX)),
            y: Math.max(0, Math.min(parsed.y, maxY))
          });
        } catch (e) {
          console.error('Failed to parse saved position:', e);
        }
      }
    }
  }, [storageKey]);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(position));
    }
  }, [position, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the header
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { ...position };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    const newX = elementStart.current.x + deltaX;
    const newY = elementStart.current.y + deltaY;

    // Constrain to viewport
    const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 0);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Clamp position when window resizes to keep panel visible
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - (dragRef.current?.offsetWidth || 400);
        const maxY = window.innerHeight - (dragRef.current?.offsetHeight || 200);
        return {
          x: Math.max(0, Math.min(prev.x, maxX)),
          y: Math.max(0, Math.min(prev.y, maxY))
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetPosition = useCallback(() => {
    setPosition(defaultPosition);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [defaultPosition, storageKey]);

  return {
    position,
    isDragging,
    dragRef,
    handleMouseDown,
    resetPosition
  };
}
