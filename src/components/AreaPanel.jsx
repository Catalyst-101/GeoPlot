import React from 'react';
import { formatAreas, formatPerimeter } from '../utils/areaConversions';
import { Triangle, Navigation } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const AreaPanel = ({ areas, perimeters, vertexCount }) => {
  const { t } = useLanguage();

  if (vertexCount < 3) return null;

  const formattedAreas = formatAreas(areas);
  const formattedPerimeter = formatPerimeter(perimeters);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Pakistan Units (Highlighted) */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">{t('pakistan_units')}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-2xl font-bold text-primary">{formattedAreas.kanal}</p>
            <p className="text-sm font-medium text-secondary">{t('kanal')}</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-primary">{formattedAreas.marla}</p>
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
            <span className="font-mono text-sm font-medium">{formattedAreas.sqMeters} m²</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
            <span className="text-sm text-text">{t('hectares')}</span>
            <span className="font-mono text-sm font-medium">{formattedAreas.ha} ha</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-text">{t('sq_km')}</span>
            <span className="font-mono text-sm font-medium">{formattedAreas.sqKm} km²</span>
          </div>
        </div>
      </div>

      {/* Imperial System */}
      <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">{t('imperial_system')}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline border-b border-border/50 pb-2">
            <span className="text-sm text-text font-medium">{t('acres')}</span>
            <span className="font-mono text-sm font-bold text-primary">{formattedAreas.acres} ac</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-text">{t('sq_ft')}</span>
            <span className="font-mono text-sm font-medium">{formattedAreas.sqFt} ft²</span>
          </div>
        </div>
      </div>

      {/* Geometry Details */}
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
              <p className="font-mono font-medium">{formattedPerimeter.m}m</p>
              <p className="text-[10px] text-muted font-bold uppercase tracking-wider">{t('perimeter')}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AreaPanel;
