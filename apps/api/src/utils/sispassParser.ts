const ESPECIES_CONHECIDAS = [
  "Curió",
  "Trinca-ferro",
  "Coleiro",
  "Coleirinho",
  "Canário-da-terra",
  "Canario-da-terra",
  "Azulão",
  "Azulao",
  "Pintassilgo",
  "Pixoxó",
  "Pixoxo",
  "Papa-capim",
  "Bicudo",
  "Sabiá",
  "Sabia",
  "Golinho",
  "Papa-arroz",
  "Cardeal",
  "Bigodinho",
  "Patativa",
];

const ANILHA_REGEX = /\b[A-Z]{1,4}-?\d{4,8}\b|\b\d{2,4}[\/-]\d{2,6}\b/g;

export interface CandidatoImportacao {
  linhaOriginal: string;
  anilha: string;
  especie: string;
  sexo: "MACHO" | "FEMEA" | "INDEFINIDO";
  nome: string;
}

export function parseSispassTexto(texto: string): CandidatoImportacao[] {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidatos: CandidatoImportacao[] = [];
  const anilhasVistas = new Set<string>();

  for (const linha of linhas) {
    const matches = linha.match(ANILHA_REGEX);
    if (!matches) continue;

    for (const anilha of matches) {
      const chave = anilha.toUpperCase();
      if (anilhasVistas.has(chave)) continue;
      anilhasVistas.add(chave);

      const especie = ESPECIES_CONHECIDAS.find((e) => linha.toLowerCase().includes(e.toLowerCase())) ?? "";

      let sexo: CandidatoImportacao["sexo"] = "INDEFINIDO";
      if (/\bmacho\b|\bmasculino\b/i.test(linha)) sexo = "MACHO";
      else if (/\bf[eê]mea\b|\bfeminino\b/i.test(linha)) sexo = "FEMEA";

      candidatos.push({
        linhaOriginal: linha.slice(0, 200),
        anilha,
        especie,
        sexo,
        nome: especie ? `${especie} ${anilha}` : anilha,
      });
    }
  }

  return candidatos;
}
