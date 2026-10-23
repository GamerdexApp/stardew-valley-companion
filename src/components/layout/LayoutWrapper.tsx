"use client";

import { customTheme } from "@/app/theme";
import { ThemeProvider } from "flowbite-react";
import { ToastContainer } from "react-toastify";
import { AppNavbar } from "@/comps/layout/AppNavbar";
import { AppSidebar } from "@/comps/layout/sidebar/AppSidebar";
import { Footer } from "@/comps/layout/Footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider theme={customTheme}>
			<div className="flex h-screen flex-col overflow-hidden">
				<AppNavbar />
				<div className="flex flex-1 overflow-hidden">
					<AppSidebar />
					<div className="flex flex-1 flex-col overflow-hidden">
						<main className="bg-bg flex flex-1 flex-col overflow-y-auto">
							<div className="flex-1">{children}</div>
							<Footer />
						</main>
					</div>
				</div>
			</div>
			<ToastContainer
				closeButton={false}
				hideProgressBar
				newestOnTop
				draggable
				stacked
				className={"mt-14 lg:mt-0 lg:mr-24"}
				toastClassName={
					"shadow-md rounded-lg text-gray-500 bg-white dark:text-gray-400 dark:bg-gray-800 p-0"
				}
			/>
		</ThemeProvider>
	);
}
