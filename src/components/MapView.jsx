import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, Polygon } from '@react-google-maps/api';
import LayerSwitcher, { LAYERS } from './LayerSwitcher';
import { Navigation2, Share2, Copy } from 'lucide-react';

const CustomLocateControl = ({ setSearchedLocation, showToast }) => {
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      if (showToast) showToast('Geolocation denied.', 'error');
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
        if (showToast) showToast("Locate me error: " + error.message, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
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
  onPolygonEditComplete,
  searchedLocation,
  setSearchedLocation,
  currentLayer,
  onLayerChange,
  activeMode,
  pointers,
  setPointers,
  showToast
}, ref) => {
  const mapRef = useRef(null);
  
  const [center, setCenter] = useState({ lat: 30.3753, lng: 69.3451 });
  const [zoom, setZoom] = useState(6);
  const [mouseCoords, setMouseCoords] = useState(null);
  
  // Custom Drawing State
  const [drawCoords, setDrawCoords] = useState([]);
  const [editBackupCoords, setEditBackupCoords] = useState(null);
  const [activeMidpointDrag, setActiveMidpointDrag] = useState(null);
  
  const pressTimer = useRef(null);
  const pressTimeout = 700;

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeId: currentLayer.id,
    gestureHandling: 'greedy',
    maxZoom: null,
    minZoom: null,
    draggableCursor: activeMode === 'draw' ? 'crosshair' : 'grab',
  };

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (searchedLocation && mapRef.current) {
      mapRef.current.panTo({ lat: searchedLocation.lat, lng: searchedLocation.lon });
      mapRef.current.setZoom(16);
    }
  }, [searchedLocation]);

  useImperativeHandle(ref, () => ({
    startDraw: () => {
      setDrawCoords([]);
    },
    startEdit: (polygonId) => {
      const p = polygons.find(p => p.id === polygonId);
      if (p) setEditBackupCoords([...p.coords]);
    },
    save: () => {
      setEditBackupCoords(null);
      if (activeMode === 'draw' && drawCoords.length >= 3) {
        onPolygonComplete([...drawCoords]);
      } else if (activeMode === 'edit' && selectedPolygonId) {
        if (onPolygonEditComplete) {
          onPolygonEditComplete(selectedPolygonId);
        }
      }
      setDrawCoords([]);
    },
    cancel: () => {
      if (activeMode === 'edit' && selectedPolygonId && editBackupCoords) {
        onPolygonEdit(selectedPolygonId, editBackupCoords);
      }
      setDrawCoords([]);
      setEditBackupCoords(null);
    },
    panToPolygon: (coords) => {
      if (mapRef.current && coords && coords.length > 0) {
        // Calculate bounds
        const bounds = new window.google.maps.LatLngBounds();
        coords.forEach(c => bounds.extend(c));
        mapRef.current.fitBounds(bounds);
      }
    }
  }));

  const handleMapClick = (e) => {
    if (!e.latLng) return;
    
    if (activeMode === 'draw') {
      setDrawCoords(prev => [...prev, { lat: e.latLng.lat(), lng: e.latLng.lng() }]);
    } else if (activeMode !== 'edit') {
      setSelectedPolygonId(null); // Deselect if clicking empty space
    }
  };

  const handleDrawFinish = (e) => {
    if (e) e.domEvent.stopPropagation();
    if (drawCoords.length >= 3) {
      onPolygonComplete([...drawCoords]);
      setDrawCoords([]);
    }
  };

  const handlePolygonClick = (id) => {
    if (activeMode !== 'draw') {
      setSelectedPolygonId(id);
    }
  };

  const handleVertexDrag = (e, polyId, vertexIndex) => {
    const p = polygons.find(p => p.id === polyId);
    if (!p) return;
    const newCoords = [...p.coords];
    newCoords[vertexIndex] = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    onPolygonEdit(polyId, newCoords);
  };

  const handleVertexRightClick = (polyId, vertexIndex) => {
    const p = polygons.find(p => p.id === polyId);
    if (!p) return;
    if (p.coords.length <= 3) {
      if (showToast) showToast('A polygon must have at least 3 vertices.', 'error');
      return;
    }
    const newCoords = [...p.coords];
    newCoords.splice(vertexIndex, 1);
    onPolygonEdit(polyId, newCoords);
  };

  const handleMidpointClick = (e, polyId, insertIndex) => {
    const p = polygons.find(p => p.id === polyId);
    if (!p) return;
    const newCoords = [...p.coords];
    newCoords.splice(insertIndex, 0, { lat: e.latLng.lat(), lng: e.latLng.lng() });
    onPolygonEdit(polyId, newCoords);
  };

  const handleMidpointDragStart = (e, polyId, insertIndex) => {
    setActiveMidpointDrag({ polyId, insertIndex, lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  const handleMidpointDrag = (e) => {
    if (activeMidpointDrag) {
      setActiveMidpointDrag(prev => ({ ...prev, lat: e.latLng.lat(), lng: e.latLng.lng() }));
    }
  };

  const handleMidpointDragEnd = (e, polyId, insertIndex) => {
    const p = polygons.find(p => p.id === polyId);
    if (!p) {
      setActiveMidpointDrag(null);
      return;
    }
    const newCoords = [...p.coords];
    newCoords.splice(insertIndex, 0, { lat: e.latLng.lat(), lng: e.latLng.lng() });
    onPolygonEdit(polyId, newCoords);
    setActiveMidpointDrag(null);
  };

  const getMidpoints = (coords) => {
    if (!coords || coords.length < 3) return [];
    const midpoints = [];
    for (let i = 0; i < coords.length; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % coords.length];
      midpoints.push({
        lat: (p1.lat + p2.lat) / 2,
        lng: (p1.lng + p2.lng) / 2,
        index: i + 1
      });
    }
    return midpoints;
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

  // Custom SVG Markers
  const vertexIcon = window.google ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#FFFFFF',
    fillOpacity: 1,
    strokeColor: '#2563EB',
    strokeWeight: 2.5,
    scale: 6
  } : null;

  const midpointIcon = window.google ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: '#3B82F6',
    fillOpacity: 0.6,
    strokeColor: '#FFFFFF',
    strokeWeight: 1.5,
    scale: 4.5
  } : null;

  const handleSharePointer = (pointer) => {
    // Generate URL with lat and lng params
    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${pointer.lat}&lng=${pointer.lng}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Shared Map Location',
        text: `Check out this location on GeoPlot: ${pointer.lat.toFixed(6)}, ${pointer.lng.toFixed(6)}`,
        url: shareUrl,
      })
      .then(() => { if (showToast) showToast('Location shared successfully!', 'success') })
      .catch((error) => {
        // If user cancelled, don't show error
        if (error.name !== 'AbortError' && showToast) {
           showToast('Error sharing location.', 'error');
        }
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => { if (showToast) showToast('Link copied to clipboard!', 'success'); })
        .catch(() => { if (showToast) showToast('Failed to copy link.', 'error'); });
    }
  };

  return (
    <div className="w-full h-full relative bg-background">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none w-[90%] max-w-[400px]">
         <div className="bg-amber-100/95 backdrop-blur border border-amber-300 text-amber-900 px-3 py-2 text-[10px] sm:text-xs rounded-lg shadow-md text-center font-medium">
           Map data may be outdated in some areas. Please verify important boundaries with local records or recent imagery.
         </div>
      </div>

      {!navigator.onLine && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-danger/90 text-white px-3 py-1 text-xs rounded-full shadow-sm">
            Offline Mode
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
        onClick={handleMapClick}
        onMouseDown={handleMapMouseDown}
        onMouseUp={handleMapMouseUp}
        onMouseMove={handleMapMouseMove}
        onDragStart={handleMapDrag}
      >
        {/* Render Saved Polygons */}
        {polygons.map(polygon => {
          const isSelected = selectedPolygonId === polygon.id;
          const isEditing = activeMode === 'edit' && isSelected;
          
          return (
            <React.Fragment key={polygon.id}>
              <Polygon
                paths={(() => {
                  if (isEditing && activeMidpointDrag && activeMidpointDrag.polyId === polygon.id) {
                     const renderCoords = [...polygon.coords];
                     renderCoords.splice(activeMidpointDrag.insertIndex, 0, { lat: activeMidpointDrag.lat, lng: activeMidpointDrag.lng });
                     return renderCoords;
                  }
                  return polygon.coords;
                })()}
                onClick={() => handlePolygonClick(polygon.id)}
                options={{
                  fillColor: (isSelected || isEditing) ? '#3B82F6' : polygon.color,
                  fillOpacity: 0.25,
                  strokeColor: (isSelected || isEditing) ? '#2563EB' : polygon.color,
                  strokeOpacity: 1,
                  strokeWeight: isSelected ? 4 : 3,
                  editable: false, // Turn off native square handles entirely
                  clickable: activeMode !== 'draw',
                  zIndex: isSelected ? 20 : 10
                }}
              />
              
              {/* Custom Edit Markers */}
              {isEditing && polygon.coords.map((coord, i) => (
                <Marker
                  key={`v-${i}`}
                  position={coord}
                  draggable={true}
                  onDrag={(e) => handleVertexDrag(e, polygon.id, i)}
                  onRightClick={() => handleVertexRightClick(polygon.id, i)}
                  title="Right click to delete vertex"
                  icon={vertexIcon}
                  zIndex={30}
                />
              ))}

              {/* Custom Midpoint Markers */}
              {isEditing && getMidpoints(polygon.coords).map((mid, i) => (
                <Marker
                  key={`m-${i}`}
                  position={{ lat: mid.lat, lng: mid.lng }}
                  draggable={true}
                  onDragStart={(e) => handleMidpointDragStart(e, polygon.id, mid.index)}
                  onDrag={(e) => handleMidpointDrag(e)}
                  onDragEnd={(e) => handleMidpointDragEnd(e, polygon.id, mid.index)}
                  onClick={(e) => handleMidpointClick(e, polygon.id, mid.index)}
                  icon={midpointIcon}
                  title="Drag or click to add point"
                  zIndex={25}
                />
              ))}
            </React.Fragment>
          );
        })}

        {/* Render Live Drawing Preview */}
        {activeMode === 'draw' && drawCoords.length > 0 && (
          <>
            {/* Draw live transparent fill if we have mouseCoords */}
            <Polygon
              paths={mouseCoords ? [...drawCoords, mouseCoords] : drawCoords}
              options={{
                fillColor: '#3B82F6',
                fillOpacity: 0.25,
                strokeColor: '#2563EB',
                strokeOpacity: 1,
                strokeWeight: 3,
                clickable: false,
                zIndex: 40
              }}
            />
            {/* Draw circular vertices for points already placed */}
            {drawCoords.map((coord, i) => (
              <Marker
                key={`draw-v-${i}`}
                position={coord}
                icon={vertexIcon}
                zIndex={45}
                onClick={i === 0 ? handleDrawFinish : undefined}
                title={i === 0 ? "Click to finish polygon" : ""}
              />
            ))}
          </>
        )}

        {/* Markers and Pointers */}
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
                     <button onClick={() => { navigator.clipboard.writeText(`${pointer.lat}, ${pointer.lng}`).then(() => { if (showToast) showToast('Coordinates copied to clipboard!', 'success'); }); }} className="flex items-center justify-center gap-1 bg-surface-soft border border-border py-2 px-1 rounded text-[10px] font-bold text-primary hover:bg-background transition-colors truncate">
                       <Copy className="w-3 h-3 shrink-0" /> <span className="truncate">Copy Coords</span>
                     </button>
                     <button onClick={() => handleSharePointer(pointer)} className="flex items-center justify-center gap-1 bg-primary text-surface py-2 px-1 rounded text-[10px] font-bold hover:brightness-110 transition-colors truncate">
                       <Share2 className="w-3 h-3 shrink-0" /> <span className="truncate">Share</span>
                     </button>
                   </div>
                   <button onClick={() => {
                     setPointers(prev => prev.filter(p => p.id !== pointer.id));
                     setActivePointer(null);
                   }} className="w-full flex items-center justify-center gap-1 bg-danger/10 text-danger border border-danger/20 py-2 rounded text-[10px] font-bold hover:bg-danger/20 transition-colors mt-1">
                     Delete
                   </button>
                 </div>
               </InfoWindow>
            )}
          </Marker>
        ))}
      </GoogleMap>

      <CustomLocateControl setSearchedLocation={setSearchedLocation} showToast={showToast} />
      
      <LayerSwitcher 
        currentLayer={currentLayer} 
        onLayerChange={onLayerChange} 
      />

      {mouseCoords && (
        <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none">
          <div className="bg-surface/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-mono text-muted border border-border flex items-center gap-2">
            <span className="font-bold text-primary">Lat:</span>
            <span>{mouseCoords.lat.toFixed(4)}° N</span>
            <span className="w-px h-3 bg-border mx-1"></span>
            <span className="font-bold text-primary">Lng:</span>
            <span>{mouseCoords.lng.toFixed(4)}° E</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default MapView;
