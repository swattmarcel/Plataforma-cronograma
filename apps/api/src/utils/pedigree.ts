import { prisma } from "../config/prisma";

const MAX_GEN = 8;

export interface AnimalNode {
  id: string;
  paiId: string | null;
  maeId: string | null;
}

type AnimalMap = Map<string, AnimalNode>;

interface AncestorPath {
  ancestorId: string;
  generation: number;
  chain: string[];
}

function collectAncestorPaths(startId: string, map: AnimalMap, maxGen: number): AncestorPath[] {
  const results: AncestorPath[] = [];

  function walk(currentId: string, depth: number, chain: string[]) {
    const node = map.get(currentId);
    if (!node) return;
    const parents: Array<string | null> = [node.paiId, node.maeId];
    for (const parentId of parents) {
      if (!parentId) continue;
      const newChain = [...chain, parentId];
      results.push({ ancestorId: parentId, generation: depth, chain: newChain });
      if (depth < maxGen) {
        walk(parentId, depth + 1, newChain);
      }
    }
  }

  walk(startId, 1, []);
  return results;
}

function computeF(sireId: string | null, damId: string | null, map: AnimalMap, memo: Map<string, number>): number {
  if (!sireId || !damId) return 0;

  const sirePaths = collectAncestorPaths(sireId, map, MAX_GEN);
  const damPaths = collectAncestorPaths(damId, map, MAX_GEN);
  if (sirePaths.length === 0 || damPaths.length === 0) return 0;

  let sum = 0;
  for (const sp of sirePaths) {
    for (const dp of damPaths) {
      if (sp.ancestorId !== dp.ancestorId) continue;
      const spInner = new Set(sp.chain.slice(0, -1));
      const overlaps = dp.chain.slice(0, -1).some((id) => spInner.has(id));
      if (overlaps) continue;

      const fca = getIndividualF(sp.ancestorId, map, memo);
      sum += Math.pow(0.5, sp.generation + dp.generation + 1) * (1 + fca);
    }
  }

  return Math.min(1, sum);
}

function getIndividualF(animalId: string, map: AnimalMap, memo: Map<string, number>): number {
  if (memo.has(animalId)) return memo.get(animalId)!;
  memo.set(animalId, 0);
  const node = map.get(animalId);
  const f = node ? computeF(node.paiId, node.maeId, map, memo) : 0;
  memo.set(animalId, f);
  return f;
}

/**
 * Coeficiente de consanguinidade (método de Wright) de uma ninhada hipotética
 * entre `sireId` e `damId`, entre 0 e 1. Requer o pedigree completo (ou o
 * quanto estiver cadastrado) dos ancestrais de ambos os animais.
 */
export function calculateInbreedingCoefficient(
  sireId: string,
  damId: string,
  animals: AnimalNode[]
): number {
  const map: AnimalMap = new Map(animals.map((a) => [a.id, a]));
  const memo = new Map<string, number>();
  return computeF(sireId, damId, map, memo);
}

/**
 * Busca todos os animais de um criatório em formato reduzido (id/pai/mãe)
 * para alimentar o cálculo de consanguinidade sem múltiplas idas ao banco.
 */
export async function fetchAnimalGraph(criatorioId: string): Promise<AnimalNode[]> {
  const animais = await prisma.animal.findMany({
    where: { criatorioId },
    select: { id: true, paiId: true, maeId: true },
  });
  return animais;
}

export interface PedigreeNode {
  id: string;
  nome: string;
  anilha: string | null;
  sexo: string;
  mutacaoCor: string | null;
  fotoUrl: string | null;
  pai: PedigreeNode | null;
  mae: PedigreeNode | null;
}

/**
 * Monta a árvore genealógica (pedigree) de um animal até N gerações,
 * usada tanto na tela de detalhe quanto no PDF do certificado de origem.
 */
export async function buildPedigreeTree(animalId: string, geracoes: number): Promise<PedigreeNode | null> {
  const cache = new Map<string, PedigreeNode | null>();

  async function load(id: string | null, depth: number): Promise<PedigreeNode | null> {
    if (!id || depth > geracoes) return null;
    if (cache.has(id)) return cache.get(id)!;

    const animal = await prisma.animal.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        anilha: true,
        sexo: true,
        mutacaoCor: true,
        fotoUrl: true,
        paiId: true,
        maeId: true,
      },
    });
    if (!animal) {
      cache.set(id, null);
      return null;
    }

    const node: PedigreeNode = {
      id: animal.id,
      nome: animal.nome,
      anilha: animal.anilha,
      sexo: animal.sexo,
      mutacaoCor: animal.mutacaoCor,
      fotoUrl: animal.fotoUrl,
      pai: depth < geracoes ? await load(animal.paiId, depth + 1) : null,
      mae: depth < geracoes ? await load(animal.maeId, depth + 1) : null,
    };
    cache.set(id, node);
    return node;
  }

  return load(animalId, 1);
}
