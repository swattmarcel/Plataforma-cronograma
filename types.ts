
export enum TaskStatus {
  TODO = 'A Fazer',
  IN_PROGRESS = 'Em Progresso',
  REVIEW = 'Em Revisão',
  DONE = 'Concluído',
  BLOCKED = 'Bloqueado'
}

export interface ProcessTemplate {
  id: string;
  name: string;
  defaultDurationDays: number;
}

export interface Discipline {
  id: string;
  name: string;
  projectId: string;
}

export interface Collaborator {
  id: string;
  name: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  currencySymbol: string;
  language: 'pt-BR' | 'en-US';
}

export interface Task {
  id: string;
  projectId: string;
  disciplineId: string;
  disciplineName: string;
  processId: string;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  progress: number;
  cost: number;
  dependencies: string[];
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  manager: string;
  deadline: string;
  alertThresholdDays: number;
  isArchived: boolean;
  disciplines: Discipline[];
  tasks: Task[];
}

export interface Conflict {
  type: 'RECURSO' | 'CRONOGRAMA' | 'LOGICA';
  description: string;
  severity: 'ALTA' | 'MÉDIA' | 'BAIXA';
  relatedTaskIds: string[];
}
