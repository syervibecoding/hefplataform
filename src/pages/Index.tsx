import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardPage from "./DashboardPage";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import MelhoriasPage from "./MelhoriasPage";
import CalendarPage from "./CalendarPage";
import UsersPage from "./UsersPage";
import { useClients } from "@/hooks/useClients";
import { useMelhorias } from "@/hooks/useMelhorias";
import {
  type ProductId,
  type AnyClient,
  type HefSysClient,
  PRODUCTS,
} from "@/data/constants";

export default function Index() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeProduct, setActiveProduct] = useState<ProductId>("hefsys");
  const [selectedClient, setSelectedClient] = useState<AnyClient | null>(null);

  const { clients, isLoading: clientsLoading, addClient, editClient, deleteClient } = useClients(activeProduct);
  const { melhorias, isLoading: melhoriasLoading, addMelhoria, editMelhoria, deleteMelhoria, changeStatus } = useMelhorias();

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
    addClient.mutate(data);
  };

  const handleEditClient = (id: string, data: any) => {
    editClient.mutate({ id, data });
    if (selectedClient?.id === id) {
      setSelectedClient((prev) => prev ? { ...prev, ...data } : prev);
    }
  };

  const handleDeleteClient = (id: string) => {
    deleteClient.mutate(id);
    if (selectedClient?.id === id) {
      setSelectedClient(null);
      setActivePage("clients");
    }
  };

  const handleAddMelhoria = (data: any) => {
    addMelhoria.mutate(data);
  };

  const handleEditMelhoria = (id: string, data: any) => {
    editMelhoria.mutate({ id, data });
  };

  const handleDeleteMelhoria = (id: string) => {
    deleteMelhoria.mutate(id);
  };

  const handleChangeStatus = (id: string, status: any) => {
    changeStatus.mutate({ id, status });
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
        return <DashboardPage clients={clients} melhorias={melhorias} activeProduct={activeProduct} />;
      case "clients":
        return (
          <ClientsPage
            clients={clients}
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
        return <CalendarPage clients={clients.filter((c): c is HefSysClient => "cnpjs" in c)} />;
      case "users":
        return <UsersPage />;
      case "workflow":
      case "settings":
        return (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-sm">Página em construção</p>
          </div>
        );
      default:
        return <DashboardPage clients={clients} melhorias={melhorias} activeProduct={activeProduct} />;
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
