import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api, apiErrorMessage } from "../../lib/api";
import type { CandidatoImportacao } from "../../types";
import { Button, Card, Input, PageTitle, Select } from "../../components/ui";

export default function ImportarSispass() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [candidatos, setCandidatos] = useState<CandidatoImportacao[] | null>(null);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  const enviarPreview = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("pdf", file);
      return (await api.post("/importacao/sispass/preview", fd, { headers: { "Content-Type": "multipart/form-data" } })).data;
    },
    onSuccess: (data) => {
      setCandidatos(data.candidatos);
      setAviso(data.aviso);
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível ler o PDF")),
  });

  const confirmarImportacao = useMutation({
    mutationFn: async () =>
      api.post("/importacao/sispass/confirmar", {
        animais: (candidatos ?? []).map((c) => ({ nome: c.nome, especie: c.especie || "Não informado", anilha: c.anilha, sexo: c.sexo })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animais"] });
      navigate("/animais");
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível importar")),
  });

  function atualizarCandidato(idx: number, patch: Partial<CandidatoImportacao>) {
    setCandidatos((cs) => cs?.map((c, i) => (i === idx ? { ...c, ...patch } : c)) ?? null);
  }

  function removerCandidato(idx: number) {
    setCandidatos((cs) => cs?.filter((_, i) => i !== idx) ?? null);
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Importar do SISPASS" subtitle="Seu PDF vira seu plantel — confira antes de importar" />

      {!candidatos && (
        <Card className="space-y-3">
          <p className="text-sm text-slate-600">
            Envie o PDF exportado do SISPASS/IBAMA. A leitura é automática, mas pode não ser 100% precisa — você poderá
            conferir e corrigir cada linha antes de importar.
          </p>
          <label className="block">
            <span className="block mb-1 text-sm font-medium text-slate-600">Arquivo PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) enviarPreview.mutate(file);
              }}
              className="text-sm"
            />
          </label>
          {enviarPreview.isPending && <p className="text-sm text-slate-500">Lendo PDF...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </Card>
      )}

      {candidatos && (
        <>
          <Card className="!p-3">
            <p className="text-sm text-slate-600">{aviso}</p>
          </Card>

          {candidatos.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">
                Nenhum item reconhecido. Volte e tente outro arquivo, ou cadastre os animais manualmente pelo Plantel.
              </p>
              <Button variant="secondary" className="mt-3" onClick={() => setCandidatos(null)}>
                Tentar outro PDF
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {candidatos.map((c, i) => (
                  <Card key={i} className="!p-3 space-y-2">
                    <p className="text-[11px] text-slate-400 truncate">{c.linhaOriginal}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Nome" value={c.nome} onChange={(e) => atualizarCandidato(i, { nome: e.target.value })} />
                      <Input label="Espécie" value={c.especie} onChange={(e) => atualizarCandidato(i, { especie: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input label="Anilha" value={c.anilha} onChange={(e) => atualizarCandidato(i, { anilha: e.target.value })} />
                      <Select label="Sexo" value={c.sexo} onChange={(e) => atualizarCandidato(i, { sexo: e.target.value as any })}>
                        <option value="INDEFINIDO">Não sexado</option>
                        <option value="MACHO">Macho</option>
                        <option value="FEMEA">Fêmea</option>
                      </Select>
                    </div>
                    <button onClick={() => removerCandidato(i)} className="text-xs text-red-600 font-semibold">
                      remover da importação
                    </button>
                  </Card>
                ))}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button className="flex-1" disabled={confirmarImportacao.isPending} onClick={() => confirmarImportacao.mutate()}>
                  {confirmarImportacao.isPending ? "Importando..." : `Importar agora (${candidatos.length})`}
                </Button>
                <Button variant="secondary" onClick={() => setCandidatos(null)}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
