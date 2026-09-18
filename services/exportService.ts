
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task } from '../types';

export const exportToExcel = (project: Project) => {
  const worksheetData = [
    ["Projeto:", project.name],
    ["Cliente:", project.clientName],
    ["Prazo Final:", project.deadline],
    [], // Linha vazia
    ["Título", "Disciplina", "Processo", "Responsável", "Início", "Fim", "Status", "Progresso (%)", "Custo (R$)"]
  ];

  project.tasks.forEach(task => {
    worksheetData.push([
      task.title,
      task.disciplineName,
      task.processId, // Simplificado ou poderia ser o nome amigável
      task.assignee,
      task.startDate,
      task.endDate,
      task.status,
      task.progress.toString(),
      task.cost.toFixed(2)
    ]);
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cronograma");
  
  XLSX.writeFile(workbook, `${project.name.replace(/\s+/g, '_')}_cronograma.xlsx`);
};

export const exportToPDF = (project: Project) => {
  const doc = new jsPDF();
  const totalCost = project.tasks.reduce((acc, t) => acc + t.cost, 0);
  const completedTasks = project.tasks.filter(t => t.status === 'Concluído').length;
  const progress = project.tasks.length > 0 ? Math.round((completedTasks / project.tasks.length) * 100) : 0;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text("E-Book Flow", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Relatório de Produção Editorial", 14, 26);
  
  doc.line(14, 30, 196, 30);

  // Detalhes do Projeto
  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(project.name, 14, 40);
  
  doc.setFontSize(10);
  doc.text(`Cliente: ${project.clientName}`, 14, 46);
  doc.text(`Prazo Final: ${project.deadline}`, 14, 51);
  doc.text(`Progresso Geral: ${progress}%`, 14, 56);
  doc.text(`Custo Estimado Total: R$ ${totalCost.toFixed(2)}`, 14, 61);

  // Tabela de Tarefas
  const tableColumn = ["Tarefa", "Responsável", "Início", "Fim", "Status", "%"];
  const tableRows: any[] = [];

  project.tasks.forEach(task => {
    const taskData = [
      task.title,
      task.assignee,
      task.startDate,
      task.endDate,
      task.status,
      `${task.progress}%`
    ];
    tableRows.push(taskData);
  });

  autoTable(doc, {
    startY: 70,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 },
  });

  doc.save(`${project.name.replace(/\s+/g, '_')}_relatorio.pdf`);
};
