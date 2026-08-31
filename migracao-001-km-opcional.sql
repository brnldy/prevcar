CREATE TABLE manutencoes_nova (
  id TEXT PRIMARY KEY,
  veiculo TEXT NOT NULL,
  tipo TEXT NOT NULL,
  outro_label TEXT,
  descricao TEXT,
  data TEXT NOT NULL,
  quilometragem INTEGER,
  custo REAL,
  local TEXT,
  criado_em TEXT NOT NULL,
  itens TEXT
);

INSERT INTO manutencoes_nova (id, veiculo, tipo, outro_label, descricao, data, quilometragem, custo, local, criado_em)
SELECT id, veiculo, tipo, outro_label, descricao, data, quilometragem, custo, local, criado_em FROM manutencoes;

DROP TABLE manutencoes;

ALTER TABLE manutencoes_nova RENAME TO manutencoes;

CREATE INDEX IF NOT EXISTS idx_manutencoes_veiculo ON manutencoes (veiculo, data DESC);
