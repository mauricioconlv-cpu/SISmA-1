import React from 'react';
import { Package } from 'lucide-react';
import { SectionTitle } from '../Shared/UIComponents';

const Inventory = () => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <Package size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
                    <p className="text-slate-500">Módulo en construcción</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 border-dashed">
                <Package size={64} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">Próximamente</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2">
                    Estamos trabajando en el módulo de control de refacciones y equipo.
                    Esta funcionalidad estará disponible en la próxima actualización.
                </p>
            </div>
        </div>
    );
};

export default Inventory;
