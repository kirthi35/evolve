import React from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Separator } from "./ui/separator";
import gradientBackground from "../assets/gradient_background.png";

interface AppLayoutProps {
	children: React.ReactNode;
	breadcrumbs?: Array<{
		label: string;
		href?: string;
	}>;
}

const AppLayout: React.FC<AppLayoutProps> = ({
	children,
	breadcrumbs = [],
}) => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator orientation="vertical" className="mr-2 h-4" />
						{breadcrumbs.length > 0 && (
							<Breadcrumb>
								<BreadcrumbList>
									{breadcrumbs.map((crumb, index) => (
										<React.Fragment key={crumb.label}>
											<BreadcrumbItem className="hidden md:block">
												{crumb.href ? (
													<BreadcrumbLink href={crumb.href}>
														{crumb.label}
													</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
											{index < breadcrumbs.length - 1 && (
												<BreadcrumbSeparator className="hidden md:block" />
											)}
										</React.Fragment>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						)}
					</div>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-2 pt-0 relative">
					<div
						className="dark:block hidden"
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundImage: `url(${gradientBackground})`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							backgroundRepeat: "no-repeat",
							opacity: 0.4,
							// zIndex: -1,
						}}
					/>
					<div className="relative z-10">{children}</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default AppLayout;
