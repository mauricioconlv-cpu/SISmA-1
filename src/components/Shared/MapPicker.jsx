import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

const defaultCenter = {
    lat: 19.4326,
    lng: -99.1332
};

// Define libraries OUTSIDE the component to prevent reloading
const LIBRARIES = ['places', 'geocoding'];

const MapPicker = ({ onLocationSelect, initialLocation, externalCoords }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyDdWzumlYFQGYRIskm1-uMQwhubHCGrjIo",
        libraries: LIBRARIES
    });

    const [map, setMap] = useState(null);
    // Marker state always holds the current pin position
    const [marker, setMarker] = useState(initialLocation || defaultCenter);

    // Unified Input State
    const [inputValue, setInputValue] = useState("");

    // Effect to update marker AND map center ONLY if externalCoords change explicitly
    useEffect(() => {
        if (externalCoords && externalCoords.lat && externalCoords.lng) {
            const lat = parseFloat(externalCoords.lat);
            const lng = parseFloat(externalCoords.lng);

            // Only update if we have valid numbers
            if (!isNaN(lat) && !isNaN(lng)) {
                // Check if the new coordinates are significantly different from the current marker
                // This prevents the "typing loop" where the formatted value overwrites the user's typing
                // if the values are numerically identical.
                const currentLat = parseFloat(marker.lat);
                const currentLng = parseFloat(marker.lng);
                const isDifferent = Math.abs(lat - currentLat) > 0.00001 || Math.abs(lng - currentLng) > 0.00001;

                if (isDifferent) {
                    const newPos = { lat, lng };
                    setMarker(newPos);
                    setInputValue(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

                    if (map) {
                        map.panTo(newPos);
                    }
                }
            }
        }
    }, [externalCoords, map, marker]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    const handleGeocode = (lat, lng, fromExternal = false) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
                const addressComponents = results[0].address_components;
                const getComponent = (type) => addressComponents.find(c => c.types.includes(type))?.long_name || '';

                const addressData = {
                    lat,
                    lng,
                    calle: getComponent('route'),
                    numero: getComponent('street_number'),
                    colonia: getComponent('sublocality') || getComponent('neighborhood'),
                    municipio: getComponent('locality') || getComponent('administrative_area_level_2'),
                    estado: getComponent('administrative_area_level_1'),
                    cp: getComponent('postal_code'),
                    fullAddress: results[0].formatted_address,
                    fromExternal // Pass this flag back so parent knows source
                };

                onLocationSelect(addressData);
            } else {
                onLocationSelect({ lat, lng, fullAddress: `${lat}, ${lng}`, fromExternal });
            }
        });
    };

    // Handle Manual Input Change
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        // Smart Parsing: Look for comma
        if (val.includes(',')) {
            const parts = val.split(',');
            if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());

                if (!isNaN(lat) && !isNaN(lng)) {
                    const newPos = { lat, lng };
                    setMarker(newPos);
                    if (map) map.panTo(newPos);
                    // We pass false (or undefined) so ServiceWizard updates the source of truth
                    // The useEffect check above will prevent the loop
                    handleGeocode(lat, lng);
                }
            }
        }
    };

    const handleMapClick = async (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updatePosition(lat, lng);
    };

    const handleMarkerDragEnd = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updatePosition(lat, lng);
    };

    const updatePosition = (lat, lng) => {
        setMarker({ lat, lng });
        setInputValue(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        handleGeocode(lat, lng);
    };

    // Stable options to prevent re-renders
    const mapOptions = useMemo(() => ({
        gestureHandling: "greedy", // CRITICAL: Allows drag/pan without modifier keys
        disableDefaultUI: false,
        zoomControl: true,
        draggable: true,
        scrollwheel: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true
    }), []);

    if (!isLoaded) return <div>Cargando Mapa...</div>;

    // Ensure marker position is always a valid object for the component
    const markerPos = {
        lat: parseFloat(marker.lat) || defaultCenter.lat,
        lng: parseFloat(marker.lng) || defaultCenter.lng
    };

    return (
        <div className="w-full">
            {/* Unified Input */}
            <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                    Coordenadas (Lat, Lng)
                </label>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="ej. 19.4326, -99.1332"
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm placeholder-slate-400 font-mono text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">
                    * Pega aquí tus coordenadas o mueve el pin en el mapa.
                </p>
            </div>

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter} // Use STATIC center to prevent fighting with manual panning
                zoom={15}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
                options={mapOptions}
            >
                <Marker
                    position={markerPos}
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                />
            </GoogleMap>
        </div>
    );
};

export default React.memo(MapPicker);
