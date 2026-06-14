import { z } from 'zod'

const itemSchema = z.object({
  nome: z.string().max(200),
  valor: z.number().finite(),
})

export const custosPayloadSchema = z.record(z.string().max(50), z.unknown()).superRefine((data, ctx) => {
  if (Object.keys(data).length > 30) {
    ctx.addIssue({ code: 'custom', message: 'Payload de custos inválido' })
    return
  }
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const parsed = z.array(itemSchema).max(100).safeParse(value)
      if (!parsed.success) {
        ctx.addIssue({ code: 'custom', message: `Campo inválido: ${key}` })
      }
    }
  }
})
