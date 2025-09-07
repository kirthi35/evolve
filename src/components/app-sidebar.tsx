"use client"

import * as React from "react"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  BarChart3,
  Video,
  FileText,
  UserCheck,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSelector } from "react-redux"
import { RootState } from "@/store"

// Study application data
const data = {
  teams: [
    {
      name: "Evolve Study",
      logo: GalleryVerticalEnd,
      plan: "Research Platform",
    },
  ],
  navMain: [
    {
      title: "Study Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Group A Videos",
          url: "/dashboard?group=a",
        },
        {
          title: "Group B Videos",
          url: "/dashboard?group=b",
        },
        {
          title: "Progress",
          url: "/dashboard/progress",
        },
      ],
    },
    {
      title: "Content",
      url: "/content",
      icon: Video,
      items: [
        {
          title: "Video Library",
          url: "/content/videos",
        },
        {
          title: "Questionnaires",
          url: "/content/questions",
        },
        {
          title: "Study Materials",
          url: "/content/materials",
        },
        {
          title: "Shorts",
          url: "/shorts",
        },
      ],
    },
    {
      title: "Admin Panel",
      url: "/admin",
      icon: Settings2,
      items: [
        {
          title: "User Management",
          url: "/admin/users",
        },
        {
          title: "Upload Content",
          url: "/admin/upload",
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
        },
        {
          title: "Study Settings",
          url: "/admin/settings",
        },
      ],
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: BookOpen,
      items: [
        {
          title: "Getting Started",
          url: "/help/start",
        },
        {
          title: "FAQ",
          url: "/help/faq",
        },
        {
          title: "Contact Support",
          url: "/help/contact",
        },
      ],
    },
  ],
  projects: [
    {
      name: "User Study A",
      url: "/study/group-a",
      icon: Users,
    },
    {
      name: "User Study B",
      url: "/study/group-b",
      icon: BarChart3,
    },
    {
      name: "Research Data",
      url: "/research/data",
      icon: FileText,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useSelector((state: RootState) => state.user);

  const navUser = user.airtableRecord ? {
    name: user.airtableRecord.fields.UserID,
    email: user.airtableRecord.fields.Email,
    avatar: "/avatars/participant.jpg",
  } : null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <div className="mt-auto p-2">
          <ThemeSwitcher />
        </div>
      </SidebarContent>
      <SidebarFooter>
        {navUser && <NavUser user={navUser} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
