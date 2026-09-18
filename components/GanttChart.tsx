
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Task, TaskStatus } from '../types';

interface GanttChartProps {
  tasks: Task[];
  alertThresholdDays: number;
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks, alertThresholdDays }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const checkUrgency = (task: Task) => {
    if (task.status === TaskStatus.DONE) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(task.endDate + 'T23:59:59');
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= alertThresholdDays;
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!svgRef.current || tasks.length === 0) return;

    const sortedTasks = [...tasks].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const margin = { top: 60, right: 120, bottom: 60, left: 220 };
    const width = 1000 - margin.left - margin.right;
    const barHeight = 22;
    const barPadding = 22;
    const chartHeight = sortedTasks.length * (barHeight + barPadding);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const parseDate = d3.timeParse("%Y-%m-%d");
    const dates = sortedTasks.flatMap(t => [parseDate(t.startDate)!, parseDate(t.endDate)!]);
    
    const minDate = d3.min(dates)!;
    const maxDate = d3.max(dates)!;
    const xDomain = [
      d3.timeDay.offset(minDate, -5),
      d3.timeDay.offset(maxDate, 15)
    ];

    const x = d3.scaleTime().domain(xDomain).range([0, width]);
    const y = d3.scaleBand().domain(sortedTasks.map(t => t.id)).range([0, chartHeight]).padding(0.5);

    // Definição de Marcadores e Gradients
    const defs = svg.append("defs");
    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", "10")
      .attr("refY", "5")
      .attr("markerWidth", "6")
      .attr("markerHeight", "6")
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#cbd5e1");

    // Grid Horizontal e Vertical
    g.selectAll(".grid-line-v")
      .data(x.ticks(10))
      .enter()
      .append("line")
      .attr("x1", d => x(d))
      .attr("x2", d => x(d))
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .attr("stroke", "#f8fafc")
      .attr("stroke-width", 1);

    // Eixos
    g.append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(10).tickFormat(d3.timeFormat("%d %b") as any))
      .call(g => g.select(".domain").attr("stroke", "#e2e8f0"))
      .call(g => g.selectAll("text")
        .attr("fill", "#94a3b8")
        .style("font-size", "10px")
        .style("font-weight", "800")
        .attr("dy", "1.5em")
      );

    g.append("g")
      .call(d3.axisLeft(y).tickFormat((d) => {
        const t = sortedTasks.find(task => task.id === d);
        return t ? (t.title.length > 32 ? t.title.substring(0, 29) + "..." : t.title) : "";
      }))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text")
        .attr("fill", "#475569")
        .style("font-size", "10px")
        .style("font-weight", "900")
      );

    // Dependências Curvas Premium
    sortedTasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach(depId => {
          const depTask = sortedTasks.find(t => t.id === depId);
          if (depTask) {
            const startX = x(parseDate(depTask.endDate)!);
            const startY = y(depId)! + y.bandwidth() / 2;
            const endX = x(parseDate(task.startDate)!);
            const endY = y(task.id)! + y.bandwidth() / 2;
            
            const link = d3.linkHorizontal()({
              source: [startX, startY],
              target: [endX, endY]
            } as any);

            g.append("path")
              .attr("d", link!)
              .attr("fill", "none")
              .attr("stroke", "#e2e8f0")
              .attr("stroke-width", 1.5)
              .attr("marker-end", "url(#arrow)");
          }
        });
      }
    });

    // Linha de Hoje
    const today = new Date();
    if (today >= xDomain[0] && today <= xDomain[1]) {
      g.append("line")
        .attr("x1", x(today))
        .attr("x2", x(today))
        .attr("y1", -30)
        .attr("y2", chartHeight)
        .attr("stroke", "#6366f1")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
    }

    // Barras de Tarefas
    const bars = g.selectAll(".bar-group")
      .data(sortedTasks)
      .enter()
      .append("g")
      .attr("class", "bar-group");

    bars.append("rect")
      .attr("x", d => x(parseDate(d.startDate)!))
      .attr("y", d => y(d.id)!)
      .attr("width", d => Math.max(12, x(parseDate(d.endDate)!) - x(parseDate(d.startDate)!)))
      .attr("height", y.bandwidth())
      .attr("rx", 6)
      .attr("fill", d => {
        if (d.status === TaskStatus.DONE) return "#10b981";
        if (checkUrgency(d)) return "#f59e0b";
        if (d.status === TaskStatus.IN_PROGRESS) return "#6366f1";
        return "#f1f5f9";
      });

    bars.append("text")
      .attr("x", d => x(parseDate(d.endDate)!) + 15)
      .attr("y", d => y(d.id)! + y.bandwidth() / 2)
      .attr("dy", ".35em")
      .attr("fill", "#94a3b8")
      .style("font-size", "9px")
      .style("font-weight", "900")
      .text(d => `${d.progress}%`);

  }, [tasks, alertThresholdDays]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 p-12 transition-all shadow-2xl shadow-slate-100 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-4">
            <span className="w-2.5 h-10 bg-indigo-600 rounded-full"></span>
            Cronograma Operacional
          </h3>
          <p className="text-[10px] text-slate-300 font-black uppercase mt-2 tracking-widest">Visualização de {tasks.length} etapas filtradas</p>
        </div>
        <div className="flex flex-wrap gap-6 text-[9px] font-black uppercase text-slate-300">
           <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Finalizado</div>
           <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> Em Produção</div>
           <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Alerta</div>
           <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-100"></span> Planejado</div>
        </div>
      </div>
      
      <div className="overflow-x-auto no-scrollbar">
        {tasks.length > 0 ? (
          <svg ref={svgRef} className="w-full mx-auto" style={{ minWidth: "1000px" }} height={(tasks.length * 44) + 120}></svg>
        ) : (
          <div className="py-40 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 mx-auto rounded-full flex items-center justify-center">
              <i className="fa-solid fa-layer-group text-slate-200 text-4xl"></i>
            </div>
            <p className="text-slate-300 font-black uppercase text-[11px] tracking-[0.5em]">Nenhum processo no filtro atual</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;
