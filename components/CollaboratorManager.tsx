
import React, { useState } from 'react';
import { Collaborator } from '../types';

interface CollaboratorManagerProps {
  collaborators: Collaborator[];
  onAdd: (c: Collaborator) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, name: string) => void;
}

const CollaboratorManager: React.FC<CollaboratorManagerProps> = ({ collaborators, onAdd, onRemove, onUpdate }) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: Math.random().toString(36).substr(2, 9), name: name.trim() });
    setName('');
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) return;
    onUpdate(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <i className="fa-solid fa-users text-indigo-500"></i>
        Gestão de Responsáveis (Colaboradores)
      </h3>
      
      <form onSubmit={handleAdd} className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-lg items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome do Colaborador</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ex: João Silva"
          />
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-all h-[38px]">
          Adicionar
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {collaborators.map(c => (
          <div key={c.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg hover:shadow-md transition-all group">
            {editingId === c.id ? (
              <div className="flex-1 flex gap-2">
                <input 
                  type="text" 
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded outline-none"
                  autoFocus
                />
                <button onClick={() => handleUpdate(c.id)} className="text-green-600"><i className="fa-solid fa-check"></i></button>
              </div>
            ) : (
              <>
                <span className="font-semibold text-slate-800 text-sm">{c.name}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(c.id); setEditingName(c.name); }} className="text-slate-400 hover:text-indigo-600">
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button onClick={() => onRemove(c.id)} className="text-slate-400 hover:text-red-500">
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {collaborators.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-400 italic text-sm">Nenhum responsável cadastrado.</div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorManager;
