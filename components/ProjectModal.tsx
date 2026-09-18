
import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface ProjectModalProps {
  onClose: () => void;
  onSave: (project: Partial<Project>, initialDisciplines: string[]) => void;
  initialData?: Project | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ onClose, onSave, initialData }) => {
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [disciplinesText, setDisciplinesText] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setClientName(initialData.clientName);
      setDeadline(initialData.deadline);
      setDisciplinesText(initialData.disciplines.map(d => d.name).join(', '));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName || !deadline) return;

    const initialDisciplines = initialData 
      ? [] 
      : disciplinesText.split(',').map(d => d.trim()).filter(d => d.length > 0);

    onSave({ 
      id: initialData?.id, 
      name, 
      clientName, 
      deadline, 
      manager: initialData?.manager || 'Usuário Atual' 
    }, initialDisciplines);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center text-white">
          <h3 className="font-black uppercase text-xs tracking-widest">{initialData ? 'Editar Projeto' : 'Novo Projeto'}</h3>
          <button onClick={onClose} className="hover:text-indigo-200 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Nome do Projeto</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
              placeholder="Ex: Coleção Verão 2025"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Cliente / Editora</label>
            <input 
              required
              type="text" 
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
              placeholder="Ex: Editora Estrela"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Prazo Final (Lançamento)</label>
            <input 
              required
              type="date" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm"
            />
          </div>

          {!initialData && (
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Disciplinas Iniciais (separadas por vírgula)</label>
              <textarea 
                value={disciplinesText}
                onChange={(e) => setDisciplinesText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[80px] font-medium text-sm"
                placeholder="Ex: História, Geografia, Matemática"
              />
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-4 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
            >
              {initialData ? 'Atualizar' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
