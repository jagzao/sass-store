const categories = [
  {
    title: "Backend",
    items: ["C#", ".NET", "ASP.NET Core", "Minimal APIs", "FastAPI", "Node.js"],
  },
  {
    title: "Frontend",
    items: ["React", "Vue", "Nuxt", "Next.js", "TypeScript"],
  },
  {
    title: "Datos",
    items: ["PostgreSQL", "SQL Server", "Redis", "Cloudflare D1"],
  },
  {
    title: "Cloud y DevOps",
    items: ["Azure", "Cloudflare", "Docker", "GitHub Actions", "Azure DevOps"],
  },
  {
    title: "IA y automatización",
    items: [
      "RAG",
      "Agentes",
      "OpenAI-compatible APIs",
      "n8n",
      "Procesamiento documental",
    ],
  },
];

export function ZoStack() {
  return (
    <section id="stack" className="relative bg-[#070708] py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0d0e11] via-transparent to-[#0d0e11] opacity-40" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[#e8343d] uppercase tracking-wider">
            Stack tecnológico
          </p>
          <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-tight text-[#f5f5f7] leading-tight">
            Tecnologías que usamos en producción
          </h2>
        </div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="rounded-xl border border-[#282a31] bg-[#111216] p-6 hover:border-[#e8343d]/40 transition-colors"
            >
              <h3 className="text-xs font-semibold text-[#c9a24e] uppercase tracking-wider mb-5 pb-3 border-b border-[#282a31]">
                {cat.title}
              </h3>
              <ul className="space-y-3">
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-[#a7abb4] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e8343d]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
