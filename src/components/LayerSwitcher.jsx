import React, { useState, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LAYERS = {
  STANDARD: {
    name: 'layer_standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 19
  },
  SATELLITE: {
    name: 'layer_satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxNativeZoom: 18,
    maxZoom: 18,
    overlayUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png' // Adds city/road labels over satellite
  },
  TERRAIN: {
    name: 'layer_terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    maxNativeZoom: 17,
    maxZoom: 17
  }
};

const LayerSwitcher = ({ currentLayer, onLayerChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
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
    <div className="absolute top-[80px] md:top-6 right-4 md:right-6 z-[2001]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-surface w-10 h-10 rounded-lg shadow-md flex items-center justify-center text-primary hover:bg-surface-soft transition-colors border-2 ${isOpen ? 'border-primary' : 'border-transparent'}`}
        title={t('map_layers')}
      >
        <Layers className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute top-0 right-14 bg-surface/95 backdrop-blur shadow-lg rounded-xl p-2 w-40 border border-border flex flex-col gap-1">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-2 pb-1 mb-1 border-b border-border">
            {t('map_layers')}
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
              {t(layer.name)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LayerSwitcher;
