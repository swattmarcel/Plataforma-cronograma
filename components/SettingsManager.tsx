
import React from 'react';
import { AppSettings } from '../types';

interface SettingsManagerProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ settings, onUpdate }) => {
  const handleChange = (key: keyof AppSettings, value: string) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-800">Preferências do Sistema</h2>
        <p className="text-slate-500 text-sm">Personalize a aparência e o comportamento do E-Book Flow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Aparência */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-palette"></i>
            </div>
            <h3 className="font-bold text-slate-800">Aparência</h3>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Tema Visual</label>
            <select 
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
            >
              <option value="light">Modo Claro (Padrão)</option>
              <option value="dark">Modo Escuro (Beta)</option>
              <option value="system">Seguir Sistema Operacional</option>
            </select>
          </div>
        </div>

        {/* Card: Localização */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-globe"></i>
            </div>
            <h3 className="font-bold text-slate-800">Regionalização</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Formato de Data</label>
              <select 
                value={settings.dateFormat}
                onChange={(e) => handleChange('dateFormat', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
              >
                <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                <option value="YYYY-MM-DD">AAAA-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Símbolo Monetário</label>
              <input 
                type="text"
                value={settings.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                placeholder="R$"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Card: Exportação e Dados */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 md:col-span-2">
           <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <i className="fa-solid fa-database"></i>
            </div>
            <h3 className="font-bold text-slate-800">Dados do Aplicativo</h3>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                const data = {
                  projects: localStorage.getItem('ebook_flow_projects'),
                  collaborators: localStorage.getItem('ebook_flow_collaborators'),
                  processes: localStorage.getItem('ebook_flow_processes')
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ebook_flow_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              } }
              className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-all shadow-lg"
            >
              <i className="fa-solid fa-download mr-2"></i> Exportar Backup Completo
            </button>
            <button 
              onClick={() => {
                if(confirm("Tem certeza? Isso apagará todos os dados locais permanentemente.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
            >
              <i className="fa-solid fa-trash-can mr-2"></i> Limpar Todo o Armazenamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
