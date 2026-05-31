export const exportToJSON = (data, filename = 'measurement.json') => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportHistoryToCSV = (historyItems, filename = 'measurements.csv') => {
  const items = Array.isArray(historyItems) ? historyItems : [historyItems];
  
  const headers = [
    'Date', 'Time', 'Vertices', 
    'Area (Sq Meters)', 'Area (Hectares)', 'Area (Sq Km)', 'Area (Acres)', 'Area (Sq Ft)', 'Area (Sq Yards)', 'Area (Kanal)', 'Area (Marla)',
    'Perimeter (m)', 'Perimeter (km)', 'Perimeter (ft)',
    'Coordinates'
  ];
  
  const rows = items.map(item => {
    const coordsStr = item.coords ? item.coords.map(c => `[${c.lng.toFixed(6)}, ${c.lat.toFixed(6)}]`).join(';') : '';
    
    return [
      item.date,
      item.time,
      item.vertexCount,
      item.areas.sqMeters,
      item.areas.ha,
      item.areas.sqKm,
      item.areas.acres,
      item.areas.sqFt,
      item.areas.sqYards,
      item.areas.kanal,
      item.areas.marla,
      item.perimeters.m,
      item.perimeters.km,
      item.perimeters.ft,
      `"${coordsStr}"`
    ].join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
