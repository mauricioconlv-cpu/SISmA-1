import { useState, useEffect } from 'react';

export const useServiceData = () => {
    // --- SERVICES DB ---
    const [services, setServices] = useState([]);
    const [currentFolio, setCurrentFolio] = useState(1000);

    // --- LOAD DATA ---
    useEffect(() => {
        const savedServices = localStorage.getItem('gruas_db_final');
        if (savedServices) {
            const parsed = JSON.parse(savedServices);
            setServices(parsed);
            if (parsed.length > 0) {
                const maxFolio = Math.max(...parsed.map(s => s.folio || 1000));
                setCurrentFolio(maxFolio);
            }
        }
    }, []);

    // --- PERSISTENCE ---
    useEffect(() => {
        localStorage.setItem('gruas_db_final', JSON.stringify(services));
    }, [services]);

    const addService = (serviceData) => {
        const newFolio = currentFolio + 1;
        const newService = { ...serviceData, folio: newFolio, status: 'Activo' };
        setServices(prev => [newService, ...prev]);
        setCurrentFolio(newFolio);
        return newFolio;
    };

    const updateService = (folio, updates) => {
        setServices(prev => prev.map(s => s.folio === folio ? { ...s, ...updates } : s));
    };

    return {
        services,
        addService,
        updateService,
        currentFolio
    };
};
