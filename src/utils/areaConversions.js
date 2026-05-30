/**
 * Area conversion utilities
 * Base unit is square meters (from turf.area)
 */

export const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const calculateAreas = (sqMeters) => {
  if (!sqMeters) {
    return {
      sqMeters: 0,
      sqKm: 0,
      ha: 0,
      sqFt: 0,
      sqYards: 0,
      acres: 0,
      marla: 0,
      kanal: 0,
    };
  }

  // Metric
  const sqKm = sqMeters / 1000000;
  const ha = sqMeters / 10000;

  // Imperial
  const sqFt = sqMeters * 10.7639;
  const sqYards = sqMeters * 1.19599;
  const acres = sqMeters / 4046.86;

  // Pakistan Land Units
  // 1 Marla = 272.25 sq ft
  // 20 Marla = 1 Kanal
  const marla = sqFt / 272.25;
  const kanal = marla / 20;

  return {
    sqMeters,
    sqKm,
    ha,
    sqFt,
    sqYards,
    acres,
    marla,
    kanal,
  };
};

export const formatAreas = (areas) => {
  return {
    sqMeters: formatNumber(areas.sqMeters),
    sqKm: formatNumber(areas.sqKm, 4),
    ha: formatNumber(areas.ha),
    sqFt: formatNumber(areas.sqFt),
    sqYards: formatNumber(areas.sqYards),
    acres: formatNumber(areas.acres),
    marla: formatNumber(areas.marla),
    kanal: formatNumber(areas.kanal),
  };
};

export const calculatePerimeter = (meters) => {
  if (!meters) return { m: 0, km: 0, ft: 0 };
  
  return {
    m: meters,
    km: meters / 1000,
    ft: meters * 3.28084
  };
};

export const formatPerimeter = (perimeters) => {
  return {
    m: formatNumber(perimeters.m),
    km: formatNumber(perimeters.km, 3),
    ft: formatNumber(perimeters.ft)
  };
};
