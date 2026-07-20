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
    <section id="stack" className="bg-[#0A0A0A] py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-medium text-[#DC2626] uppercase tracking-wider">
            Stack tecnológico
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Tecnologías que usamos en producción
          </h2>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="rounded-xl border border-white/10 bg-[#111111] p-5"
            >
              <h3 className="text-sm font-medium text-[#F59E0B] uppercase tracking-wider mb-4">
                {cat.title}
              </h3>
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-gray-300 flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#DC2626]" />
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
