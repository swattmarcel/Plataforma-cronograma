
import { Task, TaskStatus, Project, ProcessTemplate, Collaborator } from './types';

export const INITIAL_PROCESSES: ProcessTemplate[] = [
  { id: 'pr1', name: 'Revisão Pedagógica', defaultDurationDays: 5 },
  { id: 'pr2', name: 'Diagramação', defaultDurationDays: 10 },
  { id: 'pr3', name: 'Revisão Ortográfica', defaultDurationDays: 4 },
  { id: 'pr4', name: 'Conversão ePub', defaultDurationDays: 3 },
  { id: 'pr5', name: 'Validação Final', defaultDurationDays: 2 },
];

export const INITIAL_COLLABORATORS: Collaborator[] = [
  { id: 'c1', name: 'Ana Silva' },
  { id: 'c2', name: 'João Pedro' },
  { id: 'c3', name: 'Mariana Luz' },
  { id: 'c4', name: 'Carlos Oliveira' },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Coleção Horizonte 2025',
    clientName: 'Editora Nacional',
    manager: 'Ana Silva',
    deadline: '2025-01-15',
    alertThresholdDays: 3,
    isArchived: false,
    disciplines: [
      { id: 'd1', name: 'História', projectId: 'p1' },
      { id: 'd2', name: 'Geografia', projectId: 'p1' },
      { id: 'd3', name: 'Administração', projectId: 'p1' }
    ],
    tasks: [
      {
        id: 't1',
        projectId: 'p1',
        disciplineId: 'd1',
        disciplineName: 'História',
        processId: 'pr1',
        title: 'Revisão Pedagógica - História',
        assignee: 'João Pedro',
        startDate: '2024-11-01',
        endDate: '2024-11-06',
        status: TaskStatus.DONE,
        progress: 100,
        cost: 450.00,
        dependencies: []
      },
      {
        id: 't2',
        projectId: 'p1',
        disciplineId: 'd2',
        disciplineName: 'Geografia',
        processId: 'pr1',
        title: 'Revisão Pedagógica - Geografia',
        assignee: 'Mariana Luz',
        startDate: '2024-11-04',
        endDate: '2024-11-09',
        status: TaskStatus.IN_PROGRESS,
        progress: 45,
        cost: 450.00,
        dependencies: []
      }
    ]
  }
];

export const STATUS_COLORS = {
  [TaskStatus.TODO]: 'bg-slate-200 text-slate-700',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700',
  [TaskStatus.REVIEW]: 'bg-amber-100 text-amber-700',
  [TaskStatus.DONE]: 'bg-green-100 text-green-700',
  [TaskStatus.BLOCKED]: 'bg-red-100 text-red-700',
};
