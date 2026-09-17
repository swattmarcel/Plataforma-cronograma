
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

// Always use the process.env.API_KEY directly in the constructor as a named parameter
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const simulateScenario = async (tasks: Task[], scenario: string) => {
  // Use gemini-3-pro-preview for complex reasoning tasks like schedule impact analysis
  const response = await ai.models.generateContent({
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
  const response = await ai.models.generateContent({
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
