import React, { useState } from 'react';
import { History, Trash2, Maximize2, Download, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { exportToJSON, exportHistoryToCSV } from '../utils/exportUtils';

const HistoryPanel = ({ history, onClearHistory, onDeleteHistoryItem, onSelectMeasurement }) => {
  const [expandedItemId, setExpandedItemId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedItemId(prev => prev === id ? null : id);
  };

  const handleExportJSON = (item) => {
    exportToJSON(item, `measurement-${item.id}.json`);
  };

  const handleExportCSV = (item) => {
    exportHistoryToCSV(item, `measurement-${item.id}.csv`);
  };

  const handleExportAllJSON = () => {
    exportToJSON(history, 'all-measurements.json');
  };

  const handleExportAllCSV = () => {
    exportHistoryToCSV(history, 'all-measurements.csv');
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex flex-col gap-3 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <History className="w-4 h-4" />
            <h3 className="text-sm font-bold">Measurement History</h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] text-danger hover:text-danger/80 font-bold uppercase tracking-wider transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
        
        {history.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={handleExportAllJSON}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-surface text-text rounded border border-border text-xs font-medium hover:bg-surface-soft transition-colors"
            >
              <Download className="w-3 h-3" /> All JSON
            </button>
            <button 
              onClick={handleExportAllCSV}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-surface text-text rounded border border-border text-xs font-medium hover:bg-surface-soft transition-colors"
            >
              <Download className="w-3 h-3" /> All CSV
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p className="text-sm">No measurements yet</p>
            <p className="text-[10px] mt-1">Draw a polygon to save history</p>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {history.map((item) => {
              const isExpanded = expandedItemId === item.id;
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-surface border ${isExpanded ? 'border-primary' : 'border-border'} rounded-lg p-3 hover:border-primary/50 transition-colors group relative`}
                >
                  <div className="flex justify-between items-start mb-2 pr-6 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                    <span className="text-xs font-medium text-text">{item.date}</span>
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <span>{item.time}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </div>
                  </div>
                  
                  {!isExpanded ? (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-[10px] text-muted uppercase tracking-wider">Kanal/Marla</p>
                        <p className="font-mono text-sm font-bold text-primary truncate" title={`${item.areas?.kanal || '0.000'}K ${item.areas?.marla || '0.000'}M`}>
                          {item.areas?.kanal || '0.000'}K {item.areas?.marla || '0.000'}M
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted uppercase tracking-wider">Acres</p>
                        <p className="font-mono text-sm font-medium truncate" title={`${item.areas?.acres || '0.000'} ac`}>{item.areas?.acres || '0.000'} ac</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 space-y-3">
                      <div className="bg-primary/5 p-2 rounded border border-primary/10">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Pakistani Units</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-bold text-primary truncate" title={item.areas?.kanal || '0.000'}>{item.areas?.kanal || '0.000'}</p>
                            <p className="text-[10px] text-muted">Kanal</p>
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-bold text-primary truncate" title={item.areas?.marla || '0.000'}>{item.areas?.marla || '0.000'}</p>
                            <p className="text-[10px] text-muted">Marla</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface-soft p-2 rounded border border-border">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Metric System</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <span className="text-muted">Sq Meters</span><span className="font-mono text-text text-right truncate" title={item.areas?.sqMeters || '0.000'}>{item.areas?.sqMeters || '0.000'}</span>
                          <span className="text-muted">Hectares</span><span className="font-mono text-text text-right truncate" title={item.areas?.ha || '0.000'}>{item.areas?.ha || '0.000'}</span>
                          <span className="text-muted">Sq Km</span><span className="font-mono text-text text-right truncate" title={item.areas?.sqKm || '0.000'}>{item.areas?.sqKm || '0.000'}</span>
                        </div>
                      </div>

                      <div className="bg-surface-soft p-2 rounded border border-border">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Imperial System</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <span className="text-muted">Acres</span><span className="font-mono text-text text-right truncate" title={item.areas?.acres || '0.000'}>{item.areas?.acres || '0.000'}</span>
                          <span className="text-muted">Sq Feet</span><span className="font-mono text-text text-right truncate" title={item.areas?.sqFt || '0.000'}>{item.areas?.sqFt || '0.000'}</span>
                          <span className="text-muted">Sq Yards</span><span className="font-mono text-text text-right truncate" title={item.areas?.sqYards || '0.000'}>{item.areas?.sqYards || '0.000'}</span>
                        </div>
                      </div>

                      <div className="bg-surface-soft p-2 rounded border border-border">
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Geometry</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <span className="text-muted">Perimeter (m)</span><span className="font-mono text-text text-right truncate" title={item.perimeters?.m || '0.000'}>{item.perimeters?.m || '0.000'}</span>
                          <span className="text-muted">Perimeter (ft)</span><span className="font-mono text-text text-right truncate" title={item.perimeters?.ft || '0.000'}>{item.perimeters?.ft || '0.000'}</span>
                          <span className="text-muted">Perimeter (km)</span><span className="font-mono text-text text-right truncate" title={item.perimeters?.km || '0.000'}>{item.perimeters?.km || '0.000'}</span>
                          <span className="text-muted mt-1">Vertices</span><span className="font-mono text-text text-right mt-1">{item.vertexCount || 0}</span>
                        </div>
                        {item.coords && item.coords.length > 0 && (
                           <div className="mt-2 pt-2 border-t border-border/50">
                             <p className="text-[10px] text-muted mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Points</p>
                             <div className="max-h-20 overflow-y-auto custom-scrollbar text-[10px] font-mono text-muted space-y-1">
                               {item.coords.map((c, i) => (
                                 <div key={i} className="flex gap-2">
                                   <span className="w-4">{i + 1}.</span>
                                   <span>{c.lat.toFixed(6)}, {c.lng.toFixed(6)}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExportJSON(item); }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-background text-text rounded border border-border text-[10px] font-medium hover:bg-surface-soft transition-colors"
                        >
                          <Download className="w-3 h-3" /> JSON
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExportCSV(item); }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-background text-text rounded border border-border text-[10px] font-medium hover:bg-surface-soft transition-colors"
                        >
                          <Download className="w-3 h-3" /> CSV
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         onSelectMeasurement(item);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/10 text-primary rounded border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" /> View on Map
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistoryItem(item.id);
                      }}
                      className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;
