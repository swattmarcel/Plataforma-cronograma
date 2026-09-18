
import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  formatDate: (dateStr: string) => string;
}

const COLUMNS: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
  TaskStatus.BLOCKED,
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateStatus, formatDate }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDrop = (status: TaskStatus) => {
    if (draggedTaskId) {
      onUpdateStatus(draggedTaskId, status);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {COLUMNS.map(status => {
        const columnTasks = tasks.filter(t => t.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => { e.preventDefault(); setDragOverColumn(status); }}
            onDragLeave={() => setDragOverColumn(prev => (prev === status ? null : prev))}
            onDrop={(e) => { e.preventDefault(); handleDrop(status); }}
            className={`rounded-[2rem] border p-4 space-y-4 min-h-[200px] transition-colors ${
              dragOverColumn === status
                ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between px-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ring-1 ring-inset ${STATUS_COLORS[status]}`}>{status}</span>
              <span className="text-[10px] font-black text-slate-400">{columnTasks.length}</span>
            </div>

            <div className="space-y-3">
              {columnTasks.map(t => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDraggedTaskId(t.id)}
                  onDragEnd={() => { setDraggedTaskId(null); setDragOverColumn(null); }}
                  className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${draggedTaskId === t.id ? 'opacity-40' : ''}`}
                >
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{t.title}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.disciplineName}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-bold text-slate-500">{t.assignee || '—'}</span>
                    <span className="text-[10px] font-black text-indigo-500">{t.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-indigo-600 h-full" style={{ width: `${t.progress}%` }}></div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">Prazo: {formatDate(t.endDate)}</p>
                </div>
              ))}
              {columnTasks.length === 0 && (
                <p className="text-[10px] text-slate-300 italic text-center py-6">Sem tarefas</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
