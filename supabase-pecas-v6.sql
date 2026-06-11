-- ============================================================
-- VRG Cerâmicas — Migração: pecas_estoque v6
-- Adiciona coluna fenearte e classifica as peças selecionadas.
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE pecas_estoque
  ADD COLUMN IF NOT EXISTS fenearte boolean NOT NULL DEFAULT false;

-- Marcar como fenearte = true os códigos selecionados
UPDATE pecas_estoque SET fenearte = true WHERE codigo IN (
  -- Série U
  'U25','U27','U28','U45','U46','U47','U48','U49',
  'U54','U58','U58A',
  'U61','U62','U63','U67','U68','U70','U71',
  'U73','U74','U75','U76','U77','U78','U79','U80','U81',
  'U83','U84','U87','U88','U89',
  'U93','U94','U95','U96','U97','U98','U99',
  'U103','U104',
  -- Série D
  'D11A','D11B','D14',
  'D21','D22','D23','D24','D25',
  'D27','D28','D29','D30','D31','D32',
  'D37','D38','D39','D40','D41','D42','D43','D44','D45','D46',
  'D48','D49','D50','D51','D52','D53','D55','D56','D57',
  -- Série UD
  'UD18','UD22','UD27','UD28','UD29','UD30','UD31','UD32',
  'UD35','UD36','UD37','UD38','UD39','UD40','UD41','UD42','UD43',
  'UD45','UD46','UD47'
);

-- Garantir que as demais ficam como false
UPDATE pecas_estoque SET fenearte = false WHERE fenearte IS DISTINCT FROM true;
