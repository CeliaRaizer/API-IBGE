const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// Configuração base da API do IBGE
// ─────────────────────────────────────────────
const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1";

// Instância do axios com base URL e timeout configurados
const ibge = axios.create({
  baseURL: IBGE_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

// ─────────────────────────────────────────────
// Middleware de log (mostra método, rota e status)
// ─────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// ─────────────────────────────────────────────
// ROTA RAIZ — documentação dos endpoints disponíveis
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    projeto: "Consumo da API IBGE - Localidades",
    baseUrl_ibge: IBGE_BASE_URL,
    autenticacao: "Nenhuma (API pública)",
    versao_api: "v1",
    endpoints_disponiveis: {
      "GET /estados": "Lista todos os 27 estados brasileiros",
      "GET /estados/:sigla": "Busca um estado específico pela sigla (ex: PR, SP, RJ)",
      "GET /estados/:sigla/municipios": "Lista todos os municípios de um estado",
      "GET /municipios/busca?nome=...": "Busca município por nome (com parâmetro de query)",
      "GET /regioes": "Lista as 5 grandes regiões do Brasil",
      "GET /regioes/:id/estados": "Lista estados de uma região (1=N, 2=NE, 3=SE, 4=S, 5=CO)",
    },
  });
});

// ─────────────────────────────────────────────
// GET /estados
// Requisição GET simples — lista todos os estados
// Endpoint IBGE: /localidades/estados
// ─────────────────────────────────────────────
app.get("/estados", async (req, res) => {
  try {
    const response = await ibge.get("/localidades/estados");

    // Ordena por nome para facilitar leitura
    const estados = response.data.sort((a, b) => a.nome.localeCompare(b.nome));

    res.json({
      total: estados.length,
      fonte: `${IBGE_BASE_URL}/localidades/estados`,
      dados: estados,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─────────────────────────────────────────────
// GET /estados/:sigla
// Requisição GET com parâmetro de rota
// Endpoint IBGE: /localidades/estados/{UF}
// Exemplo: GET /estados/PR
// ─────────────────────────────────────────────
app.get("/estados/:sigla", async (req, res) => {
  const { sigla } = req.params;

  try {
    const response = await ibge.get(`/localidades/estados/${sigla.toUpperCase()}`);

    res.json({
      fonte: `${IBGE_BASE_URL}/localidades/estados/${sigla.toUpperCase()}`,
      dados: response.data,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ erro: `Estado com sigla '${sigla}' não encontrado.` });
    }
    handleError(res, error);
  }
});

// ─────────────────────────────────────────────
// GET /estados/:sigla/municipios
// Requisição GET com parâmetro de rota — relação de municípios
// Endpoint IBGE: /localidades/estados/{UF}/municipios
// Exemplo: GET /estados/PR/municipios
// ─────────────────────────────────────────────
app.get("/estados/:sigla/municipios", async (req, res) => {
  const { sigla } = req.params;

  try {
    const [estadoRes, municipiosRes] = await Promise.all([
      ibge.get(`/localidades/estados/${sigla.toUpperCase()}`),
      ibge.get(`/localidades/estados/${sigla.toUpperCase()}/municipios`),
    ]);

    const municipios = municipiosRes.data.sort((a, b) => a.nome.localeCompare(b.nome));

    res.json({
      estado: estadoRes.data.nome,
      sigla: sigla.toUpperCase(),
      total_municipios: municipios.length,
      fonte: `${IBGE_BASE_URL}/localidades/estados/${sigla.toUpperCase()}/municipios`,
      dados: municipios,
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ erro: `Estado com sigla '${sigla}' não encontrado.` });
    }
    handleError(res, error);
  }
});

// ─────────────────────────────────────────────
// GET /municipios/busca?nome=curitiba
// Requisição GET com parâmetro de QUERY STRING
// Endpoint IBGE: /localidades/municipios (filtrado localmente)
// Exemplo: GET /municipios/busca?nome=curitiba
// ─────────────────────────────────────────────
app.get("/municipios/busca", async (req, res) => {
  const { nome } = req.query;

  if (!nome || nome.trim().length < 2) {
    return res.status(400).json({
      erro: "Parâmetro 'nome' é obrigatório e deve ter pelo menos 2 caracteres.",
      exemplo: "/municipios/busca?nome=curitiba",
    });
  }

  try {
    const response = await ibge.get("/localidades/municipios");
    const todos = response.data;

    // Filtra por nome (case-insensitive, sem acento)
    const normalizar = (str) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const resultados = todos.filter((m) =>
      normalizar(m.nome).includes(normalizar(nome))
    );

    res.json({
      busca: nome,
      total_encontrado: resultados.length,
      fonte: `${IBGE_BASE_URL}/localidades/municipios`,
      parametro_usado: "query string ?nome=",
      dados: resultados,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─────────────────────────────────────────────
// GET /regioes
// Lista as 5 grandes regiões do Brasil
// Endpoint IBGE: /localidades/regioes
// ─────────────────────────────────────────────
app.get("/regioes", async (req, res) => {
  try {
    const response = await ibge.get("/localidades/regioes");

    res.json({
      total: response.data.length,
      fonte: `${IBGE_BASE_URL}/localidades/regioes`,
      dados: response.data,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─────────────────────────────────────────────
// GET /regioes/:id/estados
// Lista estados de uma região específica
// Endpoint IBGE: /localidades/regioes/{id}/estados
// Regiões: 1=Norte, 2=Nordeste, 3=Sudeste, 4=Sul, 5=Centro-Oeste
// ─────────────────────────────────────────────
app.get("/regioes/:id/estados", async (req, res) => {
  const { id } = req.params;

  const nomesRegioes = {
    1: "Norte",
    2: "Nordeste",
    3: "Sudeste",
    4: "Sul",
    5: "Centro-Oeste",
  };

  if (!nomesRegioes[id]) {
    return res.status(400).json({
      erro: "ID de região inválido. Use: 1=Norte, 2=Nordeste, 3=Sudeste, 4=Sul, 5=Centro-Oeste",
    });
  }

  try {
    const response = await ibge.get(`/localidades/regioes/${id}/estados`);

    res.json({
      regiao: nomesRegioes[id],
      id_regiao: Number(id),
      total_estados: response.data.length,
      fonte: `${IBGE_BASE_URL}/localidades/regioes/${id}/estados`,
      dados: response.data,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ─────────────────────────────────────────────
// Handler de erros centralizado
// ─────────────────────────────────────────────
function handleError(res, error) {
  console.error("Erro ao consumir API IBGE:", error.message);

  if (error.response) {
    // Erro vindo da API do IBGE
    return res.status(error.response.status).json({
      erro: "Erro na API do IBGE",
      status: error.response.status,
      detalhe: error.response.data,
    });
  }

  if (error.code === "ECONNABORTED") {
    return res.status(504).json({ erro: "Timeout ao conectar com a API do IBGE." });
  }

  res.status(500).json({ erro: "Erro interno no servidor.", detalhe: error.message });
}

// ─────────────────────────────────────────────
// Inicialização do servidor
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📖 Documentação dos endpoints: http://localhost:${PORT}/\n`);
});
