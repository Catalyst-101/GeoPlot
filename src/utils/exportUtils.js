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

export const exportToCSV = (areas, perimeters, coordinates, filename = 'measurement.csv') => {
  const headers = ['Area (sq meters)', 'Perimeter (meters)', 'Marla', 'Kanal', 'Coordinates'];
  
  const coordsStr = coordinates.map(c => `[${c[1]}, ${c[0]}]`).join('; ');
  
  const row = [
    areas.sqMeters,
    perimeters.m,
    areas.marla,
    areas.kanal,
    `"${coordsStr}"` // Quote to handle commas inside
  ];
  
  const csvContent = [
    headers.join(','),
    row.join(',')
  ].join('\n');
  
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
