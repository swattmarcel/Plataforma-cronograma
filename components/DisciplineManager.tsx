
import React, { useState } from 'react';
import { Discipline, Project } from '../types';

interface DisciplineManagerProps {
  project: Project;
  onAddDiscipline: (projectId: string, name: string) => void;
  onRemoveDiscipline: (projectId: string, disciplineId: string) => void;
  onUpdateDiscipline: (projectId: string, disciplineId: string, newName: string) => void;
  onDuplicateDiscipline: (projectId: string, disciplineId: string) => void;
}

const DisciplineManager: React.FC<DisciplineManagerProps> = ({ 
  project, 
  onAddDiscipline, 
  onRemoveDiscipline, 
  onUpdateDiscipline,
  onDuplicateDiscipline
}) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!name) return;
    onAddDiscipline(project.id, name);
    setName('');
  };

  const startEditing = (d: Discipline) => {
    setEditingId(d.id);
    setEditingName(d.name);
  };

  const saveEdit = () => {
    if (editingId && editingName) {
      onUpdateDiscipline(project.id, editingId, editingName);
      setEditingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
        <i className="fa-solid fa-graduation-cap text-indigo-500"></i>
        Disciplinas do Projeto: {project.name}
      </h3>
      <p className="text-sm text-slate-500 mb-6">Defina as áreas disciplinares. Você pode duplicar uma disciplina para copiar todas as suas etapas e prazos rapidamente.</p>

      <div className="flex gap-4 mb-6">
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da disciplina (ex: História, Inglês...)"
          className="flex-1 px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          onClick={handleAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-lg text-sm transition-all"
        >
          Adicionar Disciplina
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {project.disciplines.map(d => (
          <div key={d.id} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200 group transition-all hover:bg-white hover:shadow-sm">
            {editingId === d.id ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-white border border-indigo-300 rounded px-2 py-0.5 text-xs font-bold w-32 outline-none"
                  autoFocus
                  onBlur={saveEdit}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                />
                <button onClick={saveEdit} className="text-green-600 text-xs"><i className="fa-solid fa-check"></i></button>
              </div>
            ) : (
              <>
                <span className="text-sm font-bold text-slate-700">{d.name}</span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 border-l pl-2 border-slate-300">
                  <button 
                    onClick={() => startEditing(d)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors text-[10px]"
                    title="Editar nome"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button 
                    onClick={() => onDuplicateDiscipline(project.id, d.id)}
                    className="text-slate-400 hover:text-blue-600 transition-colors text-[10px]"
                    title="Duplicar disciplina e tarefas"
                  >
                    <i className="fa-solid fa-copy"></i>
                  </button>
                  <button 
                    onClick={() => onRemoveDiscipline(project.id, d.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors text-[10px]"
                    title="Remover"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {project.disciplines.length === 0 && (
          <p className="text-slate-400 italic text-sm">Nenhuma disciplina vinculada.</p>
        )}
      </div>
    </div>
  );
};

export default DisciplineManager;
