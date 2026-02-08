import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardPage from "./DashboardPage";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import MelhoriasPage from "./MelhoriasPage";
import { Client, INITIAL_CLIENTS, INITIAL_MELHORIAS } from "@/data/constants";

export default function Index() {
  const [activePage, setActivePage] = useState("dashboard");
  const [clients] = useState(INITIAL_CLIENTS);
  const [melhorias] = useState(INITIAL_MELHORIAS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSelectedClient(null);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setActivePage("client-detail");
  };

  const renderPage = () => {
    if (activePage === "client-detail" && selectedClient) {
      return <ClientDetailPage client={selectedClient} onBack={() => handleNavigate("clients")} />;
    }
    switch (activePage) {
      case "dashboard":
        return <DashboardPage clients={clients} melhorias={melhorias} />;
      case "clients":
        return <ClientsPage clients={clients} onSelectClient={handleSelectClient} />;
      case "melhorias":
        return <MelhoriasPage melhorias={melhorias} />;
      case "calendar":
      case "workflow":
      case "settings":
        return (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-sm">Página em construção</p>
          </div>
        );
      default:
        return <DashboardPage clients={clients} melhorias={melhorias} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <main className="ml-60 min-h-screen">
        <Topbar title={activePage === "client-detail" ? "clients" : activePage} />
        <div className="p-7">{renderPage()}</div>
      </main>
    </div>
  );
}
