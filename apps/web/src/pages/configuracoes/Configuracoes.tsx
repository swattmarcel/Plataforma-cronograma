import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { api, apiErrorMessage } from "../../lib/api";
import { Button, Card, FieldGroup, Input, PageTitle } from "../../components/ui";

export default function Configuracoes() {
  const { criatorio, refreshCriatorio } = useAuth();
  const [form, setForm] = useState({
    nome: "",
    corMacho: "#2563eb",
    corFemea: "#db2777",
    registroIbama: "",
    registroClube: "",
    registroFederacao: "",
    cidade: "",
    uf: "",
    whatsapp: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (criatorio) {
      setForm({
        nome: criatorio.nome,
        corMacho: criatorio.corMacho,
        corFemea: criatorio.corFemea,
        registroIbama: criatorio.registroIbama ?? "",
        registroClube: criatorio.registroClube ?? "",
        registroFederacao: criatorio.registroFederacao ?? "",
        cidade: criatorio.cidade ?? "",
        uf: criatorio.uf ?? "",
        whatsapp: criatorio.whatsapp ?? "",
      });
    }
  }, [criatorio]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      await api.put("/criatorios/me", form);
      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);
        await api.post("/criatorios/me/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setLogoFile(null);
      }
      await refreshCriatorio();
      setSuccess(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle title="Configurações" subtitle="Personalize seu criatório (white-label)" />

      <form onSubmit={onSubmit} className="space-y-4">
        <Card className="space-y-3">
          <h2 className="font-semibold text-slate-800">Identidade</h2>
          <Input label="Nome do criatório" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <label className="block text-sm">
            <span className="block mb-1 font-medium text-slate-600">Logomarca</span>
            {criatorio?.logoUrl && <img src={criatorio.logoUrl} alt="Logo atual" className="h-16 w-16 rounded-xl object-cover mb-2 bg-slate-50" />}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </label>
          <FieldGroup>
            <label className="block text-sm">
              <span className="block mb-1 font-medium text-slate-600">Cor crachá macho</span>
              <input type="color" value={form.corMacho} onChange={(e) => setForm({ ...form, corMacho: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200" />
            </label>
            <label className="block text-sm">
              <span className="block mb-1 font-medium text-slate-600">Cor crachá fêmea</span>
              <input type="color" value={form.corFemea} onChange={(e) => setForm({ ...form, corFemea: e.target.value })} className="h-10 w-full rounded-xl border border-slate-200" />
            </label>
          </FieldGroup>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-slate-800">Dados legais (rodapé dos PDFs)</h2>
          <Input label="Registro IBAMA/SISPASS" value={form.registroIbama} onChange={(e) => setForm({ ...form, registroIbama: e.target.value })} />
          <Input label="Clube" value={form.registroClube} onChange={(e) => setForm({ ...form, registroClube: e.target.value })} />
          <Input label="Federação" value={form.registroFederacao} onChange={(e) => setForm({ ...form, registroFederacao: e.target.value })} />
        </Card>

        <Card className="space-y-3">
          <h2 className="font-semibold text-slate-800">Contato</h2>
          <FieldGroup>
            <Input label="Cidade" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
            <Input label="UF" maxLength={2} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value.toUpperCase() })} />
          </FieldGroup>
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Configurações salvas!</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </Button>
      </form>
    </div>
  );
}
