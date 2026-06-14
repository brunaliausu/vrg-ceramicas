# Organização de fotos por código (VRG)

Ferramentas para preparar `~/Desktop/fotos-vrg/` antes de publicar no site.

## Estrutura final

```
~/Desktop/fotos-vrg/
  U1/
    01-foto.jpg
    02-detalhe.jpg
  D15/
    ...
  C4/
    ...
  _INDICE.csv
  _INVENTARIO.csv
```

## Passo a passo

### 1. Criar pastas vazias (a partir do admin)

```bash
cd vrg-ceramicas
node scripts/fotos/preparar-pastas.mjs
```

Cria uma pasta para cada código cadastrado no Supabase.

### 2. Inventariar fotos “soltas”

Se suas fotos estão em `Downloads/FOTOS` ou `Documents/fotos`:

```bash
node scripts/fotos/gerar-inventario.mjs ~/Downloads/FOTOS ~/Documents/fotos
```

Gera `~/Desktop/fotos-vrg/_INVENTARIO.csv` com **sessões sugeridas** (fotos seguidas da câmera = provavelmente a mesma peça).

### 3. Mapear códigos no CSV

Abra `_INVENTARIO.csv` no Excel/Numbers e preencha `codigo_destino` (ex: `U1`, `D15`).

Dica: fotos de uma mesma sessão (`S001`) costumam ser a mesma peça — preencha o mesmo código para todas as linhas da sessão.

### 4. Organizar (copiar para as pastas)

Simular primeiro:

```bash
node scripts/fotos/organizar-por-csv.mjs ~/Desktop/fotos-vrg/_INVENTARIO.csv --dry-run
```

Copiar de verdade:

```bash
node scripts/fotos/organizar-por-csv.mjs ~/Desktop/fotos-vrg/_INVENTARIO.csv
```

Mover (remove da pasta original):

```bash
node scripts/fotos/organizar-por-csv.mjs ~/Desktop/fotos-vrg/_INVENTARIO.csv --move
```

### 5. Conferir

Abra `~/Desktop/fotos-vrg/_INDICE.csv` (atualize rodando `preparar-pastas.mjs` de novo) e veja quantas fotos cada código tem.

## Organização manual (alternativa)

Se preferir arrastar no Finder:

1. Rode só o passo 1 (`preparar-pastas.mjs`)
2. Abra `fotos-vrg` e arraste fotos para `U1`, `D2`, etc.
3. Renomeie com prefixo `01-`, `02-` para definir a capa

## Próximo passo (site)

Quando as pastas estiverem prontas, peça no Agent para criar o script de **upload em lote** para o Supabase.
