# PrevCar

Controle de manutenção do **Renault Kwid 2021** e da **Yamaha Fluo 125 2023**.
App de uma página só, sem build, sem dependência externa.

- Dados em **Cloudflare D1** (SQLite serverless) — não hiberna por inatividade.
- Publicado como um **Worker** com assets estáticos (`public/`) + um Worker script (`worker/index.js`)
  que atende `/api/*` e delega o resto para os arquivos estáticos.
- `localStorage` como cache: o app abre e funciona offline, e sincroniza quando a rede volta.

## Por que saiu do Supabase

O plano gratuito do Supabase pausa o projeto após 7 dias sem atividade — para um app
usado por duas pessoas, ele vivia dormindo. O D1 não tem essa pausa: o "scale to zero"
dele é de cobrança, não de disponibilidade.

O free tier do D1 dá 5 GB, 5 milhões de linhas lidas por dia e 100 mil escritas por dia.
O uso real aqui é de algumas dezenas de escritas **por ano**.

## Plano de manutenção

Os intervalos ficam todos no bloco `PLANO DE MANUTENÇÃO`, no topo do `<script>` do
`public/index.html`. Para mudar um prazo, altere o número lá — nada mais precisa mudar.

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

Tudo pelo painel — não precisa de Node nem do Wrangler instalado na máquina. O
`npx wrangler deploy` que o Cloudflare pede roda do lado **deles**, num container de
build; é o mesmo princípio do antigo Pages, só que a tela de criação mudou.

> **Nota:** a Cloudflare unificou Pages e Workers numa única tela de criação, e hoje
> o destaque do painel é "Create a Worker" → importar do Git. O projeto está
> estruturado para esse fluxo (`wrangler.jsonc` + `worker/index.js` + `public/`),
> não para o antigo "Pages → Connect to Git" — se você ver essa opção separada em
> algum lugar do painel, ignore, ela não combina com o repo.

### 1. Criar o banco D1

1. Painel do Cloudflare → **Storage & Databases** → **D1** → **Create database**
2. Nome: `prevcar` → **Create**
3. Na página do banco recém-criado, copie o **Database ID** (aparece no topo, um UUID)
4. Abra a aba **Console** do banco, cole o conteúdo de [`schema.sql`](schema.sql) e execute

### 2. Colocar o Database ID no repo

Abra [`wrangler.jsonc`](wrangler.jsonc) e troque `SUBSTITUA_PELO_DATABASE_ID` pelo ID
copiado no passo anterior. Dá para editar direto pelo GitHub (ícone de lápis no
arquivo) — não precisa clonar nada. Um `database_id` não é segredo, pode ir num
repo público sem problema.

### 3. Criar o Worker

1. **Compute (Workers & Pages)** → **Create** → **Import a repository** (ou
   "Create a Worker" → **Deploy from Git**)
2. Escolha `brnldy/prevcar`, branch `main`
3. Deixe o **Deploy command** no padrão (`npx wrangler deploy`) — ele lê o
   `wrangler.jsonc` do repo sozinho, inclusive o binding do D1
4. **Save and Deploy**

Pronto. O endereço fica em `prevcar.<sua-conta>.workers.dev`, ou o domínio que
você apontar depois em **Settings → Domains & Routes**.

### Isso mexe no portfólio?

Não. É um Worker separado, com repositório, domínio e deploy próprios.
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
