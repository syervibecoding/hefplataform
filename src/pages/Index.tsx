import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardPage from "./DashboardPage";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import MelhoriasPage from "./MelhoriasPage";
import {
  type ProductId,
  type AnyClient,
  type ClientsByProduct,
  INITIAL_CLIENTS_BY_PRODUCT,
  INITIAL_MELHORIAS,
  PRODUCTS,
} from "@/data/constants";

export default function Index() {
  const [activePage, setActivePage] = useState("dashboard");
  const [activeProduct, setActiveProduct] = useState<ProductId>("hefsys");
  const [clientsByProduct, setClientsByProduct] = useState<ClientsByProduct>(INITIAL_CLIENTS_BY_PRODUCT);
  const [melhorias] = useState(INITIAL_MELHORIAS);
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

  const renderPage = () => {
    if (activePage === "client-detail" && selectedClient) {
      return <ClientDetailPage client={selectedClient} activeProduct={activeProduct} onBack={() => handleNavigate("clients")} />;
    }
    switch (activePage) {
      case "dashboard":
        return <DashboardPage clients={currentClients} melhorias={melhorias} activeProduct={activeProduct} />;
      case "clients":
        return <ClientsPage clients={currentClients} activeProduct={activeProduct} onSelectClient={handleSelectClient} onAddClient={handleAddClient} />;
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
