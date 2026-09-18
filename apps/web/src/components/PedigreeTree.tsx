import type { PedigreeNode } from "../types";

function NodeBox({ node }: { node: PedigreeNode | null }) {
  if (!node) {
    return (
      <div className="flex-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] text-slate-400 flex items-center justify-center min-h-[38px]">
        não informado
      </div>
    );
  }
  const color = node.sexo === "MACHO" ? "border-blue-200 bg-blue-50 text-blue-800" : node.sexo === "FEMEA" ? "border-pink-200 bg-pink-50 text-pink-800" : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <div className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium leading-tight min-h-[38px] flex flex-col justify-center ${color}`}>
      <span className="truncate">{node.nome}</span>
      {node.anilha && <span className="text-[10px] opacity-70 truncate">{node.anilha}</span>}
    </div>
  );
}

function Branch({ node, depth, maxDepth }: { node: PedigreeNode | null; depth: number; maxDepth: number }) {
  if (depth > maxDepth) return null;
  return (
    <div className="flex items-stretch gap-2 flex-1">
      <NodeBox node={node} />
      {depth < maxDepth && (
        <div className="flex flex-col gap-2 flex-1">
          <Branch node={node?.pai ?? null} depth={depth + 1} maxDepth={maxDepth} />
          <Branch node={node?.mae ?? null} depth={depth + 1} maxDepth={maxDepth} />
        </div>
      )}
    </div>
  );
}

export function PedigreeTree({ root, geracoes }: { root: PedigreeNode | null; geracoes: number }) {
  if (!root) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ minWidth: geracoes * 140 }}>
      <div className="flex flex-col gap-2 flex-1">
        <Branch node={root.pai} depth={1} maxDepth={geracoes} />
        <Branch node={root.mae} depth={1} maxDepth={geracoes} />
      </div>
    </div>
  );
}
