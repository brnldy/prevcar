/**
 * PrevCar — Worker único: serve o site estático (public/) e a API (/api/*)
 * sobre D1. Convertido do formato Pages Functions para o Worker unificado
 * (a rota /api/* é forçada para cá por run_worker_first no wrangler.jsonc;
 * tudo o mais cai direto no binding ASSETS).
 *
 * Precisa de um binding D1 chamado DB — já declarado em wrangler.jsonc,
 * apontando para o database_id do banco "prevcar".
 *
 * Rotas:
 *   GET    /api/dados?veiculo=kwid     -> { kmAtual, registros[] }
 *   POST   /api/registros              -> { veiculo, registro }
 *   PATCH  /api/registros/:id          -> campos a alterar
 *   DELETE /api/registros/:id
 *   PUT    /api/veiculo/:id/km         -> { kmAtual }
 */

const VEICULOS = ['kwid', 'fluo'];

const json = (dados, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const erro = (msg, status = 400) => json({ erro: msg }, status);

const veiculoValido = (v) => VEICULOS.includes(v);

/** Linha do banco -> objeto que o front consome. */
function paraRegistro(row) {
  return {
    id:          row.id,
    type:        row.tipo,
    otherLabel:  row.outro_label,
    description: row.descricao || '',
    date:        row.data,
    mileage:     row.quilometragem,
    cost:        row.custo,
    location:    row.local || '',
    addedAt:     row.criado_em,
  };
}

async function tratarApi(request, env, segmentos) {
  const db = env.DB;
  if (!db) return erro('Binding D1 "DB" não configurado neste projeto.', 500);

  const [recurso, id, sub] = segmentos;
  const metodo = request.method.toUpperCase();

  try {
    // GET /api/dados?veiculo=kwid
    if (recurso === 'dados' && metodo === 'GET') {
      const veiculo = new URL(request.url).searchParams.get('veiculo');
      if (!veiculoValido(veiculo)) return erro('Veículo desconhecido.');

      const [linhas, veic] = await Promise.all([
        db.prepare(
          `SELECT * FROM manutencoes WHERE veiculo = ? ORDER BY data DESC, criado_em DESC`
        ).bind(veiculo).all(),
        db.prepare(`SELECT km_atual FROM veiculos WHERE id = ?`).bind(veiculo).first(),
      ]);

      return json({
        kmAtual: veic?.km_atual ?? null,
        registros: (linhas.results || []).map(paraRegistro),
      });
    }

    // POST /api/registros
    if (recurso === 'registros' && !id && metodo === 'POST') {
      const corpo = await request.json();
      const { veiculo, registro } = corpo || {};

      if (!veiculoValido(veiculo)) return erro('Veículo desconhecido.');
      if (!registro?.id || !registro?.type || !registro?.date) return erro('Registro incompleto.');
      if (!Number.isFinite(registro.mileage)) return erro('Quilometragem inválida.');

      await db.prepare(
        `INSERT OR REPLACE INTO manutencoes
           (id, veiculo, tipo, outro_label, descricao, data, quilometragem, custo, local, criado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        registro.id,
        veiculo,
        registro.type,
        registro.otherLabel ?? null,
        registro.description || null,
        registro.date,
        registro.mileage,
        registro.cost ?? null,
        registro.location || null,
        registro.addedAt || new Date().toISOString()
      ).run();

      return json({ ok: true }, 201);
    }

    // PATCH /api/registros/:id
    if (recurso === 'registros' && id && metodo === 'PATCH') {
      const m = await request.json();

      // Só deixamos passar colunas conhecidas.
      const mapa = {
        type:        'tipo',
        otherLabel:  'outro_label',
        description: 'descricao',
        date:        'data',
        mileage:     'quilometragem',
        cost:        'custo',
        location:    'local',
      };

      const colunas = [];
      const valores = [];
      for (const [chave, coluna] of Object.entries(mapa)) {
        if (chave in m) {
          colunas.push(`${coluna} = ?`);
          valores.push(m[chave] === '' ? null : m[chave]);
        }
      }
      if (!colunas.length) return erro('Nada para atualizar.');

      valores.push(id);
      const r = await db.prepare(
        `UPDATE manutencoes SET ${colunas.join(', ')} WHERE id = ?`
      ).bind(...valores).run();

      if (!r.meta.changes) return erro('Registro não encontrado.', 404);
      return json({ ok: true });
    }

    // DELETE /api/registros/:id
    if (recurso === 'registros' && id && metodo === 'DELETE') {
      await db.prepare(`DELETE FROM manutencoes WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    }

    // PUT /api/veiculo/:id/km
    if (recurso === 'veiculo' && id && sub === 'km' && metodo === 'PUT') {
      if (!veiculoValido(id)) return erro('Veículo desconhecido.');
      const { kmAtual } = await request.json();
      if (!Number.isFinite(kmAtual) || kmAtual < 0) return erro('Quilometragem inválida.');

      await db.prepare(
        `INSERT INTO veiculos (id, km_atual, atualizado_em)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET km_atual = excluded.km_atual,
                                       atualizado_em = excluded.atualizado_em`
      ).bind(id, kmAtual, new Date().toISOString()).run();

      return json({ ok: true });
    }

    return erro('Rota não encontrada.', 404);
  } catch (e) {
    return erro('Falha no servidor: ' + e.message, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const segmentos = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
      return tratarApi(request, env, segmentos);
    }
    // Qualquer outra rota: arquivo estático em public/.
    return env.ASSETS.fetch(request);
  },
};
