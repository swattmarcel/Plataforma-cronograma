export type Sexo = "MACHO" | "FEMEA" | "INDEFINIDO";
export type StatusAnimal = "ATIVO" | "RESERVADO" | "VENDIDO" | "FALECIDO" | "FUGIU";
export type StatusNinhada = "EM_ANDAMENTO" | "FINALIZADA";
export type StatusOvo = "AGUARDANDO" | "GALADO" | "BRANCO" | "ECLODIU" | "FALHOU";
export type TipoFinanca = "RECEITA" | "DESPESA";
export type TipoVenda = "RESERVA" | "VENDA";
export type StatusVenda = "RESERVADO" | "PAGO" | "ENTREGUE" | "CANCELADO";
export type TipoDocumento = "CERTIFICADO_ORIGEM" | "CRACHA";
export type TipoEvento = "NASCIMENTO_PREVISTO" | "SEPARACAO_FILHOTES" | "VACINA" | "MEDICACAO" | "LICENCA" | "OUTRO";
export type TipoRegistroSaude = "DOENCA" | "TRATAMENTO" | "VACINA" | "OBSERVACAO";
export type ModoContagem = "AUTOMATICO" | "MANUAL";
export type StatusTransferencia = "ATIVO" | "USADO" | "CANCELADO" | "EXPIRADO";
export type Fonte = "helvetica" | "times" | "courier";

export interface User {
  id: string;
  nome: string;
  email: string;
}

export interface Criatorio {
  id: string;
  nome: string;
  logoUrl: string | null;
  corMacho: string;
  corFemea: string;
  registroIbama: string | null;
  registroClube: string | null;
  registroFederacao: string | null;
  cidade: string | null;
  uf: string | null;
  whatsapp: string | null;
}

export interface AnimalRef {
  id: string;
  nome: string;
  anilha?: string | null;
  sexo?: Sexo;
}

export interface Animal {
  id: string;
  criatorioId: string;
  nome: string;
  especie: string;
  mutacaoCor: string | null;
  anilha: string | null;
  microchip: string | null;
  sexo: Sexo;
  dataNascimento: string | null;
  status: StatusAnimal;
  fotoUrl: string | null;
  observacoes: string | null;
  paiId: string | null;
  maeId: string | null;
  pai?: AnimalRef | null;
  mae?: AnimalRef | null;
  filhosComoPai?: AnimalRef[];
  filhosComoMae?: AnimalRef[];
  createdAt: string;
}

export interface PedigreeNode {
  id: string;
  nome: string;
  anilha: string | null;
  sexo: Sexo;
  mutacaoCor: string | null;
  fotoUrl: string | null;
  pai: PedigreeNode | null;
  mae: PedigreeNode | null;
}

export interface Casal {
  id: string;
  apelido: string | null;
  machoId: string;
  femeaId: string;
  macho: AnimalRef & { fotoUrl?: string | null };
  femea: AnimalRef & { fotoUrl?: string | null };
  ativo: boolean;
  coeficienteConsanguinidade: number | null;
  createdAt: string;
  _count?: { ninhadas: number };
}

export interface Ovo {
  id: string;
  ninhadaId: string;
  numero: number;
  dataPostura: string | null;
  status: StatusOvo;
  dataEclosao: string | null;
  animalNascidoId: string | null;
  observacoes: string | null;
}

export interface Ninhada {
  id: string;
  casalId: string;
  casal: { macho: AnimalRef; femea: AnimalRef };
  dataCruza: string | null;
  dataPostura: string | null;
  diasIncubacao: number;
  previsaoEclosao: string | null;
  status: StatusNinhada;
  observacoes: string | null;
  ovos: Ovo[];
}

export interface Financa {
  id: string;
  tipo: TipoFinanca;
  categoria: string;
  descricao: string | null;
  valor: string;
  data: string;
  animalId: string | null;
  animal?: AnimalRef | null;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string | null;
  endereco: string | null;
  whatsapp: string | null;
  email: string | null;
  observacoes: string | null;
  _count?: { vendas: number };
}

export interface Venda {
  id: string;
  clienteId: string;
  animalId: string;
  cliente: { id: string; nome: string; whatsapp: string | null };
  animal: { id: string; nome: string; especie: string };
  tipo: TipoVenda;
  status: StatusVenda;
  valor: string;
  sinal: string | null;
  dataReserva: string | null;
  dataVenda: string | null;
  observacoes: string | null;
}

export interface Documento {
  id: string;
  tipo: TipoDocumento;
  codigoVerificacao: string;
  geracoes: number;
  geradoEm: string;
  animal: { id: string; nome: string; especie: string; sexo: Sexo };
}

export interface Evento {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  data: string;
  concluido: boolean;
  observacoes: string | null;
  animal?: { id: string; nome: string } | null;
}

export interface RegistroSaude {
  id: string;
  animalId: string;
  animal?: { id: string; nome: string };
  tipo: TipoRegistroSaude;
  titulo: string;
  descricao: string | null;
  data: string;
}

export interface Medicacao {
  id: string;
  animalId: string;
  animal?: { id: string; nome: string };
  medicamento: string;
  dose: string | null;
  horarios: string[];
  dataInicio: string;
  dataFim: string | null;
  ativo: boolean;
  whatsappAtivo: boolean;
}

export interface Competicao {
  id: string;
  animalId: string;
  animal?: { id: string; nome: string };
  evento: string;
  data: string;
  quantidadeCantos: number | null;
  colocacao: string | null;
  observacoes: string | null;
  midias: string[];
}

export interface SessaoCanto {
  id: string;
  animalId: string;
  animal?: { id: string; nome: string };
  modo: ModoContagem;
  quantidadeCantos: number;
  duracaoSegundos: number;
  data: string;
  observacoes: string | null;
}

export interface DocumentoTemplate {
  id: string;
  nome: string;
  tipo: TipoDocumento;
  corPrimaria: string;
  corFundo: string;
  corTexto: string;
  fonte: Fonte;
  mostrarLogo: boolean;
  mostrarQr: boolean;
  mostrarRegistrosLegais: boolean;
  backgroundUrl: string | null;
  padrao: boolean;
}

export interface TransferenciaCodigo {
  id: string;
  codigo: string;
  status: StatusTransferencia;
  animalId: string | null;
  animal?: { id: string; nome: string; especie: string } | null;
  origemCriatorioNome: string | null;
  criadoEm: string;
  expiraEm: string;
  usadoEm: string | null;
  criatorio?: { nome: string };
}

export interface CandidatoImportacao {
  linhaOriginal: string;
  anilha: string;
  especie: string;
  sexo: Sexo;
  nome: string;
}
