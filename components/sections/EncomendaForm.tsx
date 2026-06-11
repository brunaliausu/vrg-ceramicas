'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { linkEncomendaForm } from '@/lib/whatsapp'

const schema = z.object({
  nome: z.string().min(2, 'Informe seu nome'),
  whatsapp: z.string().min(8, 'Informe seu WhatsApp'),
  descricao: z.string().min(10, 'Descreva o que você deseja (mínimo 10 caracteres)'),
  quantidade: z.number().int().min(1, 'Mínimo 1 peça'),
})

type FormData = z.infer<typeof schema>

interface EncomendaFormProps {
  pecaNome?: string
}

export function EncomendaForm({ pecaNome }: EncomendaFormProps) {
  const [enviando, setEnviando] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantidade: 1 },
  })

  const onSubmit = (data: FormData) => {
    setEnviando(true)
    const link = linkEncomendaForm({ ...data, quantidade: data.quantidade })
    window.open(link, '_blank')
    setTimeout(() => setEnviando(false), 1500)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block font-sans text-xs tracking-wide text-carvao/70 mb-1.5">
          Seu nome *
        </label>
        <input
          {...register('nome')}
          placeholder="Como você se chama?"
          className="w-full bg-cru border border-pedra px-4 py-3 font-sans text-sm text-carvao placeholder:text-muted/50 focus:outline-none focus:border-terracota transition-colors"
        />
        {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
      </div>

      <div>
        <label className="block font-sans text-xs tracking-wide text-carvao/70 mb-1.5">
          WhatsApp para contato *
        </label>
        <input
          {...register('whatsapp')}
          placeholder="(11) 99999-9999"
          className="w-full bg-cru border border-pedra px-4 py-3 font-sans text-sm text-carvao placeholder:text-muted/50 focus:outline-none focus:border-terracota transition-colors"
        />
        {errors.whatsapp && <p className="mt-1 text-xs text-red-600">{errors.whatsapp.message}</p>}
      </div>

      <div>
        <label className="block font-sans text-xs tracking-wide text-carvao/70 mb-1.5">
          O que você deseja? *
        </label>
        <textarea
          {...register('descricao')}
          rows={4}
          placeholder="Descreva a peça que imagina — estilo, cor, tamanho, finalidade..."
          className="w-full bg-cru border border-pedra px-4 py-3 font-sans text-sm text-carvao placeholder:text-muted/50 focus:outline-none focus:border-terracota transition-colors resize-none"
        />
        {errors.descricao && <p className="mt-1 text-xs text-red-600">{errors.descricao.message}</p>}
      </div>

      <div>
        <label className="block font-sans text-xs tracking-wide text-carvao/70 mb-1.5">
          Quantidade
        </label>
        <input
          {...register('quantidade', { valueAsNumber: true })}
          type="number"
          min={1}
          className="w-24 bg-cru border border-pedra px-4 py-3 font-sans text-sm text-carvao focus:outline-none focus:border-terracota transition-colors"
        />
        {errors.quantidade && <p className="mt-1 text-xs text-red-600">{errors.quantidade.message}</p>}
      </div>

      <div className="bg-areia px-4 py-3 text-xs font-sans text-carvao/70 leading-relaxed">
        Encomendas iniciam com sinal de 50%. Por ser uma peça artesanal, pode haver pequenas
        variações em relação à referência. Combinamos todos os detalhes pelo WhatsApp.
      </div>

      <Button type="submit" loading={enviando} className="w-full">
        {enviando ? 'Abrindo WhatsApp...' : 'Enviar via WhatsApp →'}
      </Button>
    </form>
  )
}
