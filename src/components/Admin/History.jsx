import React, { useState } from 'react';
import { Download, Search, Eye, Archive, LayoutList, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useServices } from '../../context/ServiceContext';

const History = ({ onEdit }) => {
    const { services } = useServices();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'closed'

    const filteredServices = services.filter(s => {
        // 1. Filter by Tab
        const isClosed = s.status === 'Cerrado';
        if (activeTab === 'active' && isClosed) return false;
        if (activeTab === 'closed' && !isClosed) return false;

        // 2. Filter by Search Term
        return (
            s.folio?.toString().includes(searchTerm) ||
            s.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.vehiculo?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(services);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Histórico");
        XLSX.writeFile(wb, "Historial_Servicios.xlsx");
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Histórico de Servicios</h2>
                <button
                    onClick={exportToExcel}
                    className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 flex items-center gap-2"
                >
                    <Download size={20} /> Exportar Excel
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 transition-all border-b-4 ${activeTab === 'active'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <LayoutList size={20} />
                    Servicios Activos
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                        {services.filter(s => s.status !== 'Cerrado').length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('closed')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 transition-all border-b-4 ${activeTab === 'closed'
                        ? 'border-slate-600 text-slate-800'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Archive size={20} />
                    Archivo Muerto / Cerrados
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                        {services.filter(s => s.status === 'Cerrado').length}
                    </span>
                </button>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por folio, cliente o vehículo..."
                    className="w-full border pl-10 p-3 rounded-lg"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-3 border-b">Folio</th>
                            <th className="p-3 border-b">Fecha</th>
                            <th className="p-3 border-b">Cliente</th>
                            <th className="p-3 border-b">Vehículo</th>
                            <th className="p-3 border-b">Origen</th>
                            <th className="p-3 border-b">Destino</th>
                            <th className="p-3 border-b">Estatus</th>
                            <th className="p-3 border-b text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {filteredServices.length > 0 ? filteredServices.map(s => (
                            <tr key={s.folio} className="hover:bg-blue-50 border-b">
                                <td className="p-3 font-mono font-bold text-blue-600 cursor-pointer hover:underline" onClick={() => onEdit(s.folio)}>
                                    {s.folio}
                                </td>
                                <td className="p-3">{s.fecha}</td>
                                <td className="p-3 font-bold">{s.cliente}</td>
                                <td className="p-3">{s.vehiculo} <span className="text-xs text-gray-500">({s.placas})</span></td>
                                <td className="p-3 truncate max-w-[150px]" title={s.calleOrigen}>{s.calleOrigen}</td>
                                <td className="p-3 truncate max-w-[150px]" title={s.calleDestino}>{s.calleDestino}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs text-white font-bold flex items-center gap-1 w-fit
                                        ${s.status === 'Finalizado' ? 'bg-green-500' :
                                            s.status === 'Cerrado' ? 'bg-slate-500' :
                                                'bg-amber-500'}`}>
                                        {s.status === 'Finalizado' && <CheckCircle size={12} />}
                                        {s.status}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => onEdit(s.folio)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Ver Detalles / Editar"
                                    >
                                        <Eye size={20} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" className="p-8 text-center text-gray-500">
                                    {activeTab === 'active'
                                        ? 'No hay servicios activos coinciden con la búsqueda.'
                                        : 'No hay servicios archivados coinciden con la búsqueda.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;
