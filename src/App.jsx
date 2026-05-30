import React, { useState, useCallback, useRef, useEffect } from 'react';
import MapView from './components/MapView';
import AreaPanel from './components/AreaPanel';
import SearchBar from './components/SearchBar';
import { LAYERS } from './components/LayerSwitcher';
import HistoryPanel from './components/HistoryPanel';
import { useAreaCalculator } from './hooks/useAreaCalculator';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { Map, Menu, X, Edit3, Trash2, XCircle, PenTool, Sun, Moon, Check, X as CancelIcon } from 'lucide-react';

function App() {
  const { 
    polygon, 
    areas, 
    perimeters, 
    vertexCount, 
    calculatePolygonData, 
    clearPolygon 
  } = useAreaCalculator();

  const [searchedLocation, setSearchedLocation] = useState(null);
  const [currentLayer, setCurrentLayer] = useState(LAYERS.STANDARD);
  const [history, setHistory] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMode, setActiveMode] = useState(null); // 'draw', 'edit', 'delete'
  const [pointers, setPointers] = useState([]);
  const mapRef = useRef();

  const { t, language, setLanguage } = useLanguage();
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

  const handlePolygonCalculated = useCallback((geojson) => {
    const data = calculatePolygonData(geojson);
    if (data) {
      setHistory(prev => {
        // Prevent adding duplicate if it's just an edit update of the same polygon shape
        // In a real app we'd update the existing history item if we're in 'edit' mode.
        // For simplicity, we add new history on save or draw finish.
        const newHistory = [{ id: Date.now(), date: new Date().toISOString(), ...data }, ...prev];
        return newHistory.slice(0, 50);
      });
      if (activeMode === 'draw') {
        setMobileMenuOpen(true);
      }
    }
  }, [calculatePolygonData, activeMode]);

  const handleClearPolygon = useCallback(() => {
    clearPolygon();
  }, [clearPolygon]);

  const handleDeleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className={`flex h-screen w-full bg-background overflow-hidden relative text-text ${language === 'ur' ? 'font-urdu' : ''}`}>
      
      {/* Mobile Top Header */}
      <div className="lg:hidden absolute top-0 left-0 w-full z-[2000] bg-surface/90 backdrop-blur border-b border-border p-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-surface">
            <Map className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg text-primary tracking-tight">{t('app_title')}</h1>
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
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-surface shadow-sm">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-2xl text-primary tracking-tight leading-none">{t('app_title')}</h1>
              <p className="text-xs font-medium text-muted mt-1">{t('app_subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')} className="px-2 py-1 bg-surface-soft border border-border rounded text-xs font-bold hover:bg-background">
              {language === 'en' ? 'اردو' : 'EN'}
            </button>
            <button onClick={toggleTheme} className="p-1.5 bg-surface-soft border border-border rounded text-primary hover:bg-background">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Header Mobile Toolbar (Language/Theme) */}
        <div className="lg:hidden flex items-center justify-end gap-2 p-3 border-b border-border bg-surface">
          <button onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')} className="px-2 py-1 bg-surface-soft border border-border rounded text-xs font-bold hover:bg-background">
            {language === 'en' ? 'اردو' : 'EN'}
          </button>
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
                {activeMode === 'draw' && <><PenTool className="w-4 h-4"/> {t('active_draw')}</>}
                {activeMode === 'edit' && <><Edit3 className="w-4 h-4"/> {t('active_edit')}</>}
                {activeMode === 'delete' && <><Trash2 className="w-4 h-4"/> {t('active_delete')}</>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => mapRef.current?.save()} className="flex-1 flex items-center justify-center gap-1 py-2 bg-primary text-surface rounded-lg font-bold text-sm hover:brightness-110">
                  <Check className="w-4 h-4"/> {t('save')}
                </button>
                <button onClick={() => mapRef.current?.cancel()} className="flex-1 flex items-center justify-center gap-1 py-2 bg-surface text-text border border-border rounded-lg font-bold text-sm hover:bg-surface-soft">
                  <CancelIcon className="w-4 h-4"/> {t('cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Search Section */}
          <section className={activeMode ? 'opacity-50 pointer-events-none' : ''}>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">{t('location_search')}</p>
            <SearchBar 
              onLocationSelect={(loc) => {
                setSearchedLocation(loc);
                setMobileMenuOpen(false);
              }} 
              searchedLocation={searchedLocation}
            />
          </section>

          {/* Drawing Tools */}
          <section className={activeMode ? 'hidden' : 'block'}>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">{t('tools')}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { mapRef.current?.startDraw(); setMobileMenuOpen(false); }} className="flex items-center gap-2 p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors text-sm font-medium">
                <PenTool className="w-4 h-4" /> {t('draw_polygon')}
              </button>
              <button onClick={() => { mapRef.current?.startEdit(); setMobileMenuOpen(false); }} className="flex items-center gap-2 p-2 bg-surface hover:bg-surface-soft text-text rounded-lg border border-border transition-colors text-sm font-medium">
                <Edit3 className="w-4 h-4" /> {t('edit_polygon')}
              </button>
              <button onClick={() => { mapRef.current?.startDelete(); setMobileMenuOpen(false); }} className="flex items-center gap-2 p-2 bg-surface hover:bg-surface-soft text-text rounded-lg border border-border transition-colors text-sm font-medium">
                <Trash2 className="w-4 h-4 text-danger" /> {t('delete_polygon')}
              </button>
              <button onClick={() => mapRef.current?.clearAll()} className="flex items-center gap-2 p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg border border-danger/20 transition-colors text-sm font-medium">
                <XCircle className="w-4 h-4" /> {t('clear_polygon') || t('clear_all')}
              </button>
              <button onClick={() => setPointers([])} className="col-span-2 flex items-center justify-center gap-2 p-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-lg border border-danger/20 transition-colors text-sm font-medium">
                <Map className="w-4 h-4" /> {t('clear_pointers') || 'Clear All Pointers'}
              </button>
            </div>
          </section>

          {/* Area Results */}
          {polygon ? (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">{t('area_results')}</p>
              <AreaPanel 
                areas={areas}
                perimeters={perimeters}
                vertexCount={vertexCount}
              />
            </section>
          ) : (
            <section className={`bg-background rounded-xl p-6 text-center border border-border border-dashed ${activeMode ? 'opacity-50' : ''}`}>
              <p className="text-sm text-muted">{t('use_drawing_tools')}</p>
            </section>
          )}

          {/* History */}
          <section className={activeMode ? 'opacity-50 pointer-events-none' : ''}>
            <HistoryPanel 
              history={history} 
              onClearHistory={() => setHistory([])}
              onDeleteHistoryItem={handleDeleteHistoryItem}
              onSelectMeasurement={(item) => console.log('View', item)}
            />
          </section>
        </div>
      </aside>

      {/* Main Map Area */}
      <main className="flex-1 relative h-full ltr:lg:ml-[380px] rtl:lg:mr-[380px]">
        <MapView 
          ref={mapRef}
          onPolygonCalculated={handlePolygonCalculated}
          onClearPolygon={handleClearPolygon}
          searchedLocation={searchedLocation}
          setSearchedLocation={setSearchedLocation}
          currentLayer={currentLayer}
          onLayerChange={setCurrentLayer}
          onActiveModeChange={setActiveMode}
          pointers={pointers}
          setPointers={setPointers}
        />
      </main>

    </div>
  );
}

export default App;
