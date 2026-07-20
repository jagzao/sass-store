import Link from "next/link";
import { Linkedin, Github, Mail, Phone, MessageCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  metadata?: unknown;
}

interface ZoFooterProps {
  products: Product[];
}

const nav = [
  { name: "Servicios", href: "/t/zo-system/#servicios" },
  { name: "Casos", href: "/t/zo-system/#casos" },
  { name: "Proceso", href: "/t/zo-system/#proceso" },
  { name: "Stack", href: "/t/zo-system/#stack" },
  { name: "Contacto", href: "/t/zo-system/contact" },
];

const legal = [
  { name: "Aviso de privacidad", href: "/t/zo-system/privacy" },
  { name: "Términos", href: "/t/zo-system/terms" },
];

export function ZoFooter({ products }: ZoFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img
                src="/tenants/zo-system/logo/logo.svg"
                alt="Zo Systems"
                className="h-8 w-auto"
              />
              <span className="text-lg font-semibold text-white">
                Zo Systems
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-400 max-w-sm">
              Desarrollo de plataformas SaaS, modernización de aplicaciones .NET
              e integración de automatización con inteligencia artificial para
              empresas.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://www.linkedin.com/in/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="mailto:jagzao@gmail.com"
                aria-label="Email"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/525549264189"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
              Navegación
            </h3>
            <ul className="space-y-2">
              {nav.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-white uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <a
                href="tel:+525549264189"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Phone className="w-4 h-4" />
                +52 55 4926 4189
              </a>
              <a
                href="mailto:jagzao@gmail.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                jagzao@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {year} Zo Systems. Todos los derechos reservados.
          </p>
          <p className="text-sm text-gray-500">
            Texcoco, Estado de México, México
          </p>
        </div>
      </div>
    </footer>
  );
}
