import Link from 'next/link'
import { ProductForm } from '@/components/admin/ProductForm'

export default function NovoProdutoPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="font-sans text-xs text-muted hover:text-carvao transition-colors">
          ← Voltar
        </Link>
        <h1 className="font-serif text-3xl font-light text-carvao">Novo produto</h1>
      </div>

      <ProductForm modo="novo" />
    </div>
  )
}
