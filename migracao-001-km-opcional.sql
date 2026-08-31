-- Migração 001 — torna a quilometragem opcional.
--
-- Motivo: muita nota fiscal de oficina não traz o hodômetro. Exigir o km
-- fazia o registro simplesmente deixar de ser feito. O SQLite não permite
-- remover um NOT NULL com ALTER TABLE, então recriamos a tabela.
--
-- Rodar UMA vez no console do D1 (Storage & Databases > D1 > prevcar > Console).
-- Preserva todos os registros existentes.

CREATE TABLE manutencoes_nova (
  id             TEXT PRIMARY KEY,
  veiculo        TEXT    NOT NULL,
  tipo           TEXT    NOT NULL,
  outro_label    TEXT,
  descricao      TEXT,
  data           TEXT    NOT NULL,
  quilometragem  INTEGER,          -- <- era NOT NULL
  custo          REAL,
  local          TEXT,
  criado_em      TEXT    NOT NULL
);

INSERT INTO manutencoes_nova
  (id, veiculo, tipo, outro_label, descricao, data, quilometragem, custo, local, criado_em)
SELECT
   id, veiculo, tipo, outro_label, descricao, data, quilometragem, custo, local, criado_em
FROM manutencoes;

DROP TABLE manutencoes;

ALTER TABLE manutencoes_nova RENAME TO manutencoes;

CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo
  ON manutencoes (veiculo, data DESC);
