import Image from 'next/image'
import Link from 'next/link'
import { linkContato } from '@/lib/whatsapp'
import { siteNavLinks } from '@/lib/siteNav'

export function Footer() {
  return (
    <footer className="bg-carvao text-cru/80 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Marca */}
          <div>
            <Image
              src="/logo-vrg.png"
              alt="VRG Cerâmicas"
              width={72}
              height={216}
              className="mb-4"
            />
            <p className="font-sans text-xs leading-relaxed text-cru/60">
              Cerâmica feita à mão, com alma e propósito. Peças únicas e autorais, produzidas em ateliê.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-cru/40 mb-4">Navegação</p>
            <nav className="flex flex-col gap-2">
              {siteNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-sans text-sm text-cru/60 hover:text-cru transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Redes & contato */}
          <div>
            <p className="font-sans text-[10px] tracking-widest uppercase text-cru/40 mb-4">Contato</p>
            <div className="flex flex-col gap-2">
              <a
                href={linkContato()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-cru/60 hover:text-cru transition-colors"
              >
                WhatsApp →
              </a>
              <a
                href="https://instagram.com/vrg.ceramicas"
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm text-cru/60 hover:text-cru transition-colors"
              >
                Instagram →
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-cru/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-sans text-xs text-cru/30">
            © {new Date().getFullYear()} VRG Cerâmicas Artesanais. Todos os direitos reservados.
          </p>
          <p className="font-sans text-xs text-cru/30 tracking-wide">Feito à mão no Brasil</p>
        </div>
      </div>
    </footer>
  )
}
