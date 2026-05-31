/**
 * Area conversion utilities
 * Base unit is square meters (from turf.area)
 */

export const formatMeasurement = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.000";
  }
  return Number(value).toFixed(3);
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
    sqMeters: formatMeasurement(areas.sqMeters),
    sqKm: formatMeasurement(areas.sqKm),
    ha: formatMeasurement(areas.ha),
    sqFt: formatMeasurement(areas.sqFt),
    sqYards: formatMeasurement(areas.sqYards),
    acres: formatMeasurement(areas.acres),
    marla: formatMeasurement(areas.marla),
    kanal: formatMeasurement(areas.kanal),
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
    m: formatMeasurement(perimeters.m),
    km: formatMeasurement(perimeters.km),
    ft: formatMeasurement(perimeters.ft)
  };
};
