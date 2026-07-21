"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Linkedin,
  Github,
  Mail,
  Phone,
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const projectTypes = [
  "Nueva plataforma SaaS",
  "Modernización de sistema",
  "Automatización con IA",
  "Auditoría técnica",
  "Otro",
];

const inputClass =
  "w-full rounded-lg border border-[#282a31] bg-[#18191e] px-3.5 py-2.5 text-[#f5f5f7] placeholder-[#737782] focus:border-[#e8343d] focus:outline-none focus:ring-1 focus:ring-[#e8343d] transition-shadow";

export default function ZoContactForm() {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    type: "",
    description: "",
    budget: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Ingresa tu nombre";
    if (!form.email.trim()) {
      next.email = "Ingresa tu correo";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Ingresa un correo válido";
    }
    if (!form.type) next.type = "Selecciona un tipo de proyecto";
    if (!form.description.trim() || form.description.length < 20) {
      next.description = "Describe tu proyecto con al menos 20 caracteres";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");

    try {
      const body = new URLSearchParams();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      body.append("_gotcha", "");

      // ponytail: use formbold or formspree via env; fallback to mailto if not configured
      const endpoint =
        typeof window !== "undefined"
          ? (process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT ?? "")
          : "";

      if (endpoint) {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        });
        if (!res.ok) throw new Error("Failed to submit");
      }

      setStatus("success");
      setForm({
        name: "",
        company: "",
        email: "",
        type: "",
        description: "",
        budget: "",
      });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="min-h-screen bg-[#070708] text-[#f5f5f7] pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="max-w-lg">
            <Link
              href="/t/zo-system"
              className="text-sm text-[#737782] hover:text-[#f5f5f7] transition-colors"
            >
              ← Volver a inicio
            </Link>
            <h1 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7]">
              Contacto
            </h1>
            <p className="mt-4 text-lg text-[#a7abb4]">
              Cuéntanos qué sistema necesitas construir, modernizar o rescatar.
              Revisaremos tu caso y te propondremos la mejor estrategia técnica.
            </p>

            <div className="mt-8 space-y-4">
              <ContactCard
                href="https://calendly.com/jagzao"
                title="Agenda una llamada"
                subtitle="Reservar cita de 30 minutos"
                icon={Phone}
                accent="red"
              />
              <ContactCard
                href="https://wa.me/525549264189"
                title="WhatsApp"
                subtitle="+52 55 4926 4189"
                icon={MessageCircle}
                accent="green"
              />
              <ContactCard
                href="mailto:jagzao@gmail.com"
                title="Email"
                subtitle="jagzao@gmail.com · correo corporativo en configuración"
                icon={Mail}
                accent="neutral"
              />
            </div>

            <div className="mt-8 flex items-center gap-5">
              <a
                href="https://www.linkedin.com/in/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-[#737782] hover:text-[#e8343d] transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-[#737782] hover:text-[#e8343d] transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-[#282a31] bg-[#111216] p-6 sm:p-8">
            {status === "success" ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <h2 className="mt-4 text-xl font-semibold text-[#f5f5f7]">
                  Mensaje enviado
                </h2>
                <p className="mt-2 text-[#a7abb4]">
                  Revisaremos tu mensaje y te contactaremos en menos de 24 horas
                  hábiles.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm text-[#e8343d] hover:text-[#ff4650]"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Nombre *" htmlFor="name" error={errors.name}>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="Tu nombre"
                    />
                  </Field>

                  <Field label="Empresa" htmlFor="company">
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, company: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="Nombre de la empresa"
                    />
                  </Field>
                </div>

                <Field label="Correo *" htmlFor="email" error={errors.email}>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="tu@empresa.com"
                  />
                </Field>

                <Field
                  label="Tipo de proyecto *"
                  htmlFor="type"
                  error={errors.type}
                >
                  <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Selecciona una opción</option>
                    {projectTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Descripción del proyecto *"
                  htmlFor="description"
                  error={errors.description}
                >
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className={inputClass}
                    placeholder="¿Qué problema necesitas resolver? ¿Qué sistemas usas hoy? ¿Cuál es el objetivo de negocio?"
                  />
                </Field>

                <Field
                  label="Presupuesto aproximado (opcional)"
                  htmlFor="budget"
                >
                  <select
                    id="budget"
                    name="budget"
                    value={form.budget}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budget: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Selecciona un rango</option>
                    <option value="10k-25k">$10,000 – $25,000 USD</option>
                    <option value="25k-50k">$25,000 – $50,000 USD</option>
                    <option value="50k-100k">$50,000 – $100,000 USD</option>
                    <option value="100k+">Más de $100,000 USD</option>
                    <option value="unknown">Aún por definir</option>
                  </select>
                </Field>

                <input
                  type="text"
                  name="_gotcha"
                  className="hidden"
                  tabIndex={-1}
                />

                {status === "error" && (
                  <p className="text-sm text-[#e8343d]">
                    No se pudo enviar el mensaje. Intenta de nuevo o contáctanos
                    por email.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#e8343d] text-[#f5f5f7] font-medium shadow-[0_0_0_1px_#7d161c,0_8px_24px_-10px_rgba(232,52,61,0.35)] hover:bg-[#ff4650] hover:shadow-[0_0_0_1px_#7d161c,0_12px_32px_-8px_rgba(232,52,61,0.45)] transition-all disabled:opacity-60 min-h-[48px]"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar mensaje
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[#a7abb4] mb-1.5"
      >
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#e8343d]">{error}</p>}
    </div>
  );
}

function ContactCard({
  href,
  title,
  subtitle,
  icon: Icon,
  accent,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: typeof Phone;
  accent: "red" | "green" | "neutral";
}) {
  const accentClasses =
    accent === "red"
      ? "bg-[#7d161c]/40 text-[#e8343d] border-[#7d161c]"
      : accent === "green"
        ? "bg-green-500/10 text-green-400 border-green-500/20"
        : "bg-[#18191e] text-[#a7abb4] border-[#282a31]";
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex items-center gap-4 p-4 rounded-xl border border-[#282a31] bg-[#111216] hover:border-[#e8343d]/50 hover:bg-[#18191e] transition-colors"
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center border ${accentClasses}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-sm font-medium text-[#f5f5f7]">{title}</div>
        <div className="text-xs text-[#737782]">{subtitle}</div>
      </div>
    </a>
  );
}
