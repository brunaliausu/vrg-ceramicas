import type { Metadata } from 'next'
import { EncomendaForm } from '@/components/sections/EncomendaForm'
import { linkContato } from '@/lib/whatsapp'

export const metadata: Metadata = {
  title: 'Contato',
  description: 'Fale com a VRG Cerâmicas — encomendas, dúvidas e parcerias.',
}

export default function ContatoPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-4">Contato</p>
      <h1 className="font-serif text-5xl font-light text-carvao mb-6">Fale conosco</h1>
      <p className="font-sans text-sm text-carvao/60 mb-16 max-w-md leading-relaxed">
        Para encomendas, dúvidas sobre envio ou parcerias, use o formulário abaixo ou entre em
        contato direto pelo WhatsApp.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Formulário */}
        <div>
          <h2 className="font-serif text-2xl font-light text-carvao mb-6">Solicitar Encomenda</h2>
          <EncomendaForm />
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-3">WhatsApp</p>
            <a
              href={linkContato()}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-carvao hover:text-terracota transition-colors"
            >
              Clique para conversar →
            </a>
          </div>
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-3">Instagram</p>
            <a
              href="https://instagram.com/vrg.ceramicas"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-sm text-carvao hover:text-terracota transition-colors"
            >
              @vrg.ceramicas →
            </a>
          </div>
          <div className="bg-areia px-6 py-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-2">Envios</p>
            <p className="font-sans text-xs text-carvao/60 leading-relaxed">
              Enviamos para todo o Brasil via Correios ou transportadora. O frete é calculado e
              combinado no WhatsApp após a confirmação do pedido.
            </p>
          </div>
          <div className="bg-areia px-6 py-5">
            <p className="font-sans text-[10px] tracking-widest uppercase text-muted mb-2">Encomendas</p>
            <p className="font-sans text-xs text-carvao/60 leading-relaxed">
              Todas as encomendas iniciam com sinal de 50%. O prazo de produção é combinado no
              momento do pedido, de acordo com a peça e a fila do ateliê.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
