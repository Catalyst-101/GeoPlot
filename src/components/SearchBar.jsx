import React, { useState, useEffect, useRef } from 'react';
import { Search, Share2, X, Loader } from 'lucide-react';

const SearchBar = ({ onLocationSelect, searchedLocation, showToast }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const sessionTokenRef = useRef(null);
  const cacheRef = useRef({});
  const containerRef = useRef(null);

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch suggestions
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    // Don't autocomplete if query is coordinates
    const coordRegex = /^\s*(-?\d+(?:\.\d+)?)\s*[\s,]\s*(-?\d+(?:\.\d+)?)\s*$/;
    if (coordRegex.test(trimmed)) {
      setResults([]);
      setIsOpen(false);
      setError(null);
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = window.google.maps.places;

    if (!AutocompleteSuggestion) {
      console.warn("AutocompleteSuggestion is not loaded yet.");
      return;
    }

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    const cacheKey = trimmed.toLowerCase();

    // Check cache
    if (cacheRef.current[cacheKey]) {
      setResults(cacheRef.current[cacheKey]);
      setIsOpen(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: trimmed,
      sessionToken: sessionTokenRef.current
    })
    .then(({ suggestions }) => {
      if (suggestions && suggestions.length > 0) {
        cacheRef.current[cacheKey] = suggestions;
        setResults(suggestions);
        setIsOpen(true);
        setError(null);
      } else {
        setResults([]);
        setIsOpen(false);
        setError('No results found');
      }
    })
    .catch((err) => {
      console.error('fetchAutocompleteSuggestions failed:', err);
      setError('Search failed or API unavailable');
      setResults([]);
      setIsOpen(false);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, [debouncedQuery]);

  const handleSelect = async (suggestion) => {
    if (!suggestion || !suggestion.placePrediction) return;

    setIsOpen(false);
    setIsLoading(true);
    setError(null);
    setHighlightedIndex(-1);

    try {
      const place = suggestion.placePrediction.toPlace();
      
      const mainText = suggestion.placePrediction.mainText?.text || suggestion.placePrediction.text?.text;
      setQuery(mainText || '');

      await place.fetchFields({
        fields: ['location', 'displayName', 'formattedAddress']
      });

      if (place.location) {
        const latVal = place.location.lat();
        const lonVal = place.location.lng();
        
        let nameVal = 'Search Result';
        if (place.displayName) {
          nameVal = typeof place.displayName === 'object' && place.displayName.text 
            ? place.displayName.text 
            : place.displayName;
        } else if (place.formattedAddress) {
          nameVal = place.formattedAddress;
        } else if (mainText) {
          nameVal = mainText;
        }

        onLocationSelect({
          lat: latVal,
          lon: lonVal,
          name: nameVal,
          isSearch: true
        });

        // Reset session token for next search
        sessionTokenRef.current = null;
      } else {
        throw new Error('No coordinates returned for place');
      }
    } catch (err) {
      console.error('fetchFields failed:', err);
      if (showToast) showToast('Search failed or location not found.', 'error');
      setError('Search failed or location not found.');
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Local coordinate parsing
    const coordRegex = /^\s*(-?\d+(?:\.\d+)?)\s*[\s,]\s*(-?\d+(?:\.\d+)?)\s*$/;
    const match = trimmed.match(coordRegex);
    if (match) {
      const parsedLat = parseFloat(match[1]);
      const parsedLng = parseFloat(match[2]);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        onLocationSelect({
          lat: parsedLat,
          lon: parsedLng,
          name: `Coords: ${parsedLat.toFixed(6)}, ${parsedLng.toFixed(6)}`,
          isSearch: true
        });
        setIsOpen(false);
        setError(null);
        setHighlightedIndex(-1);
        return;
      } else {
        if (showToast) showToast('Invalid coordinates (lat: -90 to 90, lng: -180 to 180)', 'error');
        setError('Invalid coordinate input');
        return;
      }
    }

    if (results.length > 0) {
      const indexToSelect = highlightedIndex >= 0 ? highlightedIndex : 0;
      handleSelect(results[indexToSelect]);
    } else {
      setError('No results found');
      if (showToast) showToast('No results found.', 'error');
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsLoading(false);
    setError(null);
    sessionTokenRef.current = null;

    if (searchedLocation && (searchedLocation.isSearch || searchedLocation.name !== 'Current Location')) {
      onLocationSelect(null);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter') {
        performSearch();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleGoToCoords = (e) => {
    e.preventDefault();
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
        onLocationSelect({
          lat: parsedLat,
          lon: parsedLng,
          name: `Coords: ${lat}, ${lng}`,
          isSearch: true
        });
        setError(null);
      } else {
        if (showToast) showToast('Invalid coordinates (lat: -90 to 90, lng: -180 to 180)', 'error');
      }
    } else {
      if (showToast) showToast('Please enter both latitude and longitude.', 'error');
    }
  };

  const handleShare = () => {
    if (!searchedLocation) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?lat=${searchedLocation.lat}&lng=${searchedLocation.lon}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'GeoPlot Shared Location',
        url: shareUrl
      }).catch(err => console.error('Share failed:', err));
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('Link copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy link.', 'error'));
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-3 w-full">
      <div className="relative w-full">
        <div className="flex gap-2 w-full">
          <div className="relative flex-grow">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search location..."
              className="w-full bg-surface border border-border rounded-lg py-2.5 ltr:pl-10 rtl:pr-10 ltr:pr-10 rtl:pl-10 text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm pr-10"
            />
            <div className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-muted">
              <Search className="w-4 h-4" />
            </div>
            
            {isLoading && (
              <div className="absolute right-9 top-1/2 -translate-y-1/2 text-muted animate-spin">
                <Loader className="w-4 h-4 animate-spin" />
              </div>
            )}

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text focus:outline-none transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={performSearch}
            className="bg-primary text-surface px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
          >
            Search
          </button>
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface shadow-lg rounded-lg border border-border overflow-hidden z-[1010]">
            {results.map((result, idx) => {
              const mainText = result.placePrediction.mainText?.text || result.placePrediction.text?.text;
              const secondaryText = result.placePrediction.secondaryText?.text || '';
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={result.placePrediction.placeId}
                  onClick={() => handleSelect(result)}
                  className={`w-full text-left rtl:text-right px-4 py-2.5 text-sm transition-colors flex flex-col border-b border-border last:border-0 ${
                    isHighlighted 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-text hover:bg-surface-soft hover:text-primary'
                  }`}
                  type="button"
                >
                  <span className="font-medium truncate w-full">{mainText}</span>
                  {secondaryText && (
                    <span className={`text-xs truncate w-full mt-0.5 ${isHighlighted ? 'text-primary/80' : 'text-muted'}`}>
                      {secondaryText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-danger px-1 animate-in fade-in">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <form onSubmit={handleGoToCoords} className="flex gap-2 flex-1">
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="Latitude"
            className="w-full bg-surface border border-border rounded-lg py-1.5 px-2 text-xs text-text placeholder-muted focus:border-primary focus:outline-none"
          />
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="Longitude"
            className="w-full bg-surface border border-border rounded-lg py-1.5 px-2 text-xs text-text placeholder-muted focus:border-primary focus:outline-none"
          />
          <button type="submit" className="bg-primary text-surface px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center">
            Go
          </button>
        </form>
        <button 
          onClick={handleShare}
          disabled={!searchedLocation}
          className="p-2 border border-border rounded-lg bg-surface text-primary hover:bg-surface-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Share Location"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
