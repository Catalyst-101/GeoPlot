import React, { useState } from 'react';
import { Search, Loader2, Navigation, Share2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const SearchBar = ({ onLocationSelect, searchedLocation }) => {
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result) => {
    onLocationSelect({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name
    });
    setIsOpen(false);
    setQuery(result.display_name.split(',')[0]);
  };

  const handleGoToCoords = (e) => {
    e.preventDefault();
    if (lat && lng) {
      onLocationSelect({
        lat: parseFloat(lat),
        lon: parseFloat(lng),
        name: `Coords: ${lat}, ${lng}`
      });
    }
  };

  const handleShare = () => {
    if (searchedLocation) {
      const url = new URL(window.location.href);
      url.searchParams.set('lat', searchedLocation.lat);
      url.searchParams.set('lng', searchedLocation.lon);
      navigator.clipboard.writeText(url.toString());
      alert(t('link_copied'));
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative w-full">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-surface border border-border rounded-lg py-2.5 ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 text-text placeholder-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
          <button
            type="submit"
            className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>

        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface shadow-lg rounded-lg border border-border overflow-hidden z-[1010]">
            {results.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleSelect(result)}
                className="w-full text-left rtl:text-right px-4 py-2.5 text-sm text-text hover:bg-surface-soft hover:text-primary border-b border-border last:border-0 transition-colors flex flex-col"
              >
                <span className="font-medium truncate w-full">{result.display_name.split(',')[0]}</span>
                <span className="text-xs text-muted truncate w-full mt-0.5">{result.display_name}</span>
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
