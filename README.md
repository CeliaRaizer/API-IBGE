# Consumo e Análise da API do IBGE

> **Disciplina:** Desenvolvimento Web II
> **API escolhida:** IBGE Serviço de Dados — Localidades
> **Documentação oficial:** https://servicodados.ibge.gov.br/api/docs/localidades

---

## 📋 Análise da API — Perguntas

### 1. Qual o propósito da API?

A API de Serviço de Dados do IBGE tem como principal objetivo disponibilizar dados oficiais do Brasil de forma pública e acessível pela internet. Por meio dela, desenvolvedores conseguem consultar informações sobre estados, municípios, regiões e diversos indicadores estatísticos sem precisar acessar manualmente o site do IBGE.

Neste trabalho, utilizamos o módulo **Localidades**, para demonstrar o consumo de uma API REST.

---

### 2. Qual é a Base URL?

Esta é a URL base utilizada pelo IBGE:

```
https://servicodados.ibge.gov.br/api/v1
```

---

### 3. Quais são os principais endpoints?

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/localidades/estados` | Lista todos os 27 estados |
| `GET` | `/localidades/estados/{UF}` | Busca um estado pela sigla |
| `GET` | `/localidades/estados/{UF}/municipios` | Municípios de um estado |
| `GET` | `/localidades/municipios` | Lista todos os municípios do Brasil |
| `GET` | `/localidades/regioes` | Lista as 5 grandes regiões |
| `GET` | `/localidades/regioes/{id}/estados` | Estados de uma região |
| `GET` | `/localidades/municipios/{id}` | Dados de um município específico |
| `GET` | `/localidades/mesorregioes` | Lista todas as mesorregiões |
| `GET` | `/localidades/microrregioes` | Lista todas as microrregiões |

---

### 4. A API possui autenticação?

**Não.** A API do IBGE é completamente pública e **não exige nenhuma autenticação**.

---

### 5. Qual o tipo de autenticação? (API Key, Bearer Token, OAuth etc.)

Por ser uma API pública, **não há nenhum tipo de autenticação** — não são necessários:

- API Key
- Bearer Token
- OAuth
- Cadastro ou login

---

### 6. Onde é enviada? (header, query, body)

Como a API **não possui autenticação**, nenhuma credencial é enviada em header, query string ou body. As requisições são feitas diretamente, sem nenhum parâmetro adicional de segurança.

> Por não ter autenticação, é recomendável não fazer muitas requisições simultâneas para não sobrecarregar os servidores públicos.

---

### 7. A API possui versão? Como o versionamento é tratado?

**Sim**, a API possui versionamento explícito na URL:

```
https://servicodados.ibge.gov.br/api/v1/localidades/...
https://servicodados.ibge.gov.br/api/v2/localidades/...
https://servicodados.ibge.gov.br/api/v3/agregados/...
```

**Como o versionamento é tratado:**

- O número da versão fica no **path** (segmento da URL), padrão `v1`, `v2`, `v3`
- Cada versão pode ter endpoints e formatos de resposta diferentes
- Não há header `API-Version` nem negociação via `Accept` — o versionamento é puramente por URL

---

### 8. A API utiliza HATEOAS?

**Não.** A API do IBGE **não implementa HATEOAS**.

HATEOAS exigiria que cada resposta trouxesse links para ações relacionadas, como por exemplo:

```json
{
  "id": 41,
  "nome": "Paraná",
  "_links": {
    "self": { "href": "/localidades/estados/PR" },
    "municipios": { "href": "/localidades/estados/PR/municipios" },
    "regiao": { "href": "/localidades/regioes/4" }
  }
}
```

O que a API retorna de fato é um objeto simples, sem links navegáveis:

```json
{
  "id": 41,
  "sigla": "PR",
  "nome": "Paraná",
  "regiao": {
    "id": 4,
    "sigla": "S",
    "nome": "Sul"
  }
}
```

---

### 9. Qual é o tipo de resposta?

A API retorna exclusivamente **JSON**.

- Não há suporte a XML
- Não há suporte a CSV via headers de negociação
- O encoding é **UTF-8** (essencial para nomes com acentos como "São Paulo", "Goiânia")

---

### 10. Qual é a estrutura de um objeto retornado?

**Objeto: Estado**

```json
{
  "id": 41,
  "sigla": "PR",
  "nome": "Paraná",
  "regiao": {
    "id": 4,
    "sigla": "S",
    "nome": "Sul"
  }
}
```

**Objeto: Município** (mais complexo — hierarquia geográfica aninhada)

```json
{
  "id": 4106902,
  "nome": "Curitiba",
  "microrregiao": {
    "id": 41037,
    "nome": "Curitiba",
    "mesorregiao": {
      "id": 4109,
      "nome": "Metropolitana de Curitiba",
      "UF": {
        "id": 41,
        "sigla": "PR",
        "nome": "Paraná",
        "regiao": {
          "id": 4,
          "sigla": "S",
          "nome": "Sul"
        }
      }
    }
  },
  "regiao-imediata": {
    "id": 410031,
    "nome": "Curitiba",
    "regiao-intermediaria": {
      "id": 4104,
      "nome": "Londrina",
      "UF": { "..." : "..." }
    }
  }
}
```

O objeto município demonstra um padrão de **embedding** (objetos aninhados), onde a hierarquia geográfica completa é retornada dentro de cada município, sem precisar de requisições adicionais.

---

## 📁 Estrutura do Projeto

```
ibge-api-trabalho/
├── src/
│   └── server.js                  # Servidor Node.js + Express
├── postman/
│   └── IBGE_API_Colecao.postman_collection.json
├── exemplos-resposta/
│   └── respostas.json             # Exemplos reais das respostas
├── package.json
└── README.md
```

---

## 🚀 Como Rodar

```bash
# 1. Instalar dependências
npm install

