import ChartBar from "@/components/icons/ChartBar";
import ChatBubble from "@/components/icons/ChatBubble";
import Settings from "@/components/icons/Settings";
import Video from "@/components/icons/Video";
import { MonitorPlay } from "lucide-react";

export const instructorNavLinks = [
  {
    name: "Courses",
    link: "/instructor/courses",
    icon: <MonitorPlay className="w-[38px] h-[38px]" />,
  },
  {
    name: "Communication",
    link: "/instructor/communication",
    icon: <ChatBubble className="w-[38px] h-[38px]" />,
  },
  {
    name: "Performance",
    link: "/instructor/performance",
    icon: <ChartBar className="w-[38px] h-[38px]" />,
  },
  {
    name: "Settings",
    link: "/instructor/settings",
    icon: <Settings className="w-[38px] h-[38px]" />,
  },
];
