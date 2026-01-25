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
        <PageHeader
          title={`Bem-vindo, ${user?.username ?? "usuário"}!`}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="h-[calc(100vh-73px)] overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
