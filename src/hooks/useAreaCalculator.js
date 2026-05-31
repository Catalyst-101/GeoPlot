import { useState, useCallback } from 'react';
import * as turf from '@turf/turf';
import { calculateAreas, calculatePerimeter } from '../utils/areaConversions';

const POLYGON_COLORS = [
  "#2563EB", // Blue
  "#16A34A", // Green
  "#DC2626", // Red
  "#9333EA", // Purple
  "#EA580C", // Orange
  "#0891B2", // Cyan
  "#BE123C", // Rose
  "#4F46E5"  // Indigo
];

export const useAreaCalculator = () => {
  const [polygons, setPolygons] = useState([]);

  const calculateData = useCallback((coordsArray) => {
    if (!coordsArray || coordsArray.length < 3) {
      return null;
    }

    try {
      const closedCoords = [...coordsArray];
      if (
        closedCoords[0].lat !== closedCoords[closedCoords.length - 1].lat ||
        closedCoords[0].lng !== closedCoords[closedCoords.length - 1].lng
      ) {
        closedCoords.push(closedCoords[0]);
      }

      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [closedCoords.map(c => [c.lng, c.lat])]
        }
      };

      const turfPolygon = turf.polygon(geojson.geometry.coordinates);
      const areaSqMeters = turf.area(turfPolygon);
      const calculatedAreas = calculateAreas(areaSqMeters);
      
      const line = turf.polygonToLine(turfPolygon);
      const perimeterMeters = turf.length(line, { units: 'meters' });
      const calculatedPerimeters = calculatePerimeter(perimeterMeters);

      const vertexCount = closedCoords.length - 1;

      return {
        geojson,
        areas: calculatedAreas,
        perimeters: calculatedPerimeters,
        vertexCount,
        coords: coordsArray
      };
    } catch (error) {
      console.error('Error calculating polygon data:', error);
      return null;
    }
  }, []);

  const addPolygon = useCallback((coords) => {
    const data = calculateData(coords);
    if (!data) return null;

    setPolygons(prev => {
      const newPoly = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        ...data,
        color: POLYGON_COLORS[prev.length % POLYGON_COLORS.length]
      };
      return [...prev, newPoly];
    });
    return true; // We don't return the ID because setPolygons is async
  }, [calculateData]);

  const updatePolygon = useCallback((id, coords) => {
    const data = calculateData(coords);
    if (!data) return false;

    setPolygons(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    return true;
  }, [calculateData]);

  const removePolygon = useCallback((id) => {
    setPolygons(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearPolygons = useCallback(() => {
    setPolygons([]);
  }, []);

  return {
    polygons,
    addPolygon,
    updatePolygon,
    removePolygon,
    clearPolygons,
    calculateData,
    setPolygons
  };
};
