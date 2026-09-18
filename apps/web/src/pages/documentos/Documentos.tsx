import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Documento } from "../../types";
import { Badge, Card, EmptyState, PageTitle, Spinner } from "../../components/ui";

export default function Documentos() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Documento[]>({
    queryKey: ["documentos"],
    queryFn: async () => (await api.get("/documentos")).data,
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/documentos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documentos"] }),
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Documentos"
        subtitle="Certificados de origem e crachás emitidos"
        action={
          <Link to="/documentos/templates" className="text-sm font-semibold text-teal-700">
            🎨 Personalizar
          </Link>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState text="Nenhum documento gerado ainda. Emita pela página de um animal." />
      ) : (
        <div className="space-y-2">
          {data.map((doc) => (
            <Card key={doc.id} className="!p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{doc.animal.nome}</p>
                <p className="text-xs text-slate-500">
                  {doc.tipo === "CERTIFICADO_ORIGEM" ? "Certificado de origem" : "Crachá"} • {new Date(doc.geradoEm).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-[10px] text-slate-400 truncate">Código: {doc.codigoVerificacao}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge color="teal">{doc.geracoes}g</Badge>
                <a
                  href={`${api.defaults.baseURL}/documentos/${doc.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-700"
                >
                  Abrir PDF
                </a>
                <button onClick={() => remover.mutate(doc.id)} className="text-xs text-slate-400">
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
