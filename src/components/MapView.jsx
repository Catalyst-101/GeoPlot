import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, Polygon, DrawingManager } from '@react-google-maps/api';
import LayerSwitcher, { LAYERS } from './LayerSwitcher';
import { useLanguage } from '../contexts/LanguageContext';
import { Navigation2, Share2, Copy } from 'lucide-react';

const CustomLocateControl = ({ setSearchedLocation }) => {
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
    <div className="absolute top-[130px] md:top-24 right-4 md:right-6 z-[1000]">
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

const MapView = forwardRef(({ 
  polygons,
  selectedPolygonId,
  setSelectedPolygonId,
  onPolygonComplete,
  onPolygonEdit,
  searchedLocation,
  setSearchedLocation,
  currentLayer,
  onLayerChange,
  activeMode,
  pointers,
  setPointers
}, ref) => {
  const mapRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const polygonRefs = useRef({});
  const polygonListeners = useRef({});
  
  const { t, language } = useLanguage();
  const [center, setCenter] = useState({ lat: 30.3753, lng: 69.3451 });
  const [zoom, setZoom] = useState(6);
  const [mouseCoords, setMouseCoords] = useState(null);
  
  // Backup coords for cancel edit
  const [editBackupCoords, setEditBackupCoords] = useState(null);
  
  const pressTimer = useRef(null);
  const pressTimeout = 700;

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: currentLayer.id,
    gestureHandling: 'greedy',
    maxZoom: null, // Allow deep zoom
    minZoom: null
  };

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    // Cleanup listeners
    Object.values(polygonListeners.current).forEach(listeners => {
      listeners.forEach(l => window.google.maps.event.removeListener(l));
    });
    polygonListeners.current = {};
  }, []);

  useEffect(() => {
    if (searchedLocation && mapRef.current) {
      setCenter({ lat: searchedLocation.lat, lng: searchedLocation.lon });
      setZoom(16);
    }
  }, [searchedLocation]);

  useImperativeHandle(ref, () => ({
    startDraw: () => {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(window.google.maps.drawing.OverlayType.POLYGON);
      }
    },
    startEdit: (polygonId) => {
      const p = polygons.find(p => p.id === polygonId);
      if (p) {
        setEditBackupCoords([...p.coords]);
      }
    },
    save: () => {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
      setEditBackupCoords(null);
    },
    cancel: () => {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setDrawingMode(null);
      }
      if (activeMode === 'edit' && selectedPolygonId && editBackupCoords) {
        // Restore coordinates
        onPolygonEdit(selectedPolygonId, editBackupCoords);
      }
      setEditBackupCoords(null);
    }
  }));

  const handleDrawComplete = (polygon) => {
    const path = polygon.getPath().getArray();
    const coords = path.map(p => ({ lat: p.lat(), lng: p.lng() }));
    
    polygon.setMap(null); // remove google drawing polygon
    
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
    
    onPolygonComplete(coords);
  };

  const handlePolygonClick = (id) => {
    if (activeMode !== 'draw') {
      setSelectedPolygonId(id);
    }
  };

  const attachPolygonListeners = (polygonInstance, id) => {
    if (!polygonInstance) return;
    polygonRefs.current[id] = polygonInstance;
    
    // Clear old listeners if they exist
    if (polygonListeners.current[id]) {
      polygonListeners.current[id].forEach(l => window.google.maps.event.removeListener(l));
    }
    
    const path = polygonInstance.getPath();
    
    const updateHandler = () => {
      if (activeMode === 'edit' && selectedPolygonId === id) {
        const coords = path.getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
        onPolygonEdit(id, coords);
      }
    };

    const listeners = [
      path.addListener('set_at', updateHandler),
      path.addListener('insert_at', updateHandler),
      path.addListener('remove_at', updateHandler)
    ];
    
    polygonListeners.current[id] = listeners;
  };

  const handleMapMouseDown = (e) => {
    if (e.latLng && activeMode !== 'draw' && activeMode !== 'edit') {
      pressTimer.current = setTimeout(() => {
        setPointers(prev => [...prev, { id: Date.now(), lat: e.latLng.lat(), lng: e.latLng.lng() }]);
      }, pressTimeout);
    }
  };

  const handleMapMouseUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleMapMouseMove = (e) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (e.latLng) {
      setMouseCoords({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };
  
  const handleMapDrag = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const [activePointer, setActivePointer] = useState(null);

  const handleCopy = (lat, lng) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    alert(t('link_copied'));
  };

  const handleShare = (lat, lng) => {
    const url = `${window.location.origin}${window.location.pathname}?lat=${lat}&lng=${lng}`;
    if (navigator.share) {
      navigator.share({ title: 'Shared Location', url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert(t('link_copied'));
    }
  };

  return (
    <div className="w-full h-full relative bg-background">
      {language === 'ur' && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-surface/80 backdrop-blur px-3 py-1 text-[10px] text-muted rounded-full shadow-sm border border-border">
            Pakistan places show Urdu automatically on standard layer.
          </div>
        </div>
      )}

      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-[90%] max-w-[400px]">
         <div className="bg-amber-100/95 backdrop-blur border border-amber-300 text-amber-900 px-3 py-2 text-[10px] sm:text-xs rounded-lg shadow-md text-center font-medium">
           Map data may be outdated in some areas. Please verify important boundaries with local records or recent imagery.
         </div>
      </div>

      {!navigator.onLine && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-danger/90 text-white px-3 py-1 text-xs rounded-full shadow-sm">
            {t('offline_mode')}
          </div>
        </div>
      )}

      <GoogleMap
        mapContainerClassName="w-full h-full"
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onMouseDown={handleMapMouseDown}
        onMouseUp={handleMapMouseUp}
        onMouseMove={handleMapMouseMove}
        onDragStart={handleMapDrag}
      >
        <DrawingManager
          onLoad={(dm) => { drawingManagerRef.current = dm; }}
          onPolygonComplete={handleDrawComplete}
          options={{
            drawingMode: activeMode === 'draw' ? window.google.maps.drawing.OverlayType.POLYGON : null,
            drawingControl: false,
            polygonOptions: {
              fillColor: '#3B82F6',
              fillOpacity: 0.25,
              strokeWeight: 3,
              strokeColor: '#2563EB',
              clickable: false,
              editable: false,
              zIndex: 10
            }
          }}
        />

        {polygons.map(polygon => {
          const isSelected = selectedPolygonId === polygon.id;
          const isEditing = activeMode === 'edit' && isSelected;
          
          return (
            <Polygon
              key={polygon.id}
              onLoad={(instance) => attachPolygonListeners(instance, polygon.id)}
              paths={polygon.coords}
              onClick={() => handlePolygonClick(polygon.id)}
              options={{
                fillColor: isEditing ? '#3B82F6' : polygon.color,
                fillOpacity: 0.25,
                strokeColor: isEditing ? '#2563EB' : polygon.color,
                strokeOpacity: 1,
                strokeWeight: isSelected ? 4 : 3,
                editable: isEditing,
                draggable: isEditing,
                zIndex: isSelected ? 20 : 10
              }}
            />
          );
        })}

        {searchedLocation && (
          <Marker position={{ lat: searchedLocation.lat, lng: searchedLocation.lon }} zIndex={0} />
        )}

        {pointers.map(pointer => (
          <Marker 
            key={pointer.id} 
            position={{ lat: pointer.lat, lng: pointer.lng }}
            onClick={() => setActivePointer(pointer.id)}
            zIndex={0}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/pink-dot.png",
              scaledSize: window.google ? new window.google.maps.Size(42, 42) : null
            }}
          >
            {activePointer === pointer.id && (
               <InfoWindow onCloseClick={() => setActivePointer(null)}>
                 <div className="flex flex-col gap-2 min-w-[180px] p-1 bg-surface text-text">
                   <p className="text-xs font-bold font-mono text-center text-text border-b border-border pb-2">
                     {pointer.lat.toFixed(6)}, {pointer.lng.toFixed(6)}
                   </p>
                   <div className="grid grid-cols-2 gap-2 mt-1">
                     <button onClick={() => handleCopy(pointer.lat.toFixed(6), pointer.lng.toFixed(6))} className="flex items-center justify-center gap-1 bg-surface-soft border border-border py-2 px-1 rounded text-[10px] font-bold text-primary hover:bg-background transition-colors truncate">
                       <Copy className="w-3 h-3 shrink-0" /> <span className="truncate">{t('copy_coords')}</span>
                     </button>
                     <button onClick={() => handleShare(pointer.lat.toFixed(6), pointer.lng.toFixed(6))} className="flex items-center justify-center gap-1 bg-primary text-surface py-2 px-1 rounded text-[10px] font-bold hover:brightness-110 transition-colors truncate">
                       <Share2 className="w-3 h-3 shrink-0" /> <span className="truncate">{t('share')}</span>
                     </button>
                   </div>
                   <button onClick={() => {
                     setPointers(prev => prev.filter(p => p.id !== pointer.id));
                     setActivePointer(null);
                   }} className="w-full flex items-center justify-center gap-1 bg-danger/10 text-danger border border-danger/20 py-2 rounded text-[10px] font-bold hover:bg-danger/20 transition-colors mt-1">
                     {t('delete_pointer') || 'Delete'}
                   </button>
                 </div>
               </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      <CustomLocateControl setSearchedLocation={setSearchedLocation} />
      
      <LayerSwitcher 
        currentLayer={currentLayer} 
        onLayerChange={onLayerChange} 
      />

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
    </div>
  );
});

export default MapView;
