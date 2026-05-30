import { useState, useCallback } from 'react';
import * as turf from '@turf/turf';
import { calculateAreas, calculatePerimeter } from '../utils/areaConversions';

export const useAreaCalculator = () => {
  const [polygon, setPolygon] = useState(null);
  const [areas, setAreas] = useState(calculateAreas(0));
  const [perimeters, setPerimeters] = useState(calculatePerimeter(0));
  const [vertexCount, setVertexCount] = useState(0);
  const [center, setCenter] = useState(null);

  const calculatePolygonData = useCallback((geojson) => {
    if (!geojson) {
      setPolygon(null);
      setAreas(calculateAreas(0));
      setPerimeters(calculatePerimeter(0));
      setVertexCount(0);
      setCenter(null);
      return null;
    }

    try {
      // Create a Turf polygon
      const coords = geojson.geometry.coordinates;
      if (!coords || coords.length === 0 || coords[0].length < 4) {
        throw new Error('Invalid polygon');
      }

      const turfPolygon = turf.polygon(coords);
      
      // Calculate Area
      const areaSqMeters = turf.area(turfPolygon);
      const calculatedAreas = calculateAreas(areaSqMeters);
      
      // Calculate Perimeter
      // Convert to line string to calculate length
      const line = turf.polygonToLine(turfPolygon);
      const perimeterMeters = turf.length(line, { units: 'meters' });
      const calculatedPerimeters = calculatePerimeter(perimeterMeters);

      // Vertex count (subtract 1 because first and last point are the same)
      const vCount = coords[0].length - 1;

      // Center point
      const centroid = turf.centroid(turfPolygon);
      const centerCoords = centroid.geometry.coordinates;

      setPolygon(geojson);
      setAreas(calculatedAreas);
      setPerimeters(calculatedPerimeters);
      setVertexCount(vCount);
      setCenter([centerCoords[1], centerCoords[0]]); // Leaflet uses [lat, lng], Turf uses [lng, lat]

      return {
        geojson,
        areas: calculatedAreas,
        perimeters: calculatedPerimeters,
        vertexCount: vCount,
        center: [centerCoords[1], centerCoords[0]]
      };
    } catch (error) {
      console.error('Error calculating polygon data:', error);
      return null;
    }
  }, []);

  const clearPolygon = useCallback(() => {
    setPolygon(null);
    setAreas(calculateAreas(0));
    setPerimeters(calculatePerimeter(0));
    setVertexCount(0);
    setCenter(null);
  }, []);

  return {
    polygon,
    areas,
    perimeters,
    vertexCount,
    center,
    calculatePolygonData,
    clearPolygon
  };
};
