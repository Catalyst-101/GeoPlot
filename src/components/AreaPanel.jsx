import React, { useMemo } from 'react';
import { Triangle, Navigation, Layers } from 'lucide-react';

const AreaPanel = ({ polygons, selectedPolygonId }) => {
  const selectedPolygon = useMemo(() => {
    return polygons.find(p => p.id === selectedPolygonId) || null;
  }, [polygons, selectedPolygonId]);

  const totalArea = useMemo(() => {
    let sum = { sqMeters: 0, ha: 0, sqKm: 0, acres: 0, sqFt: 0, kanal: 0, marla: 0 };
    polygons.forEach(p => {
      // Raw string might now be strictly "12.345" from formatMeasurement
      const parseValue = (val) => parseFloat(String(val)) || 0;
      sum.sqMeters += parseValue(p.areas.sqMeters);
      sum.ha += parseValue(p.areas.ha);
      sum.sqKm += parseValue(p.areas.sqKm);
      sum.acres += parseValue(p.areas.acres);
      sum.sqFt += parseValue(p.areas.sqFt);
      sum.kanal += parseValue(p.areas.kanal);
      sum.marla += parseValue(p.areas.marla);
    });
    
    // Format to 3 decimal places using the exact same standard logic
    const formatMeasurement = (value) => {
      if (value === null || value === undefined || isNaN(value)) return "0.000";
      return Number(value).toFixed(3);
    };
    
    return {
      sqMeters: formatMeasurement(sum.sqMeters),
      ha: formatMeasurement(sum.ha),
      sqKm: formatMeasurement(sum.sqKm),
      acres: formatMeasurement(sum.acres),
      sqFt: formatMeasurement(sum.sqFt),
      kanal: formatMeasurement(sum.kanal),
      marla: formatMeasurement(sum.marla)
    };
  }, [polygons]);

  if (polygons.length === 0) {
    return (
      <div className="bg-background rounded-xl p-6 text-center border border-border border-dashed">
        <p className="text-sm text-muted">Use drawing tools to measure area</p>
      </div>
    );
  }

  const renderAreaBlock = (areas, perimeters, vertexCount, isTotal = false) => {
    return (
      <div className="flex flex-col gap-4 w-full">
        {/* Pakistan Units (Highlighted) */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Pakistani Units</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="font-mono text-2xl font-bold text-primary truncate" title={areas.kanal}>{areas.kanal}</p>
              <p className="text-sm font-medium text-secondary truncate">Kanal</p>
            </div>
            <div className="min-w-0">
              <p className="font-mono text-2xl font-bold text-primary truncate" title={areas.marla}>{areas.marla}</p>
              <p className="text-sm font-medium text-secondary truncate">Marla</p>
            </div>
          </div>
        </div>

        {/* Metric System */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Metric System</p>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline border-b border-border/50 pb-2 gap-2 min-w-0">
              <span className="text-sm text-text whitespace-nowrap shrink-0">Sq Meters</span>
              <span className="font-mono text-sm font-medium truncate" title={`${areas.sqMeters} m²`}>{areas.sqMeters} m²</span>
            </div>
            <div className="flex justify-between items-baseline border-b border-border/50 pb-2 gap-2 min-w-0">
              <span className="text-sm text-text whitespace-nowrap shrink-0">Hectares</span>
              <span className="font-mono text-sm font-medium truncate" title={`${areas.ha} ha`}>{areas.ha} ha</span>
            </div>
            <div className="flex justify-between items-baseline gap-2 min-w-0">
              <span className="text-sm text-text whitespace-nowrap shrink-0">Sq Km</span>
              <span className="font-mono text-sm font-medium truncate" title={`${areas.sqKm} km²`}>{areas.sqKm} km²</span>
            </div>
          </div>
        </div>

        {/* Imperial System */}
        <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Imperial System</p>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline border-b border-border/50 pb-2 gap-2 min-w-0">
              <span className="text-sm text-text font-medium whitespace-nowrap shrink-0">Acres</span>
              <span className="font-mono text-sm font-bold text-primary truncate" title={`${areas.acres} ac`}>{areas.acres} ac</span>
            </div>
            <div className="flex justify-between items-baseline gap-2 min-w-0">
              <span className="text-sm text-text whitespace-nowrap shrink-0">Sq Feet</span>
              <span className="font-mono text-sm font-medium truncate" title={`${areas.sqFt} ft²`}>{areas.sqFt} ft²</span>
            </div>
          </div>
        </div>

        {/* Geometry Details (Hide for Total) */}
        {!isTotal && perimeters && (
          <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Geometry Details</p>
            <div className="flex gap-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-background rounded-lg text-primary shrink-0">
                  <Triangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-medium truncate" title={vertexCount}>{vertexCount}</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider truncate">Vertices</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-background rounded-lg text-primary shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-mono font-medium truncate" title={`${perimeters.m}m`}>{perimeters.m}m</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider truncate">Perimeter</p>
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
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedPolygon.color }}></div>
            <p className="text-sm font-bold text-text truncate">Selected Polygon Area</p>
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
            <Layers className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-bold text-text truncate">Total Area ({polygons.length} Polygons)</p>
          </div>
          {renderAreaBlock(totalArea, null, null, true)}
        </div>
      )}
    </div>
  );
};

export default AreaPanel;
