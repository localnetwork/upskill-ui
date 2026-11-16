import {
  Bot,
  Brain,
  Briefcase,
  Cloud,
  Code,
  Cog,
  Database,
  Globe,
  GraduationCap,
  LineChart,
  Megaphone,
  Palette,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Terminal,
  TestTube,
  Users,
  Workflow,
} from "lucide-react";

export const SKILL_ICONS = {
  code: Code,
  terminal: Terminal,
  bot: Bot,
  brain: Brain,
  sparkles: Sparkles,
  workflow: Workflow,
  cog: Cog,
  test: TestTube,
  database: Database,
  server: Server,
  cloud: Cloud,
  shield: Shield,
  globe: Globe,
  smartphone: Smartphone,
  chart: LineChart,
  palette: Palette,
  megaphone: Megaphone,
  briefcase: Briefcase,
  users: Users,
  graduation: GraduationCap,
};

export function getSkillIcon(name) {
  return SKILL_ICONS[name] || null;
}

export function normalizeSkill(skill) {
  if (typeof skill === "string") return { label: skill, icon: "" };
  return { label: skill?.label || "", icon: skill?.icon || "" };
}
