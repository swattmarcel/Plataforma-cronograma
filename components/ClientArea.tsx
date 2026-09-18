
import React, { useMemo } from 'react';
import { Project, TaskStatus } from '../types';
import { exportToPDF } from '../services/exportService';

interface ClientAreaProps {
  project: Project;
  formatDate: (dateStr: string) => string;
}

const ClientArea: React.FC<ClientAreaProps> = ({ project, formatDate }) => {
  const overallProgress = useMemo(() => {
    const completed = project.tasks.filter(t => t.status === TaskStatus.DONE).length;
    return project.tasks.length > 0 ? Math.round((completed / project.tasks.length) * 100) : 0;
  }, [project.tasks]);

  const byDiscipline = useMemo(() => {
    return project.disciplines.map(d => {
      const tasks = project.tasks.filter(t => t.disciplineId === d.id);
      const completed = tasks.filter(t => t.status === TaskStatus.DONE).length;
      const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;
      return { id: d.id, name: d.name, progress, count: tasks.length };
    });
  }, [project.disciplines, project.tasks]);

  const upcoming = useMemo(() => {
    return [...project.tasks]
      .filter(t => t.status !== TaskStatus.DONE)
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 5);
  }, [project.tasks]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mb-2">Área do Cliente</p>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{project.name}</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Editora / Cliente: {project.clientName}</p>
        </div>
        <button
          onClick={() => exportToPDF(project)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
        >
          <i className="fa-solid fa-file-pdf mr-2"></i> Baixar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Progresso Geral</p>
          <p className="text-3xl font-black text-indigo-600">{overallProgress}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Prazo de Lançamento</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{formatDate(project.deadline)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gestor Responsável</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{project.manager}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Progresso por Disciplina</h3>
          <div className="space-y-5">
            {byDiscipline.length === 0 && <p className="text-slate-400 italic text-sm">Nenhuma disciplina cadastrada.</p>}
            {byDiscipline.map(d => (
              <div key={d.id}>
                <div className="flex justify-between text-xs font-black text-slate-600 dark:text-slate-300 mb-2">
                  <span>{d.name}</span>
                  <span>{d.progress}%</span>
                </div>
                <div className="w-full bg-slate-50 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full transition-all duration-1000 ease-out" style={{ width: `${d.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Próximas Entregas</h3>
          <div className="space-y-4">
            {upcoming.length === 0 && <p className="text-slate-400 italic text-sm">Nenhuma pendência no momento.</p>}
            {upcoming.map(t => (
              <div key={t.id} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                <div>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-200">{t.title}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t.disciplineName}</p>
                </div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-400">{formatDate(t.endDate)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientArea;
