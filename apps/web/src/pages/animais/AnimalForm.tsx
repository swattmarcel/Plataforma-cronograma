import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal } from "../../types";
import { Button, Card, FieldGroup, Input, PageTitle, Select, Spinner, Textarea } from "../../components/ui";
import { ConsanguinidadeAlerta } from "../../components/ConsanguinidadeAlerta";

export default function AnimalForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: existing, isLoading } = useQuery<Animal>({
    queryKey: ["animal", id],
    queryFn: async () => (await api.get(`/animais/${id}`)).data,
    enabled: isEdit,
  });

  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const [form, setForm] = useState({
    nome: "",
    especie: "",
    mutacaoCor: "",
    anilha: "",
    microchip: "",
    sexo: "INDEFINIDO",
    dataNascimento: "",
    status: "ATIVO",
    paiId: "",
    maeId: "",
    observacoes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (existing) {
      setForm({
        nome: existing.nome,
        especie: existing.especie,
        mutacaoCor: existing.mutacaoCor ?? "",
        anilha: existing.anilha ?? "",
        microchip: existing.microchip ?? "",
        sexo: existing.sexo,
        dataNascimento: existing.dataNascimento ? existing.dataNascimento.slice(0, 10) : "",
        status: existing.status,
        paiId: existing.paiId ?? "",
        maeId: existing.maeId ?? "",
        observacoes: existing.observacoes ?? "",
      });
    }
  }, [existing]);

  const machos = (animais ?? []).filter((a) => a.sexo === "MACHO" && a.id !== id);
  const femeas = (animais ?? []).filter((a) => a.sexo === "FEMEA" && a.id !== id);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        mutacaoCor: form.mutacaoCor || null,
        anilha: form.anilha || null,
        microchip: form.microchip || null,
        dataNascimento: form.dataNascimento || null,
        paiId: form.paiId || null,
        maeId: form.maeId || null,
        observacoes: form.observacoes || null,
      };

      let animalId = id;
      if (isEdit) {
        await api.put(`/animais/${id}`, payload);
      } else {
        const { data } = await api.post("/animais", payload);
        animalId = data.id;
      }

      if (fotoFile && animalId) {
        const fd = new FormData();
        fd.append("foto", fotoFile);
        await api.post(`/animais/${animalId}/foto`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }

      navigate(`/animais/${animalId}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar o animal"));
    } finally {
      setSaving(false);
    }
  }

  if (isEdit && isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <PageTitle title={isEdit ? "Editar animal" : "Novo animal"} />

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-3">
          <Input label="Nome *" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <FieldGroup>
            <Input label="Espécie *" required value={form.especie} onChange={(e) => setForm({ ...form, especie: e.target.value })} />
            <Input label="Mutação/Cor" value={form.mutacaoCor} onChange={(e) => setForm({ ...form, mutacaoCor: e.target.value })} />
          </FieldGroup>
          <FieldGroup>
            <Select label="Sexo" value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="INDEFINIDO">Não sexado</option>
              <option value="MACHO">Macho</option>
              <option value="FEMEA">Fêmea</option>
            </Select>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ATIVO">Ativo</option>
              <option value="RESERVADO">Reservado</option>
              <option value="VENDIDO">Vendido</option>
              <option value="FALECIDO">Falecido</option>
              <option value="FUGIU">Fugiu</option>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Input label="Anilha" value={form.anilha} onChange={(e) => setForm({ ...form, anilha: e.target.value })} />
            <Input label="Microchip" value={form.microchip} onChange={(e) => setForm({ ...form, microchip: e.target.value })} />
          </FieldGroup>
          <Input
            label="Data de nascimento"
            type="date"
            value={form.dataNascimento}
            onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
          />
          <label className="block text-sm">
            <span className="block mb-1 font-medium text-slate-600">Foto</span>
            <input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </label>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-slate-800">Genealogia</h2>
          <p className="text-xs text-slate-500 -mt-2">
            Selecionar pai e mãe monta a árvore genealógica automaticamente e permite calcular a consanguinidade.
          </p>
          <FieldGroup>
            <Select label="Pai" value={form.paiId} onChange={(e) => setForm({ ...form, paiId: e.target.value })}>
              <option value="">— não informado —</option>
              {machos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                  {m.anilha ? ` (${m.anilha})` : ""}
                </option>
              ))}
            </Select>
            <Select label="Mãe" value={form.maeId} onChange={(e) => setForm({ ...form, maeId: e.target.value })}>
              <option value="">— não informada —</option>
              {femeas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                  {f.anilha ? ` (${f.anilha})` : ""}
                </option>
              ))}
            </Select>
          </FieldGroup>
          {form.paiId && form.maeId && <ConsanguinidadeAlerta paiId={form.paiId} maeId={form.maeId} />}
        </Card>

        <Card>
          <Textarea label="Observações" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
