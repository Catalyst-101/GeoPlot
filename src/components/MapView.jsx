import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

import LayerSwitcher, { LAYERS } from './LayerSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { Navigation2, Share2, Copy } from 'lucide-react';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Context Menu Marker for Sharing
const ContextMenuMarkers = ({ pointers, setPointers }) => {
  const { t } = useLanguage();
  const map = useMap();
  const pressTimer = useRef(null);

  // Handle long left click / touch
  useMapEvents({
    mousedown(e) {
      // Only trigger on left click (button 0). Leaflet maps touch to button 0 as well.
      if (e.originalEvent.button !== 0 && e.originalEvent.type !== 'touchstart') return;
      
      pressTimer.current = setTimeout(() => {
        setPointers([{ id: Date.now(), latlng: e.latlng }]);
      }, 700); // 700ms for long press
    },
    mouseup() {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    },
    mousemove() {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    }
  });

  const handleCopy = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    alert(t('link_copied'));
  };

  const handleShare = (lat, lng) => {
    const url = `${window.location.origin}${window.location.pathname}?lat=${lat}&lng=${lng}`;
    if (navigator.share) {
      navigator.share({
        title: 'Shared Location',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert(t('link_copied'));
    }
  };

  const handleDelete = (id) => {
    setPointers(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      {pointers.map(pointer => {
        const lat = pointer.latlng.lat.toFixed(6);
        const lng = pointer.latlng.lng.toFixed(6);
        return (
          <Marker key={pointer.id} position={pointer.latlng} icon={redIcon}>
            <Popup className="custom-popup">
              <div className="flex flex-col gap-2 min-w-[180px] p-1">
                <p className="text-xs font-bold font-mono text-center text-text border-b border-border pb-2">
                  {lat}, {lng}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => handleCopy(lat, lng)} className="flex items-center justify-center gap-1 bg-surface-soft border border-border py-2 px-1 rounded text-[10px] font-bold text-primary hover:bg-background transition-colors truncate">
                    <Copy className="w-3 h-3 shrink-0" /> <span className="truncate">{t('copy_coords')}</span>
                  </button>
                  <button onClick={() => handleShare(lat, lng)} className="flex items-center justify-center gap-1 bg-primary text-surface py-2 px-1 rounded text-[10px] font-bold hover:brightness-110 transition-colors truncate">
                    <Share2 className="w-3 h-3 shrink-0" /> <span className="truncate">{t('share')}</span>
                  </button>
                </div>
                <button onClick={() => handleDelete(pointer.id)} className="w-full flex items-center justify-center gap-1 bg-danger/10 text-danger border border-danger/20 py-2 rounded text-[10px] font-bold hover:bg-danger/20 transition-colors mt-1">
                  {t('delete_pointer') || 'Delete'}
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// Custom Locate Control using Geolocation API
const CustomLocateControl = ({ setSearchedLocation }) => {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const { t } = useLanguage();

  const handleLocate = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert(t('locate_me_error'));
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setSearchedLocation({ lat: latitude, lon: longitude, name: 'Current Location' });
      },
      (error) => {
        setIsLocating(false);
        alert(t('locate_me_error') + " " + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="absolute top-24 right-6 z-[1000]">
      <button
        className="w-[40px] h-[40px] bg-surface shadow-md rounded-lg flex items-center justify-center hover:bg-surface-soft transition-colors text-primary focus:outline-none border-2 border-transparent"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleLocate();
        }}
        title="Locate Me"
      >
        {isLocating ? (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <Navigation2 className="w-5 h-5 fill-primary" />
        )}
      </button>
    </div>
  );
};

// Component to handle Map drawing and controls
const MapControls = forwardRef(({ onPolygonCalculated, onClearPolygon, onActiveModeChange }, ref) => {
  const map = useMap();
  const drawControlRef = useRef(null);
  const featureGroupRef = useRef(new L.FeatureGroup());
  const [mouseCoords, setMouseCoords] = useState(null);
  const activeDrawHandler = useRef(null);
  const activeEditHandler = useRef(null);
  const activeDeleteHandler = useRef(null);
  const { t } = useLanguage();

  useImperativeHandle(ref, () => ({
    startDraw: () => {
      if (activeDrawHandler.current) return;
      const polygonDrawer = new L.Draw.Polygon(map, drawControlRef.current.options.draw.polygon);
      polygonDrawer.enable();
      activeDrawHandler.current = polygonDrawer;
      onActiveModeChange('draw');
    },
    startEdit: () => {
      if (activeEditHandler.current) return;
      const editHandler = new L.EditToolbar.Edit(map, {
        featureGroup: featureGroupRef.current,
      });
      editHandler.enable();
      activeEditHandler.current = editHandler;
      onActiveModeChange('edit');
    },
    startDelete: () => {
      if (activeDeleteHandler.current) return;
      const deleteHandler = new L.EditToolbar.Delete(map, {
        featureGroup: featureGroupRef.current,
      });
      deleteHandler.enable();
      activeDeleteHandler.current = deleteHandler;
      onActiveModeChange('delete');
    },
    save: () => {
      if (activeDrawHandler.current) {
        // Poly drawer handles its own finish mostly, but we can force it
        activeDrawHandler.current.completeShape();
        activeDrawHandler.current.disable();
        activeDrawHandler.current = null;
      }
      if (activeEditHandler.current) {
        activeEditHandler.current.save();
        activeEditHandler.current.disable();
        activeEditHandler.current = null;
      }
      if (activeDeleteHandler.current) {
        activeDeleteHandler.current.save();
        activeDeleteHandler.current.disable();
        activeDeleteHandler.current = null;
      }
      onActiveModeChange(null);
    },
    cancel: () => {
      if (activeDrawHandler.current) {
        activeDrawHandler.current.disable();
        activeDrawHandler.current = null;
      }
      if (activeEditHandler.current) {
        activeEditHandler.current.revertLayers();
        activeEditHandler.current.disable();
        activeEditHandler.current = null;
      }
      if (activeDeleteHandler.current) {
        activeDeleteHandler.current.revertLayers();
        activeDeleteHandler.current.disable();
        activeDeleteHandler.current = null;
      }
      onActiveModeChange(null);
    },
    clearAll: () => {
      featureGroupRef.current.clearLayers();
      onClearPolygon();
    }
  }));

  useEffect(() => {
    const featureGroup = featureGroupRef.current;
    map.addLayer(featureGroup);

    // Setup Draw Control (hide native UI in CSS)
    drawControlRef.current = new L.Control.Draw({
      edit: {
        featureGroup: featureGroup,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false,
          drawError: {
            color: '#ba1a1a', 
            message: '<strong>Error:</strong> shape edges cannot cross!'
          },
          shapeOptions: {
            color: '#2563EB', // Requested Blue
            fillColor: '#3B82F6', // Requested Blue
            fillOpacity: 0.25,
            weight: 3
          }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false
      }
    });

    const handleCreated = (e) => {
      featureGroup.clearLayers();
      const layer = e.layer;
      featureGroup.addLayer(layer);
      onPolygonCalculated(layer.toGeoJSON());
      onActiveModeChange(null);
      if (activeDrawHandler.current) {
        activeDrawHandler.current.disable();
        activeDrawHandler.current = null;
      }
    };

    const handleEdited = (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        onPolygonCalculated(layer.toGeoJSON());
      });
    };

    const handleEditVertex = (e) => {
      // e.poly contains the polygon being actively dragged
      const layers = e.poly ? [e.poly] : featureGroup.getLayers();
      if (layers.length > 0) {
        onPolygonCalculated(layers[0].toGeoJSON());
      }
    };

    const handleDeleted = () => {
      onClearPolygon();
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.EDITED, handleEdited);
    map.on(L.Draw.Event.EDITVERTEX, handleEditVertex); // Dynamic update on drag
    map.on(L.Draw.Event.DELETED, handleDeleted);

    // Mouse move event for coordinates
    const handleMouseMove = (e) => {
      setMouseCoords(e.latlng);
    };
    map.on('mousemove', handleMouseMove);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.off(L.Draw.Event.EDITED, handleEdited);
      map.off(L.Draw.Event.EDITVERTEX, handleEditVertex);
      map.off(L.Draw.Event.DELETED, handleDeleted);
      map.off('mousemove', handleMouseMove);
      map.removeLayer(featureGroup);
    };
  }, [map, onPolygonCalculated, onClearPolygon, onActiveModeChange]);

  return (
    <>
      {mouseCoords && (
        <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none">
          <div className="bg-surface/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-mono text-muted border border-border flex items-center gap-2">
            <span className="font-bold text-primary">{t('lat')}:</span>
            <span>{mouseCoords.lat.toFixed(4)}° N</span>
            <span className="w-px h-3 bg-border mx-1"></span>
            <span className="font-bold text-primary">{t('lng')}:</span>
            <span>{mouseCoords.lng.toFixed(4)}° E</span>
          </div>
        </div>
      )}
    </>
  );
});

// Component to handle Search FlyTo
const MapEffect = ({ searchedLocation }) => {
  const map = useMap();
  useEffect(() => {
    if (searchedLocation) {
      map.flyTo([searchedLocation.lat, searchedLocation.lon], 16);
    }
  }, [searchedLocation, map]);
  return null;
};

// Component to dynamically update Map Zoom Limits
const ZoomUpdater = ({ currentLayer }) => {
  const map = useMap();
  useEffect(() => {
    const newMaxZoom = currentLayer.maxZoom || 18;
    map.setMaxZoom(newMaxZoom);
    if (map.getZoom() > newMaxZoom) {
      map.setZoom(newMaxZoom);
    }
  }, [currentLayer, map]);
  return null;
};

// Main MapView Component
const MapView = forwardRef(({ 
  onPolygonCalculated, 
  onClearPolygon, 
  searchedLocation,
  setSearchedLocation,
  currentLayer,
  onLayerChange,
  onActiveModeChange,
  pointers,
  setPointers
}, ref) => {
  const center = [30.3753, 69.3451]; // Pakistan Coordinates
  const zoom = 6;
  const { t, language } = useLanguage();

  return (
    <div className="w-full h-full relative bg-background">
      {/* Map Text Language Disclaimer */}
      {language === 'ur' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-surface/80 backdrop-blur px-3 py-1 text-[10px] text-muted rounded-full shadow-sm border border-border">
            Map labels are native. Pakistan places show Urdu automatically on standard layer.
          </div>
        </div>
      )}

      {/* Offline Indicator */}
      {!navigator.onLine && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-danger/90 text-white px-3 py-1 text-xs rounded-full shadow-sm">
            {t('offline_mode')}
          </div>
        </div>
      )}

      {/* Dynamically bind maxZoom to currentLayer to prevent zooming into empty tiles */}
      <MapContainer 
        center={center} 
        zoom={zoom} 
        className="w-full h-full"
        zoomControl={false}
        maxZoom={currentLayer.maxZoom || 22}
      >
        <TileLayer
          attribution={currentLayer.attribution}
          url={currentLayer.url}
          maxZoom={currentLayer.maxZoom || 22}
          maxNativeZoom={currentLayer.maxNativeZoom || 19}
        />
        
        {/* Render Labels Overlay if available */}
        {currentLayer.overlayUrl && (
          <TileLayer
            url={currentLayer.overlayUrl}
            maxZoom={currentLayer.maxZoom || 22}
            maxNativeZoom={currentLayer.maxNativeZoom || 19}
          />
        )}

        <ZoomControl position="bottomright" />
        
        <CustomLocateControl setSearchedLocation={setSearchedLocation} />
        
        <MapControls 
          ref={ref}
          onPolygonCalculated={onPolygonCalculated}
          onClearPolygon={onClearPolygon}
          onActiveModeChange={onActiveModeChange}
        />
        
        <MapEffect searchedLocation={searchedLocation} />
        <ZoomUpdater currentLayer={currentLayer} />

        <ContextMenuMarkers pointers={pointers} setPointers={setPointers} />

        {searchedLocation && (
          <Marker position={[searchedLocation.lat, searchedLocation.lon]}>
            <Popup>{searchedLocation.name}</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Outdated Map Warning */}
      <div className="absolute top-4 right-20 z-[1000] pointer-events-none">
        <div className="bg-[#FEF3C7]/95 dark:bg-[#78350F]/95 backdrop-blur px-4 py-2 text-[11px] sm:text-xs text-[#92400E] dark:text-[#FEF3C7] rounded-lg shadow-md border border-[#FCD34D] dark:border-[#B45309] max-w-[280px] text-center font-medium">
          {t('outdated_map_warning') || 'Map data may be outdated in some areas. Please verify important boundaries with local records or recent imagery.'}
        </div>
      </div>

      <LayerSwitcher 
        currentLayer={currentLayer} 
        onLayerChange={onLayerChange} 
      />
    </div>
  );
});

export default MapView;
