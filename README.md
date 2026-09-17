# E-Book Flow — Gerenciador de Projetos para Materiais Didáticos

Plataforma para gestão de cronogramas de produção de materiais didáticos (livros, apostilas, e-books), com cronograma em Gráfico de Gantt, controle de disciplinas, equipe, custos e detecção de conflitos assistida por IA.

## Funcionalidades

- **Projetos**: cadastro, arquivamento e acompanhamento de progresso de múltiplos projetos editoriais.
- **Cronograma**: Gráfico de Gantt interativo com dependências entre etapas, filtros por disciplina/status e sincronização automática de progresso pela data.
- **Disciplinas**: organização das etapas por disciplina/área (ex.: História, Geografia, Matemática), com duplicação rápida de disciplinas e suas tarefas.
- **Processos**: modelos de etapas reutilizáveis (revisão pedagógica, diagramação, revisão ortográfica, conversão ePub, validação final) com duração padrão.
- **Equipe**: cadastro dos colaboradores responsáveis pelas tarefas.
- **Custos**: visão consolidada do orçamento total, valor executado e custos por disciplina/responsável.
- **Área do Cliente**: painel simplificado, somente leitura, com progresso geral, por disciplina e próximas entregas — pronto para compartilhar com o cliente/editora.
- **Configurações**: tema claro/escuro, formato de data, símbolo monetário e backup/limpeza dos dados locais.
- **IA (Gemini)**: simulação de impacto de cenários hipotéticos no cronograma e verificação automática de conflitos (sobreposição de agenda, dependências impossíveis).
- **Exportação**: relatórios em Excel e PDF por projeto.

Os dados são persistidos localmente no navegador (`localStorage`).

## Rodando localmente

**Pré-requisitos:** Node.js

1. Instale as dependências:
   ```
   npm install
   ```
2. Configure a chave da API Gemini: copie `.env.example` para `.env.local` e defina `GEMINI_API_KEY` com sua chave (necessária apenas para os recursos de IA — simulação de cenários e verificação de conflitos).
3. Rode a aplicação:
   ```
   npm run dev
   ```
4. Para gerar a build de produção:
   ```
   npm run build
   ```
