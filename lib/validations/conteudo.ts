import { z } from 'zod'

export const CONTEUDO_IDS = [
  'home',
  'sobre',
  'processo',
  'contato',
  'produto_historia',
] as const

export const conteudoIdSchema = z.enum(CONTEUDO_IDS)

export const conteudoPayloadSchema = z.object({
  id: conteudoIdSchema,
  dados: z.record(z.string(), z.unknown()),
})
