import React, { useState, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';

export const LAYERS = {
  STANDARD: {
    name: 'Standard',
    id: 'roadmap'
  },
  SATELLITE: {
    name: 'Satellite',
    id: 'satellite'
  },
  TERRAIN: {
    name: 'Terrain',
    id: 'terrain'
  },
  HYBRID: {
    name: 'Hybrid',
    id: 'hybrid'
  }
};

const LayerSwitcher = ({ currentLayer, onLayerChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="absolute top-[80px] lg:top-6 right-4 lg:right-6 z-[1010]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-surface w-10 h-10 rounded-lg shadow-md flex items-center justify-center text-primary hover:bg-surface-soft transition-colors border-2 ${isOpen ? 'border-primary' : 'border-transparent'}`}
        title="Map Layers"
      >
        <Layers className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-0 right-14 bg-surface/95 backdrop-blur shadow-lg rounded-xl p-2 w-40 border border-border flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 pb-1 mb-1 border-b border-border">
            Map Layers
          </p>
          {Object.entries(LAYERS).map(([key, layer]) => (
            <button
              key={key}
              onClick={() => {
                onLayerChange(layer);
                setIsOpen(false);
              }}
              className={`text-left rtl:text-right px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
                currentLayer.name === layer.name
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-text hover:bg-surface-soft border border-transparent'
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerSwitcher;