# 2. Rodar o servidor
npm start
# ou com hot-reload:
npm run dev

# Servidor disponível em: http://localhost:3000
```


## 📡 Endpoints do Servidor Local

| Método | Rota | Tipo de Parâmetro | Exemplo |
|--------|------|-------------------|---------|
| `GET` | `/` | — | `localhost:3000/` |
| `GET` | `/estados` | — | `localhost:3000/estados` |
| `GET` | `/estados/:sigla` | Route param | `localhost:3000/estados/PR` |
| `GET` | `/estados/:sigla/municipios` | Route param | `localhost:3000/estados/SP/municipios` |
| `GET` | `/municipios/busca?nome=...` | Query string | `localhost:3000/municipios/busca?nome=curitiba` |
| `GET` | `/regioes` | — | `localhost:3000/regioes` |
| `GET` | `/regioes/:id/estados` | Route param | `localhost:3000/regioes/4/estados` |

---

## 🧪 Como testar no Postman

1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo `postman/IBGE_API_Colecao.postman_collection.json`
4. Com o servidor rodando (`npm start`), execute as requisições em ordem

---

## 🧪 Como testar no VS Code

Instale a extensão **REST Client** (`humao.rest-client`) e crie um arquivo `.http`:

```http
### 1. Todos os estados
GET http://localhost:3000/estados
Accept: application/json

### 2. Estado específico
GET http://localhost:3000/estados/PR
Accept: application/json

### 3. Municípios do Paraná
GET http://localhost:3000/estados/PR/municipios
Accept: application/json

### 4. Busca por nome (query string)
GET http://localhost:3000/municipios/busca?nome=curitiba
Accept: application/json

### 5. Regiões do Brasil
GET http://localhost:3000/regioes
Accept: application/json

### 6. Estados da Região Sul (id=4)
GET http://localhost:3000/regioes/4/estados
Accept: application/json
```
---

## 📚 Documentação Oficial

- **Swagger UI do IBGE:** https://servicodados.ibge.gov.br/api/docs/localidades
- **Portal de APIs do IBGE:** https://servicodados.ibge.gov.br/api/docs

---
