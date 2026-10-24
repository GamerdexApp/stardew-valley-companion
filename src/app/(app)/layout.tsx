import { SyncProvider } from "@/lib/contexts/SyncContext";
import { AppShell } from "@/comps/shell/AppShell";

const AppLayout = ({ children }: { children: React.ReactNode }) => (
	<SyncProvider>
		<AppShell>{children}</AppShell>
	</SyncProvider>
);

export default AppLayout;
