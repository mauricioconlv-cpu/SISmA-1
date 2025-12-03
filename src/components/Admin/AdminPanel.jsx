import React, { useState } from 'react';
import { Settings, Save, Trash, Plus, List } from 'lucide-react';
import { SectionTitle } from '../Shared/UIComponents';
import { useServices } from '../../context/ServiceContext';

const AdminPanel = () => {
    const { catalogs, updateCatalogs } = useServices();
    const [localCatalogs, setLocalCatalogs] = useState(catalogs);
    const [newItem, setNewItem] = useState('');
    const [activeCategory, setActiveCategory] = useState('vehicleTypes');

    const categories = [
        { key: 'vehicleTypes', label: 'Tipos de Vehículo' },
        { key: 'vehicleBrands', label: 'Marcas de Vehículo' },
        { key: 'colors', label: 'Colores Comunes' },
        { key: 'extraCharges', label: 'Conceptos de Cobro Extra' }
    ];

    const handleAdd = () => {
        if (!newItem.trim()) return;
        setLocalCatalogs(prev => ({
            ...prev,
            [activeCategory]: [...(prev[activeCategory] || []), newItem.trim()]
        }));
        setNewItem('');
    };

    const handleRemove = (index) => {
        if (!confirm("¿Eliminar este elemento?")) return;
        setLocalCatalogs(prev => ({
            ...prev,
            [activeCategory]: prev[activeCategory].filter((_, i) => i !== index)
        }));
    };

    const handleSave = () => {
        updateCatalogs(localCatalogs);
        alert("✅ Catálogos actualizados correctamente.");
    };

    return (
        <div className="max-w-6xl mx-auto p-8 bg-white rounded-2xl shadow-lg animate-fade-in border border-slate-100">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                        <Settings className="text-blue-600" /> Configuración del Sistema
                    </h2>
                    <p className="text-slate-500 mt-1">Gestione las listas desplegables y catálogos globales.</p>
                </div>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                    <Save size={20} /> Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* SIDEBAR NAVIGATION */}
                <div className="lg:col-span-1 space-y-2">
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3
                                ${activeCategory === cat.key
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            <List size={18} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT AREA */}
                <div className="lg:col-span-3 bg-slate-50 rounded-2xl p-6 border border-slate-200 min-h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-700">
                            {categories.find(c => c.key === activeCategory)?.label}
                        </h3>
                        <span className="bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-400 border border-slate-200">
                            {localCatalogs[activeCategory]?.length || 0} Elementos
                        </span>
                    </div>

                    {/* ADD NEW ITEM */}
                    <div className="flex gap-3 mb-6">
                        <input
                            type="text"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            placeholder="Escriba un nuevo elemento..."
                            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                        />
                        <button
                            onClick={handleAdd}
                            disabled={!newItem.trim()}
                            className="bg-green-600 text-white px-6 rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* LIST */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {localCatalogs[activeCategory]?.map((item, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center group hover:border-blue-300 hover:shadow-sm transition-all">
                                <span className="font-medium text-slate-700">{item}</span>
                                <button
                                    onClick={() => handleRemove(index)}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>
                        ))}

                        {(!localCatalogs[activeCategory] || localCatalogs[activeCategory].length === 0) && (
                            <div className="text-center py-12 text-slate-400 italic">
                                No hay elementos en esta lista.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
