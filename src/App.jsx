import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places', 'geometry', 'drawing'];

import MapView from './components/MapView';
import AreaPanel from './components/AreaPanel';
import SearchBar from './components/SearchBar';
import { LAYERS } from './components/LayerSwitcher';
import HistoryPanel from './components/HistoryPanel';
import { useAreaCalculator } from './hooks/useAreaCalculator';
import { useTheme } from './contexts/ThemeContext';
import { Map, Menu, Edit3, Trash2, XCircle, PenTool, Sun, Moon, Check, X as CancelIcon, Info } from 'lucide-react';
import logoDark from './assets/images/logo-dark.png';
import logoLight from './assets/images/logo-light.png';

function App() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    polygons,
    addPolygon,
    updatePolygon,
    removePolygon,
    clearPolygons,
    setPolygons
  } = useAreaCalculator();

  const [searchedLocation, setSearchedLocation] = useState(null);
  const [currentLayer, setCurrentLayer] = useState(LAYERS.STANDARD);
  const [history, setHistory] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'draw', 'edit'
  const [pointers, setPointers] = useState([]);
  const [selectedPolygonId, setSelectedPolygonId] = useState(null);
  const [toast, setToast] = useState(null);
  const mapRef = useRef();

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Read from URL on mount for shared location
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (lat && lng) {
      setSearchedLocation({ lat: parseFloat(lat), lon: parseFloat(lng), name: 'Shared Location' });
    }
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handlePolygonComplete = useCallback((coords) => {
    const newPoly = addPolygon(coords);
    if (!newPoly) {
      showToast('Invalid polygon. Need at least 3 points.', 'error');
    } else {
      showToast('Polygon created successfully.', 'success');
      
      const now = new Date();
      setHistory(prev => [{
        id: newPoly.id,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        areas: newPoly.areas,
        perimeters: newPoly.perimeters,
        vertexCount: newPoly.vertexCount,
        coords: newPoly.coords
      }, ...prev]);
    }
    setActiveMode(null);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }, [addPolygon, showToast, mobileMenuOpen]);

  const handlePolygonEdit = useCallback((id, coords) => {
    updatePolygon(id, coords);
  }, [updatePolygon]);

  const handlePolygonEditComplete = useCallback((id) => {
    const p = polygons.find(poly => poly.id === id);
    if (!p) return;
    const now = new Date();
    setHistory(prev => [{
      id: p.id + '-' + Date.now(), // Unique ID so it's a separate history entry
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      areas: p.areas,
      perimeters: p.perimeters,
      vertexCount: p.vertexCount,
      coords: p.coords
    }, ...prev]);
    showToast('Edit saved to history.', 'success');
  }, [polygons, showToast]);

  const handleClearAllPolygons = useCallback(() => {
    clearPolygons();
    setSelectedPolygonId(null);
    showToast('All polygons cleared.', 'info');
  }, [clearPolygons, showToast]);

  const handleDeleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleSelectMeasurement = (item) => {
    if (!polygons.some(p => p.id === item.id)) {
      setPolygons(prev => [...prev, {
        id: item.id,
        color: '#3B82F6',
        coords: item.coords,
        areas: item.areas,
        perimeters: item.perimeters,
        vertexCount: item.vertexCount,
      }]);
    }
    
    setSelectedPolygonId(item.id);
    if (item.coords && item.coords.length > 0) {
      mapRef.current?.panToPolygon(item.coords);
    }
    setMobileMenuOpen(false);
  };

  const startDraw = () => {
    setActiveMode('draw');
    setSelectedPolygonId(null);
    mapRef.current?.startDraw();
    setMobileMenuOpen(false);
  };

  const startEdit = () => {
    if (!selectedPolygonId) {
      showToast('Please select a polygon to edit first.', 'error');
      return;
    }
    setActiveMode('edit');
    mapRef.current?.startEdit(selectedPolygonId);
    setMobileMenuOpen(false);
  };

  const deleteSelected = () => {
    if (!selectedPolygonId) {
      showToast('Please select a polygon to delete first.', 'error');
      return;
    }
    removePolygon(selectedPolygonId);
    setSelectedPolygonId(null);
    showToast('Polygon deleted.', 'success');
    setMobileMenuOpen(false);
  };

  if (loadError) return <div className="flex h-screen items-center justify-center bg-background text-danger font-bold text-xl">Error loading Google Maps API</div>;
  if (!isLoaded) return <div className="flex h-screen items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative text-text">

      {/* Toast Notification */}
      {toast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[3000] animate-in fade-in slide-in-from-top-4">
          <div className={`px-4 py-2 rounded-full shadow-lg border flex items-center gap-2 text-sm font-bold backdrop-blur-md ${
            toast.type === 'error' ? 'bg-danger/90 border-danger text-white' : 
            toast.type === 'success' ? 'bg-primary/90 border-primary text-white' : 
            'bg-surface/90 border-border text-text'
          }`}>
            <Info className="w-4 h-4" />
            {toast.msg}
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="lg:hidden absolute top-0 left-0 w-full z-[2000] bg-surface/90 backdrop-blur border-b border-border p-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="GeoPlot Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <h1 className="font-bold text-lg text-primary tracking-tight">GeoPlot</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-background rounded-md text-primary"
        >
          {mobileMenuOpen ? <CancelIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 ltr:left-0 rtl:right-0 z-[2000] lg:z-[1000] w-full lg:w-[380px] bg-surface shadow-panel border-border transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-y-0 lg:translate-y-0 top-[60px] lg:top-0 h-[calc(100vh-60px)] lg:h-full' : 'translate-y-full lg:translate-y-0 ltr:lg:translate-x-0 rtl:lg:translate-x-0 ltr:-translate-x-full rtl:translate-x-full'}
        ltr:border-r rtl:border-l
      `}>
        {/* Header Desktop */}
        <div className="hidden lg:flex items-center justify-between p-6 border-b border-border/50 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={theme === 'dark' ? logoDark : logoLight} alt="GeoPlot Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div>
              <h1 className="font-black text-2xl text-primary tracking-tight leading-none">GeoPlot</h1>
              <p className="text-xs font-medium text-muted mt-1">Precision Measurement</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="p-1.5 bg-surface-soft border border-border rounded text-primary hover:bg-background">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Header Mobile Toolbar (Theme) */}
        <div className="lg:hidden flex items-center justify-end gap-2 p-3 border-b border-border bg-surface">
          <button onClick={toggleTheme} className="p-1.5 bg-surface-soft border border-border rounded text-primary hover:bg-background">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 pb-20 lg:pb-5">

          {/* Active Mode Banner & Save/Cancel Controls */}
          {activeMode && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-primary font-bold mb-3">
                {activeMode === 'draw' && <><PenTool className="w-4 h-4" /> Drawing Active</>}
                {activeMode === 'edit' && <><Edit3 className="w-4 h-4" /> Editing Active</>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { mapRef.current?.save(); setActiveMode(null); }} className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-surface rounded-lg font-bold text-sm hover:brightness-110">
                  <Check className="w-4 h-4" /> Save
                </button>
                <button onClick={() => { mapRef.current?.cancel(); setActiveMode(null); showToast(`Polygon ${activeMode} cancelled.`, 'info'); }} className="flex-1 flex items-center justify-center gap-1 py-2 bg-surface text-text border border-border rounded-lg font-bold text-sm hover:bg-surface-soft">
                  <CancelIcon className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Search Section */}
          <section className={activeMode ? 'opacity-50 pointer-events-none' : ''}>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Location Search</p>
            <SearchBar
              onLocationSelect={(loc) => {
                setSearchedLocation(loc);
                setMobileMenuOpen(false);
              }}
              searchedLocation={searchedLocation}
              showToast={showToast}
            />
          </section>

          {/* Drawing Tools */}
          <section className={activeMode ? 'hidden' : 'block'}>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Tools</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={startDraw} className="flex items-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors text-sm font-medium">
                <PenTool className="w-4 h-4" /> Draw Shape
              </button>
              <button onClick={startEdit} className="flex items-center gap-2 p-2 bg-surface hover:bg-surface-soft text-text rounded-lg border border-border transition-colors text-sm font-medium">
                <Edit3 className="w-4 h-4" /> Edit Shape
              </button>
              <button onClick={deleteSelected} className="flex items-center gap-2 p-2 bg-surface hover:bg-surface-soft text-text rounded-lg border border-border transition-colors text-sm font-medium">
                <Trash2 className="w-4 h-4 text-danger" /> Delete Selected
              </button>
              <button onClick={handleClearAllPolygons} className="flex items-center gap-2 p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg border border-danger/20 transition-colors text-sm font-medium">
                <XCircle className="w-4 h-4" /> Clear All
              </button>
              <button onClick={() => { setPointers([]); setSearchedLocation(null); }} className="col-span-2 flex items-center justify-center gap-2 p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg border border-danger/20 transition-colors text-sm font-medium">
                <Map className="w-4 h-4" /> Clear All Pointers
              </button>
            </div>
          </section>

          {/* Area Results */}
          <section className={`animate-in fade-in duration-500 ${activeMode ? 'opacity-50' : ''}`}>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Area Results</p>
            <AreaPanel
              polygons={polygons}
              selectedPolygonId={selectedPolygonId}
            />
          </section>

          {/* History */}
          <section className={activeMode ? 'opacity-50 pointer-events-none' : ''}>
            <HistoryPanel
              history={history}
              onClearHistory={() => setHistory([])}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onSelectMeasurement={handleSelectMeasurement}
            />
          </section>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative h-full ltr:lg:ml-[380px] rtl:lg:mr-[380px]">
        <MapView
          ref={mapRef}
          polygons={polygons}
          selectedPolygonId={selectedPolygonId}
          setSelectedPolygonId={setSelectedPolygonId}
          onPolygonComplete={handlePolygonComplete}
          onPolygonEdit={handlePolygonEdit}
          onPolygonEditComplete={handlePolygonEditComplete}
          searchedLocation={searchedLocation}
          setSearchedLocation={setSearchedLocation}
          currentLayer={currentLayer}
          onLayerChange={setCurrentLayer}
          pointers={pointers}
          setPointers={setPointers}
          activeMode={activeMode}
          showToast={showToast}
        />
      </main>

    </div>
  );
}

export default App;
