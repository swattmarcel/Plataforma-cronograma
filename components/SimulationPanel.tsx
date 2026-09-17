
import React, { useState } from 'react';
import { simulateScenario } from '../services/geminiService';
import { Task } from '../types';

interface SimulationPanelProps {
  tasks: Task[];
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ tasks }) => {
  const [scenario, setScenario] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!scenario) return;
    setLoading(true);
    try {
      const analysis = await simulateScenario(tasks, scenario);
      setResult(analysis);
    } catch (err) {
      setResult("Erro ao simular cenário. Verifique sua chave de API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 h-full">
      <div className="flex items-center gap-2 mb-4">
        <i className="fa-solid fa-wand-magic-sparkles text-indigo-600 text-xl"></i>
        <h3 className="text-lg font-bold text-indigo-900">Simulador de Impacto (IA)</h3>
      </div>
      
      <p className="text-sm text-indigo-700 mb-4 font-medium">
        Descreva uma situação hipotética para entender os impactos no seu cronograma editorial.
      </p>

      <textarea
        className="w-full p-3 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-h-[100px] transition-all"
        placeholder="Ex: E se o revisor ficar doente por 5 dias? / E se o cliente adiantar o lançamento em uma semana?"
        value={scenario}
        onChange={(e) => setScenario(e.target.value)}
      />

      <button
        onClick={handleSimulate}
        disabled={loading || !scenario}
        className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 uppercase text-[10px] tracking-widest"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <i className="fa-solid fa-spinner animate-spin"></i> Analisando...
          </span>
        ) : "Simular Impacto"}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-indigo-100 shadow-inner max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
          <h4 className="font-black text-indigo-900 text-[10px] uppercase mb-2 tracking-widest">Relatório de Simulação</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;
