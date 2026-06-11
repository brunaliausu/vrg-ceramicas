import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'O Processo',
  description: 'Do barro à obra — conheça o processo artesanal por trás de cada peça da VRG Cerâmicas.',
}

const etapas = [
  {
    numero: '01',
    titulo: 'Modelagem',
    descricao:
      'Cada peça começa nas mãos. Sem moldes industriais — o barro é trabalhado à mão, respondendo à pressão, à velocidade e à intenção de quem o modela.',
  },
  {
    numero: '02',
    titulo: 'Secagem',
    descricao:
      'Após a modelagem, a peça seca lentamente ao ar livre. Pressa não faz parte do processo. Esse tempo é essencial para que a estrutura ganhe consistência sem rachar.',
  },
  {
    numero: '03',
    titulo: 'Primeira queima',
    descricao:
      'A peça vai ao forno pela primeira vez — a queima biscoito. O calor transforma a argila frágil em cerâmica, preparando-a para receber o esmalte.',
  },
  {
    numero: '04',
    titulo: 'Esmaltagem',
    descricao:
      'Os esmaltes são aplicados à mão, camada a camada. É aqui que nascem as cores, as texturas e os efeitos únicos de cada peça.',
  },
  {
    numero: '05',
    titulo: 'Queima final',
    descricao:
      'A segunda queima, em alta temperatura, vitrifica o esmalte e revela o resultado final. É o momento de descoberta — cada peça sai diferente, e isso é proposital.',
  },
  {
    numero: '06',
    titulo: 'Acabamento',
    descricao:
      'Após a queima, a base da peça é lixada e a cerâmica passa por uma última inspeção antes de estar pronta para encontrar o seu lugar no mundo.',
  },
]

export default function ProcessoPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <p className="font-sans text-[10px] tracking-[0.3em] uppercase text-terracota mb-4">
        O Processo
      </p>
      <h1 className="font-serif text-5xl md:text-6xl font-light text-carvao mb-6 leading-tight">
        Do barro à obra
      </h1>
      <p className="font-sans text-sm text-carvao/60 leading-relaxed max-w-lg mb-20">
        Conheça o caminho que cada peça percorre antes de chegar até você. Cada etapa é feita
        à mão, com tempo, cuidado e intenção.
      </p>

      <div className="space-y-0">
        {etapas.map((etapa, i) => (
          <div key={etapa.numero} className={`grid grid-cols-12 gap-8 py-12 ${i < etapas.length - 1 ? 'border-b border-pedra' : ''}`}>
            <div className="col-span-2">
              <span className="font-serif text-5xl font-light text-pedra">{etapa.numero}</span>
            </div>
            <div className="col-span-10">
              <h2 className="font-serif text-2xl font-light text-carvao mb-3">{etapa.titulo}</h2>
              <p className="font-sans text-sm text-carvao/60 leading-relaxed">{etapa.descricao}</p>
              {/* Placeholder imagem */}
              <div className="mt-6 bg-areia aspect-video flex items-center justify-center">
                <p className="font-sans text-xs text-muted/40">[ Foto — {etapa.titulo} ]</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Nota final */}
      <div className="mt-16 bg-areia px-8 py-10">
        <p className="font-serif text-2xl font-light text-carvao mb-4">
          &ldquo;A imperfeição é a assinatura do artesanal.&rdquo;
        </p>
        <p className="font-sans text-xs text-carvao/60">
          Cada variação de cor, cada marca de mão, cada detalhe que foge à simetria perfeita —
          esses são os traços que tornam uma peça artesanal verdadeiramente única.
        </p>
      </div>
    </div>
  )
}
