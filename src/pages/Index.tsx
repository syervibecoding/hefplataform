import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardPage from "./DashboardPage";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import MelhoriasPage from "./MelhoriasPage";
import CalendarPage from "./CalendarPage";
import {
  type ProductId,
  type AnyClient,
  type Melhoria,
  type MelhoriaStatus,
  type ClientsByProduct,
  type HefSysClient,
  isHefSysClient,
  INITIAL_CLIENTS_BY_PRODUCT,
  INITIAL_MELHORIAS,
  PRODUCTS,
} from "@/data/constants";

export default function Index() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeProduct, setActiveProduct] = useState<ProductId>("hefsys");
  const [clientsByProduct, setClientsByProduct] = useState<ClientsByProduct>(INITIAL_CLIENTS_BY_PRODUCT);
  const [melhorias, setMelhorias] = useState<Melhoria[]>(INITIAL_MELHORIAS);
  const [selectedClient, setSelectedClient] = useState<AnyClient | null>(null);

  const currentClients = clientsByProduct[activeProduct];
  const currentProductInfo = PRODUCTS.find((p) => p.id === activeProduct)!;

  const handleNavigate = (page: string) => {
    setActivePage(page);
    setSelectedClient(null);
  };

  const handleChangeProduct = (product: ProductId) => {
    setActiveProduct(product);
    setSelectedClient(null);
    setActivePage("dashboard");
  };

  const handleSelectClient = (client: AnyClient) => {
    setSelectedClient(client);
    setActivePage("client-detail");
  };

  const handleAddClient = (data: any) => {
    const newId = Date.now();
    const newClient = { id: newId, ...data };
    setClientsByProduct((prev) => ({
      ...prev,
      [activeProduct]: [...prev[activeProduct], newClient],
    }));
  };

  const handleEditClient = (id: number, data: any) => {
    setClientsByProduct((prev) => ({
      ...prev,
      [activeProduct]: prev[activeProduct].map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    }));
    if (selectedClient?.id === id) {
      setSelectedClient((prev) => prev ? { ...prev, ...data } : prev);
    }
  };

  const handleDeleteClient = (id: number) => {
    setClientsByProduct((prev) => ({
      ...prev,
      [activeProduct]: prev[activeProduct].filter((c) => c.id !== id),
    }));
    if (selectedClient?.id === id) {
      setSelectedClient(null);
      setActivePage("clients");
    }
  };

  // Melhorias handlers
  const handleAddMelhoria = (data: Omit<Melhoria, "id">) => {
    setMelhorias((prev) => [...prev, { id: Date.now(), ...data }]);
  };

  const handleEditMelhoria = (id: number, data: Partial<Melhoria>) => {
    setMelhorias((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  const handleDeleteMelhoria = (id: number) => {
    setMelhorias((prev) => prev.filter((m) => m.id !== id));
  };

  const handleChangeStatus = (id: number, status: MelhoriaStatus) => {
    setMelhorias((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
  };

  const renderPage = () => {
    if (activePage === "client-detail" && selectedClient) {
      return (
        <ClientDetailPage
          client={selectedClient}
          activeProduct={activeProduct}
          onBack={() => handleNavigate("clients")}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
        />
      );
    }
    switch (activePage) {
      case "dashboard":
        return <DashboardPage clients={currentClients} melhorias={melhorias} activeProduct={activeProduct} />;
      case "clients":
        return (
          <ClientsPage
            clients={currentClients}
            activeProduct={activeProduct}
            onSelectClient={handleSelectClient}
            onAddClient={handleAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
          />
        );
      case "melhorias":
        return (
          <MelhoriasPage
            melhorias={melhorias}
            onAddMelhoria={handleAddMelhoria}
            onEditMelhoria={handleEditMelhoria}
            onDeleteMelhoria={handleDeleteMelhoria}
            onChangeStatus={handleChangeStatus}
          />
        );
      case "calendar":
        return <CalendarPage clients={clientsByProduct.hefsys as HefSysClient[]} />;
      case "workflow":
      case "settings":
        return (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-sm">Página em construção</p>
          </div>
        );
      default:
        return <DashboardPage clients={currentClients} melhorias={melhorias} activeProduct={activeProduct} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} activeProduct={activeProduct} onChangeProduct={handleChangeProduct} />
      <main className="ml-60 min-h-screen">
        <Topbar title={activePage === "client-detail" ? "clients" : activePage} tag={currentProductInfo.nome} />
        <div className="p-7">{renderPage()}</div>
      </main>
    </div>
  );
}
