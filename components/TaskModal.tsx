
import React, { useState } from 'react';
import { Project, Task, TaskStatus, ProcessTemplate, Collaborator } from '../types';

interface TaskModalProps {
  project: Project;
  processes: ProcessTemplate[];
  collaborators: Collaborator[];
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ project, processes, collaborators, onClose, onSave }) => {
  const [disciplineId, setDisciplineId] = useState(project.disciplines[0]?.id || '');
  const [processId, setProcessId] = useState(processes[0]?.id || '');
  const [assignee, setAssignee] = useState(collaborators[0]?.name || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState<string>('0');
  const [progress, setProgress] = useState<number>(0);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const discipline = project.disciplines.find(d => d.id === disciplineId);
    const process = processes.find(p => p.id === processId);

    onSave({
      disciplineId,
      disciplineName: discipline?.name || '',
      processId,
      title: `${process?.name} - ${discipline?.name}`,
      assignee,
      startDate,
      endDate,
      cost: parseFloat(cost) || 0,
      status: TaskStatus.TODO,
      progress: progress,
      dependencies: selectedDependencies
    });
    onClose();
  };

  const toggleDependency = (id: string) => {
    setSelectedDependencies(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-sm uppercase tracking-widest">Nova Tarefa: {project.name}</h3>
          <button onClick={onClose} className="hover:text-slate-300 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Disciplina</label>
              <select 
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {project.disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Processo</label>
              <select 
                value={processId}
                onChange={(e) => setProcessId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Responsável</label>
              <select 
                required
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              >
                <option value="">Selecione...</option>
                {collaborators.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Custo (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Início</label>
              <input 
                required
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Data Final</label>
              <input 
                required
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Progresso Inicial ({progress}%)</label>
            <input 
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">Antecessoras</label>
            <div className="mt-1 max-h-32 overflow-y-auto border border-slate-100 rounded-xl p-3 space-y-1 bg-slate-50">
              {project.tasks.length > 0 ? (
                project.tasks.map(t => (
                  <label key={t.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-all">
                    <input 
                      type="checkbox" 
                      checked={selectedDependencies.includes(t.id)}
                      onChange={() => toggleDependency(t.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-bold text-slate-600 truncate">{t.title}</span>
                  </label>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 italic p-2 uppercase tracking-widest">Sem tarefas anteriores.</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">Salvar Tarefa</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
