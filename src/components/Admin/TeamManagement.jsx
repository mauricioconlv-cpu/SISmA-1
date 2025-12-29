import React from 'react';
import { Users, ShieldAlert } from 'lucide-react';
import { SectionTitle } from '../Shared/UIComponents';

const TeamManagement = () => {
    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <SectionTitle title="Gestión de Equipo" icon={<Users size={24} />} />

            <div className="mt-8 bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo en Construcción</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    Aquí podrás invitar operadores, asignar roles y gestionar los accesos de tu equipo.
                </p>
                <div className="mt-8">
                    <span className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-mono border border-slate-200">
                        Próximamente
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;
