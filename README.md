# PrevCar

Controle de manutenção do **Renault Kwid 2021** e da **Yamaha Fluo 125 2023**.
App de uma página só, sem build, sem dependência externa.

- Dados em **Cloudflare D1** (SQLite serverless) — não hiberna por inatividade.
- API em **Cloudflare Pages Functions** (`functions/api/[[path]].js`).
- `localStorage` como cache: o app abre e funciona offline, e sincroniza quando a rede volta.

## Por que saiu do Supabase

O plano gratuito do Supabase pausa o projeto após 7 dias sem atividade — para um app
usado por duas pessoas, ele vivia dormindo. O D1 não tem essa pausa: o "scale to zero"
dele é de cobrança, não de disponibilidade.

O free tier do D1 dá 5 GB, 5 milhões de linhas lidas por dia e 100 mil escritas por dia.
O uso real aqui é de algumas dezenas de escritas **por ano**.

## Plano de manutenção

Os intervalos ficam todos no bloco `PLANO DE MANUTENÇÃO`, no topo do `<script>` do
`index.html`. Para mudar um prazo, altere o número lá — nada mais precisa mudar.

**Yamaha Fluo 125** — números do manual do proprietário BJF-F8199-W0 (2023),
capítulo 8, tabelas de manutenção periódica. Fonte oficial.

**Renault Kwid** — o manual NU 1219-9 (ed. 05/2021) **não traz** os intervalos: ele
remete ao livreto "Garantia e Manutenção", que não temos. Os números do Kwid vêm do
plano de revisões da rede Renault e da Revista O Mecânico, e estão marcados com
`fonte: 'rede'` no código. Se o livreto aparecer, vale substituir.

Dois itens nasceram da pesquisa de problemas crônicos, não do calendário de revisão:

- **Kwid — conferir nível de óleo, todo mês.** O manual admite consumo de até 0,5 L
  a cada 1.000 km como normal, e o motor B4D usa corrente de comando lubrificada
  pelo óleo do motor. Óleo baixo é o caminho mais curto para um problema caro.
- **Fluo — verificar bateria, a cada 3 meses.** É o intervalo do manual e a queixa
  número 1 do modelo. Com Stop&Start e a chave em posição errada o sistema segue
  drenando; parada por semanas, ela descarrega.

## Como publicar no Cloudflare

Tudo pelo painel — não precisa de Node nem do Wrangler na máquina.

### 1. Criar o banco

1. Painel do Cloudflare → **Storage & Databases** → **D1** → **Create database**
2. Nome: `prevcar` → **Create**
3. Abra o banco → aba **Console**
4. Cole o conteúdo de [`schema.sql`](schema.sql) e execute

### 2. Criar o projeto Pages

1. **Compute (Workers & Pages)** → **Create** → aba **Pages** → **Connect to Git**
2. Escolha o repositório `brnldy/prevcar`, branch `main`
3. Build settings:
   - Framework preset: **None**
   - Build command: *(deixe vazio)*
   - Build output directory: `/`
4. **Save and Deploy**

> A integração com Git é necessária porque **arrastar a pasta não compila
> Pages Functions** — só o Git ou o Wrangler fazem isso. Como o build roda no
> lado do Cloudflare, a máquina local não precisa de nada instalado.

### 3. Ligar o banco no projeto

1. No projeto Pages → **Settings** → **Bindings** → **Add** → **D1 database**
2. Variable name: `DB` *(exatamente assim — é o nome que o código procura)*
3. D1 database: `prevcar`
4. Salve e faça um **Retry deployment** no último deploy, para o binding valer

Pronto. O endereço fica em `prevcar.pages.dev` (ou o nome que o projeto receber).

### Isso mexe no portfólio?

Não. É um projeto Pages separado, com repositório, domínio e deploy próprios.
O fluxo de arrastar a pasta `_DEPLOY` do portfólio continua igual.

## Depois de publicar

Cada `git push` na `main` republica sozinho.

## API

Todas as rotas ficam sob `/api`, na mesma origem do site (sem CORS).

| Método | Rota | Corpo |
|---|---|---|
| `GET` | `/api/dados?veiculo=kwid` | — |
| `POST` | `/api/registros` | `{ veiculo, registro }` |
| `PATCH` | `/api/registros/:id` | campos a alterar |
| `DELETE` | `/api/registros/:id` | — |
| `PUT` | `/api/veiculo/:id/km` | `{ kmAtual }` |

`veiculo` aceita apenas `kwid` ou `fluo`; qualquer outro valor é recusado.
