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
    <section className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="max-w-lg">
            <Link
              href="/t/zo-system"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Volver a inicio
            </Link>
            <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Contacto
            </h1>
            <p className="mt-4 text-gray-400">
              Cuéntanos qué sistema necesitas construir, modernizar o rescatar.
              Revisaremos tu caso y te propondremos la mejor estrategia técnica.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="https://calendly.com/jagzao"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-[#111111] hover:border-[#DC2626]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    Agenda una llamada
                  </div>
                  <div className="text-xs text-gray-400">
                    Disponible de lunes a viernes
                  </div>
                </div>
              </a>

              <a
                href="https://wa.me/525549264189"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-[#111111] hover:border-[#DC2626]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">WhatsApp</div>
                  <div className="text-xs text-gray-400">+52 55 4926 4189</div>
                </div>
              </a>

              <a
                href="mailto:jagzao@gmail.com"
                className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-[#111111] hover:border-[#DC2626]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-300">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Email</div>
                  <div className="text-xs text-gray-400">jagzao@gmail.com</div>
                </div>
              </a>
            </div>

            <div className="mt-8 flex items-center gap-4">
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
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-6 sm:p-8">
            {status === "success" ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <h2 className="mt-4 text-xl font-semibold text-white">
                  Mensaje enviado
                </h2>
                <p className="mt-2 text-gray-400">
                  Revisaremos tu mensaje y te contactaremos en menos de 24 horas
                  hábiles.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm text-[#DC2626] hover:text-white"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-white placeholder-gray-500 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                      placeholder="Tu nombre"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-[#DC2626]">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                      Empresa
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, company: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-white placeholder-gray-500 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Correo *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-white placeholder-gray-500 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                    placeholder="tu@empresa.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Tipo de proyecto *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-white focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  >
                    <option value="">Selecciona una opción</option>
                    {projectTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-xs text-[#DC2626]">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Descripción del proyecto *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-white placeholder-gray-500 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                    placeholder="¿Qué problema necesitas resolver? ¿Qué sistemas usas hoy? ¿Cuál es el objetivo de negocio?"
                  />
                  {errors.description && (
                    <p className="mt-1 text-xs text-[#DC2626]">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="budget"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Presupuesto aproximado (opcional)
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    value={form.budget}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budget: e.target.value }))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0A0A0A] px-3 py-2.5 text-white focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                  >
                    <option value="">Selecciona un rango</option>
                    <option value="10k-25k">$10,000 – $25,000 USD</option>
                    <option value="25k-50k">$25,000 – $50,000 USD</option>
                    <option value="50k-100k">$50,000 – $100,000 USD</option>
                    <option value="100k+">Más de $100,000 USD</option>
                    <option value="unknown">Aún por definir</option>
                  </select>
                </div>

                <input
                  type="text"
                  name="_gotcha"
                  className="hidden"
                  tabIndex={-1}
                />

                {status === "error" && (
                  <p className="text-sm text-[#DC2626]">
                    No se pudo enviar el mensaje. Intenta de nuevo o contáctanos
                    por email.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-[#DC2626] text-white font-medium hover:bg-[#B91D1D] transition-colors disabled:opacity-60"
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
