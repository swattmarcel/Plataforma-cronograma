import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { Animal } from "../../types";
import { Badge, Card, EmptyState, Input, PageTitle, Select, Spinner } from "../../components/ui";

const statusColor: Record<string, "green" | "blue" | "slate" | "red" | "amber"> = {
  ATIVO: "green",
  RESERVADO: "amber",
  VENDIDO: "blue",
  FALECIDO: "slate",
  FUGIU: "red",
};

export default function AnimaisList() {
  const [q, setQ] = useState("");
  const [sexo, setSexo] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<Animal[]>({
    queryKey: ["animais", { q, sexo, status }],
    queryFn: async () =>
      (
        await api.get("/animais", {
          params: { q: q || undefined, sexo: sexo || undefined, status: status || undefined },
        })
      ).data,
  });

  const total = data?.length ?? 0;

  return (
    <div className="space-y-4">
      <PageTitle
        title="Plantel"
        subtitle={`${total} animal(is) cadastrado(s)`}
        action={
          <Link to="/animais/novo" className="bg-teal-700 text-white rounded-xl px-3 py-2 text-sm font-semibold">
            + Novo
          </Link>
        }
      />

      <Card className="!p-3 space-y-2">
        <Input placeholder="Buscar por nome, anilha ou microchip" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Select value={sexo} onChange={(e) => setSexo(e.target.value)}>
            <option value="">Todos os sexos</option>
            <option value="MACHO">Macho</option>
            <option value="FEMEA">Fêmea</option>
            <option value="INDEFINIDO">Não sexado</option>
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ATIVO">Ativo</option>
            <option value="RESERVADO">Reservado</option>
            <option value="VENDIDO">Vendido</option>
            <option value="FALECIDO">Falecido</option>
            <option value="FUGIU">Fugiu</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : total === 0 ? (
        <EmptyState text="Nenhum animal encontrado. Cadastre o primeiro do seu plantel!" />
      ) : (
        <div className="space-y-2">
          {data!.map((animal) => (
            <AnimalRow key={animal.id} animal={animal} />
          ))}
        </div>
      )}
    </div>
  );
}

function AnimalRow({ animal }: { animal: Animal }) {
  const sexoIcon = useMemo(() => (animal.sexo === "MACHO" ? "♂" : animal.sexo === "FEMEA" ? "♀" : "•"), [animal.sexo]);
  const sexoColor = animal.sexo === "MACHO" ? "text-blue-600" : animal.sexo === "FEMEA" ? "text-pink-600" : "text-slate-400";

  return (
    <Link to={`/animais/${animal.id}`}>
      <Card className="!p-3 flex items-center gap-3">
        {animal.fotoUrl ? (
          <img src={animal.fotoUrl} alt={animal.nome} className="h-12 w-12 rounded-xl object-cover flex-shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">🐾</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800 truncate">{animal.nome}</span>
            <span className={`font-bold ${sexoColor}`}>{sexoIcon}</span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {animal.especie}
            {animal.mutacaoCor ? ` • ${animal.mutacaoCor}` : ""}
            {animal.anilha ? ` • ${animal.anilha}` : ""}
          </p>
        </div>
        <Badge color={statusColor[animal.status]}>{animal.status}</Badge>
      </Card>
    </Link>
  );
}
