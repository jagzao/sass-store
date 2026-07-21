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
    <footer className="bg-[#070708] border-t border-[#282a31]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/tenants/zo-system/logo/logo.svg"
                alt="Zo Systems"
                className="h-8 w-auto"
              />
              <span className="text-lg font-semibold text-[#f5f5f7]">
                Zo Systems
              </span>
            </div>
            <p className="mt-4 text-sm text-[#a7abb4] max-w-sm leading-relaxed">
              Desarrollo de plataformas SaaS, modernización de aplicaciones .NET
              e integración de automatización con inteligencia artificial para
              empresas.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <SocialLink
                href="https://www.linkedin.com/in/jagzao"
                label="LinkedIn"
                icon={Linkedin}
              />
              <SocialLink
                href="https://github.com/jagzao"
                label="GitHub"
                icon={Github}
              />
              <SocialLink
                href="mailto:jagzao@gmail.com"
                label="Email"
                icon={Mail}
              />
              <SocialLink
                href="https://wa.me/525549264189"
                label="WhatsApp"
                icon={MessageCircle}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider mb-5">
              Navegación
            </h3>
            <ul className="space-y-3">
              {nav.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#a7abb4] hover:text-[#f5f5f7] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>{" "}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#f5f5f7] uppercase tracking-wider mb-5">
              Legal
            </h3>
            <ul className="space-y-3">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-[#a7abb4] hover:text-[#f5f5f7] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 text-sm text-[#a7abb4]">
              <a
                href="tel:+525549264189"
                className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors"
              >
                <Phone className="w-4 h-4 text-[#e8343d]" />
                +52 55 4926 4189
              </a>
              <a
                href="mailto:jagzao@gmail.com"
                className="flex items-center gap-2 hover:text-[#f5f5f7] transition-colors"
              >
                <Mail className="w-4 h-4 text-[#e8343d]" />
                jagzao@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#282a31] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#737782]">
            © {year} Zo Systems. Todos los derechos reservados.
          </p>
          <p className="text-sm text-[#737782]">
            Texcoco, Estado de México, México
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Linkedin;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="text-[#737782] hover:text-[#e8343d] transition-colors"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}
