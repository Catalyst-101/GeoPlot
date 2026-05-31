import React, { useMemo } from 'react';
import { formatAreas, formatPerimeter } from '../utils/areaConversions';
import { Triangle, Navigation, Layers } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AreaPanel = ({ polygons, selectedPolygonId }) => {
  const { t } = useLanguage();

  const selectedPolygon = useMemo(() => {
    return polygons.find(p => p.id === selectedPolygonId) || null;
  }, [polygons, selectedPolygonId]);

  const totalArea = useMemo(() => {
    let sum = { sqMeters: 0, ha: 0, sqKm: 0, acres: 0, sqFt: 0, kanal: 0, marla: 0 };
    polygons.forEach(p => {
      // Remove commas before parsing if formatAreas adds commas
      const parseValue = (val) => parseFloat(String(val).replace(/,/g, '')) || 0;
      sum.sqMeters += parseValue(p.areas.sqMeters);
      sum.ha += parseValue(p.areas.ha);
      sum.sqKm += parseValue(p.areas.sqKm);
      sum.acres += parseValue(p.areas.acres);
      sum.sqFt += parseValue(p.areas.sqFt);
      sum.kanal += parseValue(p.areas.kanal);
      sum.marla += parseValue(p.areas.marla);
    });
    
    // Format the sums nicely
    const formatNumber = (num, decimals = 2) => num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    
    return {
      sqMeters: formatNumber(sum.sqMeters, 2),
      ha: formatNumber(sum.ha, 4),
      sqKm: formatNumber(sum.sqKm, 6),
      acres: formatNumber(sum.acres, 4),
      sqFt: formatNumber(sum.sqFt, 2),
      kanal: formatNumber(sum.kanal, 2),
      marla: formatNumber(sum.marla, 2)
    };
  }, [polygons]);

  if (polygons.length === 0) {
    return (
      <div className="bg-background rounded-xl p-6 text-center border border-border border-dashed">
        <p className="text-sm text-muted">{t('use_drawing_tools')}</p>
      </div>
    );
  }

  const renderAreaBlock = (areas, perimeters, vertexCount, isTotal = false) => {
    return (
      <div className="flex flex-col gap-4 w-full">
        {/* Pakistan Units (Highlighted) */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">{t('pakistan_units')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-2xl font-bold text-primary">{areas.kanal}</p>
              <p className="text-sm font-medium text-secondary">{t('kanal')}</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-primary">{areas.marla}</p>
              <p className="text-sm font-medium text-secondary">{t('marla')}</p>
            </div>
          </div>
        </div>

        {/* Metric System */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{t('metric_system')}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
              <span className="text-sm text-text">{t('sq_meters')}</span>
              <span className="font-mono text-sm font-medium">{areas.sqMeters} m²</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
              <span className="text-sm text-text">{t('hectares')}</span>
              <span className="font-mono text-sm font-medium">{areas.ha} ha</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-text">{t('sq_km')}</span>
              <span className="font-mono text-sm font-medium">{areas.sqKm} km²</span>
            </div>
          </div>
        </div>

        {/* Imperial System */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{t('imperial_system')}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
              <span className="text-sm text-text font-medium">{t('acres')}</span>
              <span className="font-mono text-sm font-bold text-primary">{areas.acres} ac</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-text">{t('sq_ft')}</span>
              <span className="font-mono text-sm font-medium">{areas.sqFt} ft²</span>
            </div>
          </div>
        </div>

        {/* Geometry Details (Hide for Total) */}
        {!isTotal && perimeters && (
          <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{t('geometry_details')}</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg text-primary">
                  <Triangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono font-medium">{vertexCount}</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('vertices')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-background rounded-lg text-primary">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono font-medium">{perimeters.m}m</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('perimeter')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {selectedPolygon ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedPolygon.color }}></div>
            <p className="text-sm font-bold text-text">Selected Polygon Area</p>
          </div>
          {renderAreaBlock(selectedPolygon.areas, selectedPolygon.perimeters, selectedPolygon.vertexCount)}
        </div>
      ) : (
        <div className="bg-surface-soft p-3 rounded-lg border border-border text-center text-sm text-muted">
          Click a polygon on the map to see its details.
        </div>
      )}

      {polygons.length > 1 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-text">Total Area ({polygons.length} Polygons)</p>
          </div>
          {renderAreaBlock(totalArea, null, null, true)}
        </div>
      )}
    </div>
  );
};

export default AreaPanel;
