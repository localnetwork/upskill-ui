import { useRef } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  BarChart3,
  Palette,
  Cloud,
  BrainCircuit,
  KanbanSquare,
  Shield,
  Smartphone,
  Container,
  Database,
  Hexagon,
} from "lucide-react";
import useSectionReveal from "@/components/home/useSectionReveal";

const skills = [
  { name: "React", icon: Code2, courses: 48 },
  { name: "Python", icon: Terminal, courses: 56 },
  { name: "Data Analysis", icon: BarChart3, courses: 42 },
  { name: "UI/UX Design", icon: Palette, courses: 35 },
  { name: "Cloud Computing", icon: Cloud, courses: 38 },
  { name: "Machine Learning", icon: BrainCircuit, courses: 29 },
  { name: "Product Management", icon: KanbanSquare, courses: 31 },
  { name: "Cybersecurity", icon: Shield, courses: 27 },
  { name: "Mobile Development", icon: Smartphone, courses: 33 },
  { name: "DevOps", icon: Container, courses: 25 },
  { name: "SQL & Databases", icon: Database, courses: 44 },
  { name: "Blockchain", icon: Hexagon, courses: 18 },
];

export default function PopularSkillsSection() {
  const sectionRef = useRef(null);
  useSectionReveal(sectionRef, { stagger: 0.06 });

  return (
    <section
      id="popular-skills"
      ref={sectionRef}
      data-home-section=""
      className="bg-white py-20 md:py-24"
    >
      <div className="container">
        <div data-reveal="" className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Popular skills to start learning
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Building in-demand skills that top companies hire for
          </p>
        </div>
        <div
          data-reveal=""
          className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {skills.map((skill) => {
            const IconComponent = skill.icon;
            return (
              <Link
                key={skill.name}
                href={`/courses?search=${encodeURIComponent(skill.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 transition-colors duration-300 group-hover:bg-primary">
                  <IconComponent className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-900">{skill.name}</p>
                <p className="mt-1 text-xs text-slate-500">{skill.courses} courses</p>
                <span className="mt-3 inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-0.5 text-[11px] font-medium text-primary">
                  In demand
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
