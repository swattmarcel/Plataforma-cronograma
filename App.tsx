
import React, { useState, useMemo, useEffect } from 'react';
import { Project, Task, TaskStatus, Conflict, ProcessTemplate, Discipline, Collaborator, AppSettings } from './types';
import { INITIAL_PROJECTS, INITIAL_PROCESSES, INITIAL_COLLABORATORS, STATUS_COLORS } from './constants';
import GanttChart from './components/GanttChart';
import SimulationPanel from './components/SimulationPanel';
import ProcessManager from './components/ProcessManager';
import DisciplineManager from './components/DisciplineManager';
import CollaboratorManager from './components/CollaboratorManager';
import SettingsManager from './components/SettingsManager';
import ProjectModal from './components/ProjectModal';
import TaskModal from './components/TaskModal';
import CostsManager from './components/CostsManager';
import ClientArea from './components/ClientArea';
import ConflictPanel from './components/ConflictPanel';
import KanbanBoard from './components/KanbanBoard';
import { exportToExcel, exportToPDF } from './services/exportService';
import { checkConflictsIA } from './services/geminiService';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ebook_flow_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [processes, setProcesses] = useState<ProcessTemplate[]>(() => {
    const saved = localStorage.getItem('ebook_flow_processes');
    return saved ? JSON.parse(saved) : INITIAL_PROCESSES;
  });
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => {
    const saved = localStorage.getItem('ebook_flow_collaborators');
    return saved ? JSON.parse(saved) : INITIAL_COLLABORATORS;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ebook_flow_settings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      dateFormat: 'DD/MM/YYYY',
      currencySymbol: 'R$',
      language: 'pt-BR'
    };
  });

  const [activeTab, setActiveTab] = useState<'geral' | 'cronograma' | 'processos' | 'disciplinas' | 'colaboradores' | 'custos' | 'cliente' | 'configuracoes'>('geral');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDaysLimit, setFilterDaysLimit] = useState<number>(0);

  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [scheduleView, setScheduleView] = useState<'lista' | 'kanban'>('lista');

  useEffect(() => {
    localStorage.setItem('ebook_flow_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('ebook_flow_processes', JSON.stringify(processes));
  }, [processes]);

  useEffect(() => {
    localStorage.setItem('ebook_flow_collaborators', JSON.stringify(collaborators));
  }, [collaborators]);

  useEffect(() => {
    localStorage.setItem('ebook_flow_settings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const activeProject = useMemo(() => {
    const selected = projects.find(p => p.id === selectedProjectId);
    if (selected) return selected;
    const firstActive = projects.find(p => !p.isArchived);
    return firstActive || null;
  }, [projects, selectedProjectId]);

  const calculateAutoProgress = (start: string, end: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start + 'T00:00:00');
    const endDate = new Date(end + 'T23:59:59');

    if (today < startDate) return 0;
    if (today > endDate) return 100;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  };

  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T12:00:00');
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredTasks = useMemo(() => {
    if (!activeProject) return [];
    let tasks = [...activeProject.tasks];
    
    if (filterDiscipline !== 'all') tasks = tasks.filter(t => t.disciplineId === filterDiscipline);
    if (filterStatus !== 'all') tasks = tasks.filter(t => t.status === filterStatus);
    if (filterDaysLimit > 0) {
      tasks = tasks.filter(t => {
        const days = getDaysDiff(t.endDate);
        return days <= filterDaysLimit && t.status !== TaskStatus.DONE;
      });
    }
    return tasks;
  }, [activeProject, filterDiscipline, filterStatus, filterDaysLimit]);

  const updateTask = (projectId: string, taskId: string, updates: Partial<Task>) => {
    setProjects(prev => prev.map(proj => proj.id === projectId ? {
      ...proj,
      tasks: proj.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
    } : proj));
  };

  const handleAutoSyncTask = (taskId: string) => {
    if (!activeProject) return;
    const task = activeProject.tasks.find(t => t.id === taskId);
    if (task) {
      const newProgress = calculateAutoProgress(task.startDate, task.endDate);
      updateTask(activeProject.id, taskId, { progress: newProgress });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const toggleArchiveProject = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived: !p.isArchived } : p));
  };

  const deleteProject = (id: string) => {
    if (window.confirm("Deseja realmente excluir este projeto?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProjectId === id) setSelectedProjectId('');
    }
  };

  const handleSaveProject = (projectData: Partial<Project>, initialDisciplines: string[]) => {
    if (projectData.id) {
      setProjects(prev => prev.map(p => p.id === projectData.id ? { ...p, ...projectData } : p));
      setProjectToEdit(null);
    } else {
      const newProjectId = Math.random().toString(36).substr(2, 9);
      const disciplines: Discipline[] = initialDisciplines.map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name,
        projectId: newProjectId
      }));
      const newProject: Project = {
        id: newProjectId,
        name: projectData.name || 'Novo Projeto',
        clientName: projectData.clientName || 'Cliente Genérico',
        manager: projectData.manager || 'Gestor',
        deadline: projectData.deadline || '',
        alertThresholdDays: 3,
        isArchived: false,
        disciplines,
        tasks: []
      };
      setProjects(prev => [...prev, newProject]);
      setSelectedProjectId(newProjectId);
      setActiveTab('cronograma');
    }
  };

  const handleAddDiscipline = (projectId: string, name: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      disciplines: [...p.disciplines, { id: Math.random().toString(36).substr(2, 9), name, projectId }]
    } : p));
  };

  const handleRemoveDiscipline = (projectId: string, disciplineId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      disciplines: p.disciplines.filter(d => d.id !== disciplineId),
      tasks: p.tasks.filter(t => t.disciplineId !== disciplineId)
    } : p));
  };

  const handleUpdateDiscipline = (projectId: string, disciplineId: string, newName: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      disciplines: p.disciplines.map(d => d.id === disciplineId ? { ...d, name: newName } : d),
      tasks: p.tasks.map(t => t.disciplineId === disciplineId ? { ...t, disciplineName: newName } : t)
    } : p));
  };

  const handleDuplicateDiscipline = (projectId: string, disciplineId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const sourceDiscipline = p.disciplines.find(d => d.id === disciplineId);
        if (!sourceDiscipline) return p;
        const newDisciplineId = Math.random().toString(36).substr(2, 9);
        const newDisciplineName = `${sourceDiscipline.name} (Cópia)`;
        const newDiscipline: Discipline = { id: newDisciplineId, name: newDisciplineName, projectId };
        const relatedTasks = p.tasks.filter(t => t.disciplineId === disciplineId);
        const newTasks: Task[] = relatedTasks.map(t => ({
          ...t,
          id: Math.random().toString(36).substr(2, 9),
          disciplineId: newDisciplineId,
          disciplineName: newDisciplineName,
          title: t.title.replace(sourceDiscipline.name, newDisciplineName)
        }));
        return { ...p, disciplines: [...p.disciplines, newDiscipline], tasks: [...p.tasks, ...newTasks] };
      }
      return p;
    }));
  };

  const addTask = (taskData: Partial<Task>) => {
    if (!activeProject) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: activeProject.id,
      disciplineId: taskData.disciplineId!,
      disciplineName: taskData.disciplineName!,
      processId: taskData.processId!,
      title: taskData.title!,
      assignee: taskData.assignee!,
      startDate: taskData.startDate!,
      endDate: taskData.endDate!,
      cost: taskData.cost || 0,
      status: TaskStatus.TODO,
      progress: taskData.progress || 0,
      dependencies: taskData.dependencies || []
    };
    setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, tasks: [...p.tasks, newTask] } : p));
  };

  const handleCheckConflicts = async () => {
    if (!activeProject) return;
    setIsCheckingConflicts(true);
    try {
      const result = await checkConflictsIA(activeProject.tasks);
      setConflicts(result || []);
    } catch (err) {
      setConflicts([]);
      window.alert('Erro ao verificar conflitos. Verifique sua chave de API.');
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('geral')}>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
            <i className="fa-solid fa-book-open text-xl"></i>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">E-BOOK FLOW</h1>
            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.2em]">Inteligência Editorial</p>
          </div>
        </div>

        <nav className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'geral', label: 'Geral', icon: 'fa-house' },
            { id: 'cronograma', label: 'Cronograma', icon: 'fa-calendar-days' },
            { id: 'processos', label: 'Processos', icon: 'fa-gears' },
            { id: 'disciplinas', label: 'Disciplinas', icon: 'fa-graduation-cap' },
            { id: 'colaboradores', label: 'Equipe', icon: 'fa-users' },
            { id: 'custos', label: 'Custos', icon: 'fa-coins' },
            { id: 'cliente', label: 'Área Cliente', icon: 'fa-user-tie' },
            { id: 'configuracoes', label: 'Config.', icon: 'fa-sliders' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)} 
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-3 uppercase tracking-wider ${activeTab === item.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full space-y-10">
        {activeTab === 'geral' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Projetos</h2>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                  <button onClick={() => setShowArchived(false)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!showArchived ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Produção</button>
                  <button onClick={() => setShowArchived(true)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showArchived ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Arquivados</button>
                </div>
              </div>
              <button onClick={() => { setProjectToEdit(null); setIsProjectModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3">
                <i className="fa-solid fa-plus"></i> Novo Projeto
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {projects.filter(p => p.isArchived === showArchived).map(p => {
                const completed = p.tasks.filter(t => t.status === TaskStatus.DONE).length;
                const total = p.tasks.length;
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={p.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-100 transition-all group relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="cursor-pointer" onClick={() => { setSelectedProjectId(p.id); setActiveTab('cronograma'); }}>
                        <h3 className="font-black text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors leading-tight">{p.name}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{p.clientName}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setProjectToEdit(p); setIsProjectModalOpen(true); }} className="w-9 h-9 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><i className="fa-solid fa-pen"></i></button>
                        <button onClick={() => toggleArchiveProject(p.id)} className="w-9 h-9 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-colors"><i className={`fa-solid ${p.isArchived ? 'fa-box-open' : 'fa-box-archive'}`}></i></button>
                        <button onClick={() => deleteProject(p.id)} className="w-9 h-9 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="w-full bg-slate-50 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                        <span className="flex items-center gap-2"><i className="fa-solid fa-check-circle text-indigo-500"></i> {completed}/{total} Tarefas</span>
                        <span className="flex items-center gap-2"><i className="fa-solid fa-calendar text-slate-300"></i> {formatDate(p.deadline)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'cronograma' && activeProject && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-wrap gap-8 items-end">
              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtro Disciplina</label>
                <select value={filterDiscipline} onChange={(e) => setFilterDiscipline(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all">
                  <option value="all">Todas as Disciplinas</option>
                  {activeProject.disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtro Status</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all">
                  <option value="all">Todos os Status</option>
                  {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 w-fit">
                <button onClick={() => setScheduleView('lista')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${scheduleView === 'lista' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}>
                  <i className="fa-solid fa-list mr-2"></i>Lista
                </button>
                <button onClick={() => setScheduleView('kanban')} className={`px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${scheduleView === 'kanban' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400'}`}>
                  <i className="fa-solid fa-table-columns mr-2"></i>Kanban
                </button>
              </div>
              <div className="flex gap-4">
                <button onClick={() => { setFilterDiscipline('all'); setFilterStatus('all'); }} className="px-6 py-3 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Limpar</button>
                <button
                  onClick={handleCheckConflicts}
                  disabled={isCheckingConflicts}
                  className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
                >
                  {isCheckingConflicts ? (
                    <span className="flex items-center gap-2"><i className="fa-solid fa-spinner animate-spin"></i> Verificando...</span>
                  ) : (
                    <span className="flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Verificar Conflitos (IA)</span>
                  )}
                </button>
                <button onClick={() => setIsTaskModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">+ Nova Atividade</button>
              </div>
            </div>

            <ConflictPanel conflicts={conflicts} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-3 space-y-10">
                <GanttChart tasks={filteredTasks} alertThresholdDays={activeProject.alertThresholdDays} />
                {scheduleView === 'kanban' ? (
                  <KanbanBoard
                    tasks={filteredTasks}
                    onUpdateStatus={(taskId, status) => updateTask(activeProject.id, taskId, { status })}
                    formatDate={formatDate}
                  />
                ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-100 dark:border-slate-700">
                      <tr>
                        <th className="px-10 py-7">Status</th>
                        <th className="px-10 py-7">Etapa & Disciplina</th>
                        <th className="px-10 py-7">Prazo</th>
                        <th className="px-10 py-7 text-right">Progresso Editável</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredTasks.map(t => (
                        <tr key={t.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="px-10 py-7">
                            <select value={t.status} onChange={(e) => updateTask(activeProject!.id, t.id, { status: e.target.value as TaskStatus })} className={`text-[10px] font-black px-4 py-1.5 rounded-full border-none outline-none ring-1 ring-inset ${STATUS_COLORS[t.status]}`}>
                              {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-10 py-7">
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200">{t.title}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{t.disciplineName}</p>
                          </td>
                          <td className="px-10 py-7">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-400">{formatDate(t.endDate)}</p>
                          </td>
                          <td className="px-10 py-7 text-right">
                             <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => handleAutoSyncTask(t.id)}
                                    title="Sincronizar progresso com a data atual"
                                    className="text-indigo-400 hover:text-indigo-600 transition-colors text-xs"
                                  >
                                    <i className="fa-solid fa-bolt-lightning"></i>
                                  </button>
                                  <div className="flex items-center border border-slate-100 rounded-lg px-2 py-1 bg-slate-50 focus-within:ring-1 focus-within:ring-indigo-300 transition-all">
                                    <input 
                                      type="number" 
                                      min="0" 
                                      max="100" 
                                      value={t.progress} 
                                      onChange={(e) => updateTask(activeProject!.id, t.id, { progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                                      className="w-10 bg-transparent text-right text-[10px] font-black text-indigo-600 outline-none border-none"
                                    />
                                    <span className="text-[10px] font-black text-indigo-400 ml-0.5">%</span>
                                  </div>
                                </div>
                                <div className="w-32 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${t.progress}%` }}></div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                )}
              </div>
              <aside className="space-y-10">
                <SimulationPanel tasks={activeProject.tasks} />
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Relatórios</h4>
                  <div className="space-y-3">
                    <button onClick={() => exportToExcel(activeProject)} className="w-full flex items-center justify-between p-5 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest">Planilha Excel <i className="fa-solid fa-file-excel"></i></button>
                    <button onClick={() => exportToPDF(activeProject)} className="w-full flex items-center justify-between p-5 bg-red-50 text-red-700 rounded-2xl hover:bg-red-100 transition-all font-black text-[10px] uppercase tracking-widest">Arquivo PDF <i className="fa-solid fa-file-pdf"></i></button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {activeTab === 'processos' && <ProcessManager processes={processes} onAdd={(p) => setProcesses([...processes, p])} onRemove={(id) => setProcesses(processes.filter(p => p.id !== id))} />}
        {activeTab === 'disciplinas' && activeProject && <DisciplineManager project={activeProject} onAddDiscipline={handleAddDiscipline} onRemoveDiscipline={handleRemoveDiscipline} onUpdateDiscipline={handleUpdateDiscipline} onDuplicateDiscipline={handleDuplicateDiscipline} />}
        {activeTab === 'colaboradores' && <CollaboratorManager collaborators={collaborators} onAdd={(c) => setCollaborators([...collaborators, c])} onRemove={(id) => setCollaborators(collaborators.filter(c => c.id !== id))} onUpdate={(id, name) => setCollaborators(collaborators.map(c => c.id === id ? { ...c, name } : c))} />}
        {activeTab === 'custos' && activeProject && <CostsManager project={activeProject} currencySymbol={settings.currencySymbol} />}
        {activeTab === 'cliente' && activeProject && <ClientArea project={activeProject} formatDate={formatDate} />}
        {activeTab === 'configuracoes' && <SettingsManager settings={settings} onUpdate={setSettings} />}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.6em]">
        E-BOOK FLOW &bull; EDITORIAL INTELLIGENCE SYSTEM &bull; 2024
      </footer>

      {isProjectModalOpen && <ProjectModal initialData={projectToEdit} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProject} />}
      {isTaskModalOpen && activeProject && <TaskModal project={activeProject} processes={processes} collaborators={collaborators} onClose={() => setIsTaskModalOpen(false)} onSave={addTask} />}
    </div>
  );
};

export default App;
