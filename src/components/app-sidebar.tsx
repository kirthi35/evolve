"use client";

import * as React from "react";
import {
	BookOpen,
	GalleryVerticalEnd,
	Settings2,
	SquareTerminal,
	Users,
	BarChart3,
	Video,
	FileText,
	UserCheck,
	LayoutDashboard,
	Library,
	Upload,
	LifeBuoy,
	Send,
} from "lucide-react";
import { useLocation } from "react-router-dom";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useSelector } from "react-redux";
import { store } from "../store/index";

type RootState = ReturnType<typeof store.getState>;

// Get navigation data based on context
const getNavigationData = (location: string, isAdmin: boolean) => {
	const isAdminRoute = location.startsWith("/admin");

	const teams = [
		{
			name: "Clear",
			logo: GalleryVerticalEnd,
			plan: isAdminRoute ? "Admin Panel" : "Research Platform",
		},
	];

	// For non-admin users, return empty navigation arrays
	if (!isAdmin) {
		return {
			teams,
			navMain: [],
			projects: [],
			navSecondary: [],
		};
	}

	// Admin-specific navigation
	const adminNavMain = [
		{
			title: "Dashboard",
			url: "/admin/dashboard",
			icon: LayoutDashboard,
			isActive: location === "/admin/dashboard",
			items: [],
		},
		{
			title: "Content Library",
			url: "/admin/content",
			icon: Library,
			isActive: location.startsWith("/admin/content"),
			items: [
				{
					title: "All Content",
					url: "/admin/content",
				},
				{
					title: "Add New Content",
					url: "/admin/content/new",
				},
			],
		},
		{
			title: "User Management",
			url: "/admin/users",
			icon: Users,
			isActive: location.startsWith("/admin/users"),
			items: [],
		},
		{
			title: "Upload Content",
			url: "/admin/upload",
			icon: Upload,
			isActive: location.startsWith("/admin/upload"),
			items: [],
		},
	];

	// Regular user navigation
	const userNavMain = [
		{
			title: "Study Dashboard",
			url: "/dashboard",
			icon: SquareTerminal,
			isActive: location === "/dashboard",
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
			isActive: location.startsWith("/content"),
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
	];

	// Add admin access to regular users if they're admin
	if (isAdmin && !isAdminRoute) {
		userNavMain.push({
			title: "Admin Panel",
			url: "/admin/dashboard",
			icon: Settings2,
			isActive: false,
			items: [
				{
					title: "Dashboard",
					url: "/admin/dashboard",
				},
				{
					title: "User Management",
					url: "/admin/users",
				},
				{
					title: "Content Library",
					url: "/admin/content",
				},
			],
		});
	}

	// Always show help
	const helpNav = {
		title: "Help & Support",
		url: "/help",
		icon: BookOpen,
		isActive: location.startsWith("/help"),
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
	};

	const navMain = isAdminRoute ? adminNavMain : userNavMain;
	if (!isAdminRoute) {
		navMain.push(helpNav);
	}

	const projects = isAdminRoute
		? []
		: [
				{
					name: "User Study A",
					url: "/study/group-a",
					icon: UserCheck,
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
			];

	const navSecondary = [
		{
			title: "Support",
			url: "/help",
			icon: LifeBuoy,
		},
		{
			title: "Feedback",
			url: "/feedback",
			icon: Send,
		},
	];

	return { teams, navMain, projects, navSecondary };
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useSelector((state: RootState) => state.user);
	const location = useLocation();

	const data = getNavigationData(location.pathname, user.isAdmin);

	const navUser = user.airtableRecord
		? {
				name: user.airtableRecord.fields.UserID,
				email: user.airtableRecord.fields.Email,
				avatar: "/avatars/participant.jpg",
			}
		: user.email
			? {
					name: user.email.split("@")[0], // Use email username if no airtable record
					email: user.email,
					avatar: "/avatars/participant.jpg",
				}
			: {
					name: "Guest User",
					email: "guest@example.com",
					avatar: "/avatars/guest.jpg",
				};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				{data.navMain.length > 0 && <NavMain items={data.navMain} />}
				{data.projects.length > 0 && <NavProjects projects={data.projects} />}
				{data.navSecondary.length > 0 && (
					<NavSecondary items={data.navSecondary} />
				)}
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={navUser} isAdmin={user.isAdmin} />
				<ThemeSwitcher />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
