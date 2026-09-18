import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Animal, PedigreeNode } from "../../types";
import { Badge, Button, Card, PageTitle, Select, Spinner } from "../../components/ui";
import { PedigreeTree } from "../../components/PedigreeTree";

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [geracoes, setGeracoes] = useState(3);

  const { data: animal, isLoading } = useQuery<Animal>({
    queryKey: ["animal", id],
    queryFn: async () => (await api.get(`/animais/${id}`)).data,
  });

  const { data: pedigree } = useQuery<PedigreeNode>({
    queryKey: ["pedigree", id, geracoes],
    queryFn: async () => (await api.get(`/animais/${id}/pedigree`, { params: { geracoes } })).data,
    enabled: Boolean(id),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/animais/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["animais"] });
      navigate("/animais");
    },
  });

  const gerarDocumento = useMutation({
    mutationFn: async (tipo: "CERTIFICADO_ORIGEM" | "CRACHA") => {
      const { data } = await api.post("/documentos", { animalId: id, tipo, geracoes });
      return data;
    },
    onSuccess: (doc) => {
      window.open(`${api.defaults.baseURL}/documentos/${doc.id}/download`, "_blank");
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
    },
  });

  if (isLoading || !animal) return <Spinner />;

  const sexoColor = animal.sexo === "MACHO" ? "text-blue-600" : animal.sexo === "FEMEA" ? "text-pink-600" : "text-slate-400";

  return (
    <div className="space-y-4">
      <PageTitle
        title={animal.nome}
        subtitle={animal.especie}
        action={
          <Link to={`/animais/${id}/editar`} className="text-sm font-semibold text-teal-700">
            Editar
          </Link>
        }
      />

      <Card className="flex gap-3">
        {animal.fotoUrl ? (
          <img src={animal.fotoUrl} alt={animal.nome} className="h-20 w-20 rounded-xl object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center text-3xl">🐾</div>
        )}
        <div className="flex-1 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${sexoColor}`}>{animal.sexo}</span>
            <Badge>{animal.status}</Badge>
          </div>
          {animal.mutacaoCor && <p className="text-slate-600">Mutação/Cor: {animal.mutacaoCor}</p>}
          {animal.anilha && <p className="text-slate-600">Anilha: {animal.anilha}</p>}
          {animal.microchip && <p className="text-slate-600">Microchip: {animal.microchip}</p>}
          {animal.dataNascimento && (
            <p className="text-slate-600">Nascimento: {new Date(animal.dataNascimento).toLocaleDateString("pt-BR")}</p>
          )}
        </div>
      </Card>

      {animal.observacoes && (
        <Card>
          <h2 className="font-semibold text-slate-800 mb-1">Observações</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{animal.observacoes}</p>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">Árvore genealógica</h2>
          <Select value={geracoes} onChange={(e) => setGeracoes(Number(e.target.value))} className="!py-1 !px-2 text-xs w-auto">
            <option value={2}>2 gerações</option>
            <option value={3}>3 gerações</option>
            <option value={4}>4 gerações</option>
          </Select>
        </div>
        {pedigree ? (
          <PedigreeTree root={pedigree} geracoes={geracoes} />
        ) : (
          <p className="text-sm text-slate-400">Sem dados de genealogia.</p>
        )}
      </Card>

      {((animal.filhosComoPai?.length ?? 0) > 0 || (animal.filhosComoMae?.length ?? 0) > 0) && (
        <Card>
          <h2 className="font-semibold text-slate-800 mb-2">Filhotes</h2>
          <ul className="space-y-1 text-sm">
            {[...(animal.filhosComoPai ?? []), ...(animal.filhosComoMae ?? [])].map((f) => (
              <li key={f.id}>
                <Link to={`/animais/${f.id}`} className="text-teal-700">
                  {f.nome}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="space-y-2">
        <h2 className="font-semibold text-slate-800">Documentos</h2>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => gerarDocumento.mutate("CERTIFICADO_ORIGEM")} disabled={gerarDocumento.isPending}>
            📄 Certificado de origem
          </Button>
          <Button variant="secondary" onClick={() => gerarDocumento.mutate("CRACHA")} disabled={gerarDocumento.isPending}>
            🏷️ Crachá de gaiola
          </Button>
        </div>
      </Card>

      <Button variant="danger" className="w-full" onClick={() => confirm("Remover este animal?") && deleteMutation.mutate()}>
        Remover animal
      </Button>
    </div>
  );
}
