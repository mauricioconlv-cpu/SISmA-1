import React, { createContext, useState, useContext, useEffect } from 'react';
import { DEFAULT_COMPANIES } from '../utils/constants';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ children }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedCompanies = localStorage.getItem('towing_companies');
        if (storedCompanies) {
            setCompanies(JSON.parse(storedCompanies));
        } else {
            setCompanies(DEFAULT_COMPANIES);
            localStorage.setItem('towing_companies', JSON.stringify(DEFAULT_COMPANIES));
        }
        setLoading(false);
    }, []);

    const saveCompanies = (newCompanies) => {
        setCompanies(newCompanies);
        localStorage.setItem('towing_companies', JSON.stringify(newCompanies));
    };

    const addCompany = (companyData) => {
        const newCompany = {
            id: Date.now(),
            active: true,
            ...companyData
        };
        const updated = [...companies, newCompany];
        saveCompanies(updated);
        return newCompany;
    };

    const updateCompany = (id, companyData) => {
        const updated = companies.map(c => c.id === id ? { ...c, ...companyData } : c);
        saveCompanies(updated);
    };

    const deleteCompany = (id) => {
        // Soft delete or hard delete? Let's do hard delete for now, or toggle active
        // For this requirement "CRUD", usually implies delete.
        const updated = companies.filter(c => c.id !== id);
        saveCompanies(updated);
    };

    const getCompanyById = (id) => {
        // Handle string/number mismatch
        return companies.find(c => c.id == id);
    };

    return (
        <CompanyContext.Provider value={{ companies, addCompany, updateCompany, deleteCompany, getCompanyById, loading }}>
            {children}
        </CompanyContext.Provider>
    );
};

export const useCompanies = () => useContext(CompanyContext);
