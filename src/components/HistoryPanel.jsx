import React from 'react';
import { History, Download, Trash2, MapPin } from 'lucide-react';
import { exportToJSON, exportToCSV } from '../utils/exportUtils';
import { formatAreas } from '../utils/areaConversions';
import { useLanguage } from '../contexts/LanguageContext';

const HistoryPanel = ({ history, onClearHistory, onDeleteHistoryItem, onSelectMeasurement }) => {
  const { t } = useLanguage();

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center bg-surface border border-border rounded-xl border-dashed">
        <History className="w-8 h-8 text-muted/50 mb-3" />
        <p className="text-sm font-medium text-muted">{t('no_measurements')}</p>
        <p className="text-xs text-muted/70 mt-1">{t('draw_to_save')}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm flex flex-col overflow-hidden max-h-96">
      <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
        <div>
          <h3 className="font-semibold text-text text-sm">{t('history')}</h3>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
            {t('session_saved', { count: history.length })}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {history.map((item) => {
          const fAreas = formatAreas(item.areas);
          return (
            <div 
              key={item.id} 
              className="bg-background hover:bg-surface-soft p-3 rounded-lg border border-transparent hover:border-primary/20 cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-primary">ID: #{item.id.toString().slice(-4)}</span>
                <span className="text-[10px] text-muted font-bold tracking-tight uppercase">
                  {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-tight">{t('total_area')}</p>
                  <p className="font-medium text-sm text-text">{fAreas.sqMeters} m²</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-tight">{t('kanal')}/{t('marla')}</p>
                  <p className="font-medium text-sm text-secondary">{fAreas.kanal} {t('kanal')}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-muted mb-3">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[11px] font-mono">
                  {item.center[0].toFixed(4)}° N, {item.center[1].toFixed(4)}° E
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToJSON(item, `measurement-${item.id}.json`);
                  }}
                  className="flex-1 py-1.5 bg-surface text-primary text-[11px] font-bold rounded flex justify-center items-center gap-1 border border-primary/20 hover:bg-surface-soft transition-colors"
                >
                  <Download className="w-3 h-3" /> {t('json')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportToCSV(item.areas, item.perimeters, item.geojson.geometry.coordinates[0], `measurement-${item.id}.csv`);
                  }}
                  className="flex-1 py-1.5 bg-surface text-primary text-[11px] font-bold rounded flex justify-center items-center gap-1 border border-primary/20 hover:bg-surface-soft transition-colors"
                >
                  <Download className="w-3 h-3" /> {t('csv')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(onDeleteHistoryItem) onDeleteHistoryItem(item.id);
                  }}
                  className="p-1.5 text-danger hover:bg-danger/10 rounded border border-danger/20 transition-colors"
                  title="Delete Measurement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-border bg-background/50">
        <button
          onClick={onClearHistory}
          className="w-full flex items-center justify-center gap-2 text-danger hover:bg-danger/10 py-2 rounded-lg text-sm font-medium border border-danger/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t('clear_history')}
        </button>
      </div>
    </div>
  );
};

export default HistoryPanel;
