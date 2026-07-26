import { createFileRoute } from "@tanstack/react-router";
import { HorizonPowerShell } from "../themes/horizon/pages/HorizonPowerShell";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/powershell")({
  head: () => ({ 
    meta: [
      { title: "PowerShell PTY Suite — NEXUS" }, 
      { name: "description", content: "Interactive Remote PowerShell PTY sessions and automation suite for your fleet." }
    ] 
  }),
  component: PowerShellRouteComponent,
});

function PowerShellRouteComponent() {
  return (
    <PageWrapper>
      <HorizonPowerShell />
    </PageWrapper>
  );
}
