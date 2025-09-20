import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const ThemeSwitcher: React.FC = () => {
	const [theme, setTheme] = useState<Theme>("dark");

	useEffect(() => {
		// Get saved theme from localStorage or default to dark
		const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
		setTheme(savedTheme);
		applyTheme(savedTheme);
	}, []);

	const applyTheme = (newTheme: Theme) => {
		const root = document.documentElement;

		if (newTheme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
				.matches
				? "dark"
				: "light";
			root.classList.toggle("dark", systemTheme === "dark");
			root.classList.toggle("light", systemTheme === "light");
		} else {
			root.classList.toggle("dark", newTheme === "dark");
			root.classList.toggle("light", newTheme === "light");
		}
	};

	const handleThemeChange = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
		applyTheme(newTheme);
	};

	const getThemeIcon = () => {
		switch (theme) {
			case "light":
				return <Sun className="h-4 w-4" />;
			case "dark":
				return <Moon className="h-4 w-4" />;
			case "system":
				return <Monitor className="h-4 w-4" />;
			default:
				return <Moon className="h-4 w-4" />;
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="w-full justify-start">
					{getThemeIcon()}
					<span className="ml-2">Theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => handleThemeChange("light")}>
					<Sun className="mr-2 h-4 w-4" />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange("dark")}>
					<Moon className="mr-2 h-4 w-4" />
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => handleThemeChange("system")}>
					<Monitor className="mr-2 h-4 w-4" />
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ThemeSwitcher;
