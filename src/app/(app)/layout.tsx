import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppHeader from "@/components/AppHeader";
import { SessionProvider } from "@/components/SessionProvider";
import { ConfirmProvider } from "@/components/ConfirmProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider user={session}>
      <ConfirmProvider>
        <div className="min-h-screen">
          <AppHeader user={session} />
          <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
        </div>
      </ConfirmProvider>
    </SessionProvider>
  );
}
