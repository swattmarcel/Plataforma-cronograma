import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

interface VerificacaoResponse {
  valido: boolean;
  tipo?: "CERTIFICADO_ORIGEM" | "CRACHA";
  geradoEm?: string;
  animal?: {
    nome: string;
    especie: string;
    mutacaoCor: string | null;
    sexo: string;
    anilha: string | null;
    dataNascimento: string | null;
  };
  criatorio?: {
    nome: string;
    registroIbama: string | null;
    registroClube: string | null;
    registroFederacao: string | null;
    logoUrl: string | null;
  };
}

export default function PublicVerify() {
  const { codigo } = useParams();
  const { data, isLoading } = useQuery<VerificacaoResponse>({
    queryKey: ["verificar", codigo],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/public/documentos/${codigo}`);
        return data;
      } catch {
        return { valido: false };
      }
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
        {isLoading ? (
          <p className="text-slate-500">Verificando...</p>
        ) : data?.valido ? (
          <>
            <div className="text-4xl mb-2">✅</div>
            <h1 className="text-lg font-bold text-green-700 mb-1">Documento autêntico</h1>
            <p className="text-sm text-slate-500 mb-4">
              {data.tipo === "CERTIFICADO_ORIGEM" ? "Certificado de origem" : "Crachá"} emitido por {data.criatorio?.nome}
            </p>
            <div className="text-left text-sm bg-slate-50 rounded-xl p-3 space-y-1">
              <p>
                <span className="text-slate-500">Animal:</span> <strong>{data.animal?.nome}</strong>
              </p>
              <p>
                <span className="text-slate-500">Espécie:</span> {data.animal?.especie}
                {data.animal?.mutacaoCor ? ` • ${data.animal.mutacaoCor}` : ""}
              </p>
              <p>
                <span className="text-slate-500">Sexo:</span> {data.animal?.sexo}
              </p>
              {data.animal?.anilha && (
                <p>
                  <span className="text-slate-500">Anilha:</span> {data.animal.anilha}
                </p>
              )}
              {data.geradoEm && (
                <p>
                  <span className="text-slate-500">Emitido em:</span> {new Date(data.geradoEm).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">🚫</div>
            <h1 className="text-lg font-bold text-red-700 mb-1">Documento não encontrado</h1>
            <p className="text-sm text-slate-500">Este código não corresponde a nenhum documento válido.</p>
          </>
        )}
      </div>
    </div>
  );
}
