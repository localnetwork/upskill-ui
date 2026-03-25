import { MonitorPlay, MessageSquare, BarChart3, Settings } from "lucide-react";

const iconClass = "w-[38px] h-[38px]";

export const instructorNavLinks = [
  {
    name: "Courses",
    link: "/instructor/courses",
    icon: <MonitorPlay className={iconClass} />,
  },
  {
    name: "Communication",
    link: "/instructor/communication",
    icon: <MessageSquare className={iconClass} />,
  },
  {
    name: "Performance",
    link: "/instructor/performance",
    icon: <BarChart3 className={iconClass} />,
  },
  {
    name: "Settings",
    link: "/instructor/settings",
    icon: <Settings className={iconClass} />,
  },
];
