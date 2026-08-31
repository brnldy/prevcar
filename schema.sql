-- PrevCar — esquema do banco D1.
-- Cole este conteúdo no console SQL do D1 no painel do Cloudflare
-- (Storage & Databases > D1 > prevcar > Console) e execute uma vez.

CREATE TABLE IF NOT EXISTS manutencoes (
  id             TEXT PRIMARY KEY,
  veiculo        TEXT    NOT NULL,
  tipo           TEXT    NOT NULL,
  outro_label    TEXT,
  descricao      TEXT,
  data           TEXT    NOT NULL,
  quilometragem  INTEGER,          -- opcional: nem toda nota traz o hodômetro
  custo          REAL,
  local          TEXT,
  criado_em      TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo
  ON manutencoes (veiculo, data DESC);

CREATE TABLE IF NOT EXISTS veiculos (
  id             TEXT PRIMARY KEY,
  km_atual       INTEGER,
  atualizado_em  TEXT
);

INSERT OR IGNORE INTO veiculos (id, km_atual, atualizado_em) VALUES
  ('kwid', NULL, NULL),
  ('fluo', NULL, NULL);
