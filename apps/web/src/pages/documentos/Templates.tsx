import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { DocumentoTemplate, TipoDocumento } from "../../types";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select, Spinner } from "../../components/ui";

const fonteLabel: Record<string, string> = { helvetica: "Helvetica", times: "Times", courier: "Courier" };

export default function Templates() {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<TipoDocumento>("CERTIFICADO_ORIGEM");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    corPrimaria: "#0f766e",
    corFundo: "#ffffff",
    corTexto: "#111827",
    fonte: "helvetica",
    mostrarLogo: true,
    mostrarQr: true,
    mostrarRegistrosLegais: true,
    padrao: false,
  });
  const [error, setError] = useState("");
  const [bgUploadId, setBgUploadId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery<DocumentoTemplate[]>({
    queryKey: ["documento-templates", tipo],
    queryFn: async () => (await api.get("/documentos/templates", { params: { tipo } })).data,
  });

  const criar = useMutation({
    mutationFn: async () => api.post("/documentos/templates", { ...form, tipo }),
    onSuccess: () => {
      setShowForm(false);
      setError("");
      setForm({ ...form, nome: "" });
      queryClient.invalidateQueries({ queryKey: ["documento-templates", tipo] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar o modelo")),
  });

  const tornarPadrao = useMutation({
    mutationFn: async (id: string) => api.put(`/documentos/templates/${id}`, { padrao: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documento-templates", tipo] }),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/documentos/templates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documento-templates", tipo] }),
  });

  const uploadBackground = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("background", file);
      return api.post(`/documentos/templates/${id}/background`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onMutate: ({ id }) => setBgUploadId(id),
    onSettled: () => {
      setBgUploadId(null);
      queryClient.invalidateQueries({ queryKey: ["documento-templates", tipo] });
    },
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Personalizar documentos"
        subtitle="Cores, fundo, fonte e campos dos certificados e crachás"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
            {showForm ? "Fechar" : "+ Modelo"}
          </Button>
        }
      />

      <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
        {(["CERTIFICADO_ORIGEM", "CRACHA"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`flex-1 text-sm font-semibold rounded-lg py-1.5 ${tipo === t ? "bg-teal-700 text-white" : "text-slate-500"}`}
          >
            {t === "CERTIFICADO_ORIGEM" ? "Certificado" : "Crachá"}
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="space-y-3">
          <Input label="Nome do modelo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-sm">
              <span className="block mb-1 font-medium text-slate-600">Cor principal</span>
              <input type="color" value={form.corPrimaria} onChange={(e) => setForm({ ...form, corPrimaria: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200" />
            </label>
            <label className="block text-sm">
              <span className="block mb-1 font-medium text-slate-600">Cor de fundo</span>
              <input type="color" value={form.corFundo} onChange={(e) => setForm({ ...form, corFundo: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200" />
            </label>
            <label className="block text-sm">
              <span className="block mb-1 font-medium text-slate-600">Cor do texto</span>
              <input type="color" value={form.corTexto} onChange={(e) => setForm({ ...form, corTexto: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200" />
            </label>
          </div>
          <Select label="Fonte" value={form.fonte} onChange={(e) => setForm({ ...form, fonte: e.target.value })}>
            <option value="helvetica">Helvetica</option>
            <option value="times">Times</option>
            <option value="courier">Courier</option>
          </Select>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.mostrarLogo} onChange={(e) => setForm({ ...form, mostrarLogo: e.target.checked })} />
              Mostrar logo do criatório
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.mostrarQr} onChange={(e) => setForm({ ...form, mostrarQr: e.target.checked })} />
              Mostrar QR Code de verificação
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.mostrarRegistrosLegais}
                onChange={(e) => setForm({ ...form, mostrarRegistrosLegais: e.target.checked })}
              />
              Mostrar registros legais no rodapé
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.padrao} onChange={(e) => setForm({ ...form, padrao: e.target.checked })} />
              Definir como modelo padrão
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!form.nome || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar modelo"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !templates || templates.length === 0 ? (
        <EmptyState text="Nenhum modelo personalizado ainda. O padrão do sistema será usado." />
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id} className="!p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: t.corPrimaria }} />
                  <p className="font-medium text-slate-800">{t.nome}</p>
                </div>
                {t.padrao && <Badge color="teal">Padrão</Badge>}
              </div>
              <p className="text-xs text-slate-500">
                Fonte: {fonteLabel[t.fonte]} • {t.mostrarLogo ? "logo" : "sem logo"} • {t.mostrarQr ? "QR" : "sem QR"}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {!t.padrao && (
                  <button onClick={() => tornarPadrao.mutate(t.id)} className="text-xs font-semibold text-teal-700">
                    tornar padrão
                  </button>
                )}
                <label className="text-xs font-semibold text-teal-700 cursor-pointer">
                  {uploadBackground.isPending && bgUploadId === t.id ? "Enviando..." : "fundo personalizado"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBackground.mutate({ id: t.id, file });
                      e.target.value = "";
                    }}
                  />
                </label>
                <button onClick={() => remover.mutate(t.id)} className="text-xs text-red-600 font-semibold">
                  remover
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
