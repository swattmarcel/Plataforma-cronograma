
import React, { useMemo } from 'react';
import { Project, TaskStatus } from '../types';

interface CostsManagerProps {
  project: Project;
  currencySymbol: string;
}

const CostsManager: React.FC<CostsManagerProps> = ({ project, currencySymbol }) => {
  const totalCost = useMemo(() => project.tasks.reduce((acc, t) => acc + t.cost, 0), [project.tasks]);
  const spentCost = useMemo(
    () => project.tasks.filter(t => t.status === TaskStatus.DONE).reduce((acc, t) => acc + t.cost, 0),
    [project.tasks]
  );

  const byDiscipline = useMemo(() => {
    return project.disciplines.map(d => {
      const tasks = project.tasks.filter(t => t.disciplineId === d.id);
      return {
        id: d.id,
        name: d.name,
        total: tasks.reduce((acc, t) => acc + t.cost, 0),
        count: tasks.length,
      };
    }).filter(d => d.count > 0);
  }, [project.disciplines, project.tasks]);

  const byAssignee = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    project.tasks.forEach(t => {
      const entry = map.get(t.assignee) || { total: 0, count: 0 };
      entry.total += t.cost;
      entry.count += 1;
      map.set(t.assignee, entry);
    });
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  }, [project.tasks]);

  const fmt = (v: number) => `${currencySymbol} ${v.toFixed(2)}`;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Custos do Projeto</h2>
        <p className="text-slate-400 text-sm font-medium mt-1">{project.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Orçamento Total</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{fmt(totalCost)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Executado (Concluído)</p>
          <p className="text-3xl font-black text-emerald-600">{fmt(spentCost)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Restante</p>
          <p className="text-3xl font-black text-indigo-600">{fmt(totalCost - spentCost)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Custo por Disciplina</h3>
          <div className="space-y-4">
            {byDiscipline.length === 0 && <p className="text-slate-400 italic text-sm">Nenhum custo lançado ainda.</p>}
            {byDiscipline.map(d => (
              <div key={d.id} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                <div>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-200">{d.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{d.count} tarefas</p>
                </div>
                <p className="font-black text-indigo-600">{fmt(d.total)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Custo por Responsável</h3>
          <div className="space-y-4">
            {byAssignee.length === 0 && <p className="text-slate-400 italic text-sm">Nenhum custo lançado ainda.</p>}
            {byAssignee.map(a => (
              <div key={a.name} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3">
                <div>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-200">{a.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{a.count} tarefas</p>
                </div>
                <p className="font-black text-indigo-600">{fmt(a.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostsManager;
