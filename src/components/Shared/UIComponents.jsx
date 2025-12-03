import React from 'react';

export const InputGroup = ({ label, children, required = false, className = "" }) => (
    <div className={`mb-4 w-full ${className}`}>
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

export const SectionTitle = ({ title, icon }) => (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-3 mb-6 mt-8">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    </div>
);

export const StyledInput = (props) => (
    <input
        {...props}
        className={`w-full rounded-lg px-4 py-2.5 outline-none transition-all ${props.readOnly
                ? 'bg-transparent border-transparent shadow-none text-slate-700 font-medium px-0'
                : 'border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-slate-400'
            } ${props.className || ''}`}
    />
);

export const StyledSelect = (props) => (
    <select
        {...props}
        disabled={props.readOnly} // Selects don't support readOnly, so we disable them but style them to look like text if possible, or just standard disabled
        className={`w-full rounded-lg px-4 py-2.5 outline-none transition-all appearance-none ${props.readOnly
                ? 'bg-transparent border-transparent shadow-none text-slate-700 font-medium px-0 disabled:opacity-100 disabled:bg-transparent'
                : 'border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm'
            } ${props.className || ''}`}
    >
        {props.children}
    </select>
);

export const StyledTextArea = (props) => (
    <textarea
        {...props}
        className={`w-full rounded-lg px-4 py-2.5 outline-none transition-all ${props.readOnly
                ? 'bg-transparent border-transparent shadow-none text-slate-700 font-medium px-0 resize-none'
                : 'border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-slate-400'
            } ${props.className || ''}`}
    />
);
