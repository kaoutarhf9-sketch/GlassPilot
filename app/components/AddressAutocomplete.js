"use client";

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onSelect,
  placeholder = "123 rue du Commerce, 75001 Paris",
  className = "",
  icon = <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />,
  required = false,
  name = "adresse"
}) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    
    // Si la requête est exactement ce qu'on vient de sélectionner, on ne recherche pas
    if (value === query && !showSuggestions) return;

    const fetchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.features || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(fetchTimeout);
  }, [query, value, showSuggestions]);

  const handleSelect = (feature) => {
    const props = feature.properties;
    
    // Construire l'adresse complète : "12 rue des fleurs, 75001 Paris"
    const fullAddress = `${props.name}, ${props.postcode} ${props.city}`;
    
    setQuery(fullAddress);
    setShowSuggestions(false);
    
    // Notifier le parent
    if (onChange) {
      onChange({ target: { name, value: fullAddress } });
    }
    
    if (onSelect) {
      onSelect({
        adresse_complete: fullAddress,
        nom_rue: props.name,
        code_postal: props.postcode,
        ville: props.city
      });
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {icon}
      <input
        type="text"
        name={name}
        required={required}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(true);
          if (onChange) onChange(e);
        }}
        onFocus={() => {
          if (query.length >= 3) setShowSuggestions(true);
        }}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 size={16} className="animate-spin text-[var(--muted)]" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-[var(--stone)] rounded-xl shadow-lg max-h-60 overflow-y-auto text-sm text-[var(--ink)]">
          {suggestions.map((s, i) => (
            <li 
              key={i}
              onClick={() => handleSelect(s)}
              className="px-4 py-3 hover:bg-[var(--page-bg)] cursor-pointer border-b border-[var(--stone)] last:border-0"
            >
              <div className="font-medium">{s.properties.name}</div>
              <div className="text-xs text-[var(--muted)]">{s.properties.postcode} {s.properties.city}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
