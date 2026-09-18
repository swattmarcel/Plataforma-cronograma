
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Criado sob demanda: instanciar no carregamento do módulo derruba o app
// inteiro (a lib lança erro se não houver apiKey) mesmo quando o usuário
// nunca usa os recursos de IA e não configurou a chave.
let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const simulateScenario = async (tasks: Task[], scenario: string) => {
  // Use gemini-3-pro-preview for complex reasoning tasks like schedule impact analysis
  const response = await getAI().models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analise o cronograma de produção de ebooks e simule o impacto do seguinte cenário: "${scenario}". 
    
    Tarefas Atuais: ${JSON.stringify(tasks.map(t => ({ title: t.title, start: t.startDate, end: t.endDate, status: t.status, assignee: t.assignee })))}
    
    Retorne uma análise detalhada sobre atrasos em cascata, conflitos de recursos (pessoas sobrecarregadas) e sugestões de mitigação em português.`,
    config: {
      temperature: 0.7,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  // Access text directly as a property, not a method
  return response.text;
};

export const checkConflictsIA = async (tasks: Task[]) => {
  // Use gemini-3-pro-preview for advanced reasoning and conflict detection
  const response = await getAI().models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Identifique conflitos lógicos no cronograma de ebooks abaixo. Verifique sobreposição de datas para o mesmo colaborador e dependências impossíveis.
    
    Dados: ${JSON.stringify(tasks)}
    
    Retorne em formato JSON uma lista de conflitos.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conflicts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                relatedTaskIds: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["type", "description", "severity"]
            }
          }
        }
      }
    }
  });

  try {
    // Access text directly as a property
    const data = JSON.parse(response.text || '{"conflicts": []}');
    return data.conflicts;
  } catch (e) {
    return [];
  }
};
