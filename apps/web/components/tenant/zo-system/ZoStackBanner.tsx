"use client";

import { motion } from "framer-motion";

const stack = [
  { name: ".NET 8", category: "Backend" },
  { name: "ASP.NET Core", category: "Backend" },
  { name: "C#", category: "Backend" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "TypeScript", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "NestJS", category: "Backend" },
  { name: "Python", category: "Automation" },
  { name: "n8n", category: "Automation" },
  { name: "Azure", category: "Cloud" },
  { name: "PostgreSQL", category: "Data" },
  { name: "SQL Server", category: "Data" },
  { name: "Docker", category: "DevOps" },
];

export const ZoStackBanner = () => {
  return (
    <section className="border-y border-white/10 bg-white/[0.02] py-8">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-gray-500 mb-4 uppercase tracking-widest">
          Stack de trabajo
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {stack.map((tech, i) => (
            <motion.span
              key={tech.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              viewport={{ once: true }}
              className="px-3 py-1.5 rounded-md border border-white/10 bg-[#161616] text-sm text-gray-300"
              title={tech.category}
            >
              {tech.name}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
};
