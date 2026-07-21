import { Clock, Globe, Layers, Cpu } from "lucide-react";

const items = [
  {
    icon: Clock,
    value: "10+",
    label: "años de experiencia",
  },
  {
    icon: Layers,
    value: "SaaS",
    label: "y sistemas empresariales",
  },
  {
    icon: Cpu,
    value: ".NET · React · Vue",
    label: "y Azure",
  },
  {
    icon: Globe,
    value: "Equipos",
    label: "internacionales",
  },
];

export function ZoCredibilityBar() {
  return (
    <section className="relative bg-[#0d0e11] border-y border-[#282a31]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e8343d]/40 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#282a31]">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center gap-4 px-2 lg:px-6 py-4 sm:py-0 ${i === 0 ? "lg:pl-0" : ""}`}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#111216] text-[#c9a24e] border border-[#282a31]">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-semibold text-[#f5f5f7]">
                    {item.value}
                  </div>
                  <div className="text-sm text-[#737782]">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
