import { ReactNode, useState } from "react";
import { SidebarMenu } from "../SidebarMenu";
import { PageHeader } from "../PageHeader";
import { authFacade } from "../../facades/AuthFacade";
import { useBehaviorSubjectValue } from "../../hooks/useBehaviorSubjectValue";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const user = useBehaviorSubjectValue(authFacade.user$);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <SidebarMenu
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl">
          <PageHeader
            title={`Bem-vindo, ${user?.username ?? "usuário"}!`}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        <div className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
