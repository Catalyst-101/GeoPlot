import React, { useState, useEffect } from 'react';
import { Search, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SearchBar = ({ onLocationSelect, searchedLocation, showToast }) => {
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [autocompleteService, setAutocompleteService] = useState(null);
  const [geocoder, setGeocoder] = useState(null);

  useEffect(() => {
    if (!window.google) return;
    if (!autocompleteService) {
      setAutocompleteService(new window.google.maps.places.AutocompleteService());
    }
    if (!geocoder) {
      setGeocoder(new window.google.maps.Geocoder());
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    
    if (!val.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (autocompleteService) {
      autocompleteService.getPlacePredictions(
        { input: val },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setResults(predictions);
            setIsOpen(true);
          } else {
            setResults([]);
            if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
               // Optional: Show "No results found"
            }
          }
        }
      );
    }
  };

  const handleSelect = (prediction) => {
    if (!geocoder) return;
    
    setQuery(prediction.description.split(',')[0]);
    setIsOpen(false);

    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results[0]) {
        const place = results[0];
        onLocationSelect({
          lat: place.geometry.location.lat(),
          lon: place.geometry.location.lng(),
          name: place.formatted_address
        });
      } else {
        if (showToast) showToast('Search failed or location not found.', 'error');
      }
    });
  };

  const handleGoToCoords = (e) => {
    e.preventDefault();
    if (lat && lng) {
      onLocationSelect({
        lat: parseFloat(lat),
        lon: parseFloat(lng),
        name: `Coords: ${lat}, ${lng}`
      });
    } else {
      if (showToast) showToast('Please enter both latitude and longitude.', 'error');
    }
  };

  const handleShare = () => {
    if (searchedLocation) {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', searchedLocation.lat);
      url.searchParams.set('lng', searchedLocation.lon);
      navigator.clipboard.writeText(url.toString());
      if (showToast) showToast(t('link_copied'), 'success');
      else alert(t('link_copied'));
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative w-full">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleSearchChange}
            placeholder={t('search_placeholder')}
            className="w-full bg-surface border border-border rounded-lg py-2.5 ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
          <div className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-muted">
             <Search className="w-4 h-4" />
          </div>
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface shadow-lg rounded-lg border border-border overflow-hidden z-[1010]">
            {results.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleSelect(result)}
                className="w-full text-left rtl:text-right px-4 py-2.5 text-sm text-text hover:bg-surface-soft hover:text-primary border-b border-border last:border-0 transition-colors flex flex-col"
              >
                <span className="font-medium truncate w-full">{result.structured_formatting?.main_text || result.description}</span>
                <span className="text-xs text-muted truncate w-full mt-0.5">{result.structured_formatting?.secondary_text || ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleGoToCoords} className="flex gap-2 flex-1">
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder={t('lat')}
            className="w-full bg-surface border border-border rounded-lg py-1.5 px-2 text-xs text-text placeholder-muted focus:border-primary focus:outline-none"
          />
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder={t('lng')}
            className="w-full bg-surface border border-border rounded-lg py-1.5 px-2 text-xs text-text placeholder-muted focus:border-primary focus:outline-none"
          />
          <button type="submit" className="bg-primary text-surface px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center">
            {t('go')}
          </button>
        </form>
        <button 
          onClick={handleShare}
          disabled={!searchedLocation}
          className="p-2 border border-border rounded-lg bg-surface text-primary hover:bg-surface-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={t('share_location')}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
