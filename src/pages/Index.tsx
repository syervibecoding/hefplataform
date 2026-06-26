import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import DashboardPage from "./DashboardPage";
import GeneralDashboardPage from "./GeneralDashboardPage";
import CashFlowPage from "./CashFlowPage";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import MelhoriasPage from "./MelhoriasPage";
import CalendarPage from "./CalendarPage";
import UsersPage from "./UsersPage";
import MaterialsPage from "./MaterialsPage";
import LovableProductsPage from "./LovableProductsPage";
import SupportPage from "./SupportPage";
import CRMPage from "./CRMPage";
import WorkflowPage from "./WorkflowPage";
import HomePage from "./HomePage";
import OperacionalPage from "./OperacionalPage";
import ConsultoriaPage from "./ConsultoriaPage";
import ConsultoriaReportPage from "./ConsultoriaReportPage";
import AssistantPage from "./AssistantPage";
import FinancialImportsPage from "./FinancialImportsPage";
import {
  SEED_CONSULTORIA_CLIENTS,
  novoCliente as novoConsultoriaCliente,
  type ConsultoriaClient,
  type RelatorioConsultoria,
} from "@/data/consultoria";
import { useClients } from "@/hooks/useClients";
import { useMelhorias } from "@/hooks/useMelhorias";
import { useProducts } from "@/hooks/useProducts";
import { useSupportRealtime } from "@/hooks/useUnreadSupport";
import {
  type ProductId,
  type AnyClient,
} from "@/data/constants";

const NAV_STATE_KEY = "hef:nav-state:v1";

type PersistedNav = {
  activePage?: string;
  activeProduct?: ProductId;
  selectedClient?: AnyClient | null;
  selectedConsultoriaId?: string | null;
};

function loadNavState(): PersistedNav {
  try {
    const raw = localStorage.getItem(NAV_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedNav;
  } catch {
    return {};
  }
}

export default function Index() {
  useSupportRealtime();
  const persisted = loadNavState();
  const [activePage, setActivePage] = useState<string>(persisted.activePage || "home");
  const [activeProduct, setActiveProduct] = useState<ProductId>(persisted.activeProduct ?? "");
  const [selectedClient, setSelectedClient] = useState<AnyClient | null>(persisted.selectedClient ?? null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [consultoriaClients, setConsultoriaClients] = useState<ConsultoriaClient[]>(SEED_CONSULTORIA_CLIENTS);
  const [selectedConsultoriaId, setSelectedConsultoriaId] = useState<string | null>(persisted.selectedConsultoriaId ?? null);

  const { products, isLoading: productsLoading } = useProducts();
  const { clients, isLoading: clientsLoading, addClient, editClient, deleteClient } = useClients(activeProduct);
  const { melhorias, isLoading: melhoriasLoading, addMelhoria, editMelhoria, deleteMelhoria, changeStatus } = useMelhorias();

  // Set first product as default when products load
  useEffect(() => {
    if (products.length > 0 && !activeProduct) {
      setActiveProduct(products[0].id);
    }
  }, [products, activeProduct]);

  // Persist navigation state across reloads / tab switches
  useEffect(() => {
    try {
      localStorage.setItem(
        NAV_STATE_KEY,
        JSON.stringify({ activePage, activeProduct, selectedClient, selectedConsultoriaId })
      );
    } catch {}
  }, [activePage, activeProduct, selectedClient, selectedConsultoriaId]);

  const currentProductInfo = products.find((p) => p.id === activeProduct);

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

  const selectedConsultoria = consultoriaClients.find((c) => c.id === selectedConsultoriaId) || null;

  const handleAddConsultoriaClient = (nome: string, tipo: string, dataInicio: string) => {
    setConsultoriaClients((prev) => [...prev, novoConsultoriaCliente(nome, tipo, dataInicio)]);
  };

  const handleOpenConsultoriaReport = (id: string) => {
    setSelectedConsultoriaId(id);
    setActivePage("consultoria-relatorio");
  };

  const handleUpdateConsultoriaReport = (rel: RelatorioConsultoria) => {
    if (!selectedConsultoriaId) return;
    setConsultoriaClients((prev) =>
      prev.map((c) => (c.id === selectedConsultoriaId ? { ...c, relatorio: rel } : c))
    );
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
      case "home":
        return <HomePage products={products} onNavigate={handleNavigate} onChangeProduct={handleChangeProduct} />;
      case "operacional":
        return <OperacionalPage onNavigate={handleNavigate} onChangeProduct={handleChangeProduct} />;
      case "consultoria":
        return (
          <ConsultoriaPage
            clients={consultoriaClients}
            onAddClient={handleAddConsultoriaClient}
            onOpenReport={handleOpenConsultoriaReport}
            onNavigate={handleNavigate}
          />
        );
      case "consultoria-relatorio":
        if (selectedConsultoria) {
          return (
            <ConsultoriaReportPage
              client={selectedConsultoria}
              onUpdate={handleUpdateConsultoriaReport}
              onBack={() => handleNavigate("consultoria")}
            />
          );
        }
        return (
          <ConsultoriaPage
            clients={consultoriaClients}
            onAddClient={handleAddConsultoriaClient}
            onOpenReport={handleOpenConsultoriaReport}
            onNavigate={handleNavigate}
          />
        );
      case "general-dashboard":
        return <GeneralDashboardPage products={products} melhorias={melhorias} />;
      case "cash-flow":
        return <CashFlowPage />;
      case "dashboard":
        return <DashboardPage clients={clients} melhorias={melhorias} activeProduct={activeProduct} products={products} />;
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
        return <CalendarPage clients={clients} activeProduct={activeProduct} />;
      case "users":
        return <UsersPage />;
      case "materials":
        return <MaterialsPage />;
      case "lovable-products":
        return <LovableProductsPage />;
      case "support":
        return <SupportPage />;
      case "crm":
        return <CRMPage />;
      case "workflow":
        return <WorkflowPage />;
      case "assistant":
        return <AssistantPage />;
      case "financial-imports":
        return <FinancialImportsPage />;
      case "settings":
        return (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-sm">Página em construção</p>
          </div>
        );
      default:
        return <DashboardPage clients={clients} melhorias={melhorias} activeProduct={activeProduct} products={products} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        activeProduct={activeProduct}
        onChangeProduct={handleChangeProduct}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <main className="md:ml-60 min-h-screen">
        <Topbar
          title={activePage === "client-detail" ? "clients" : activePage}
          onOpenMenu={() => setMobileMenuOpen(true)}
          tag={
            activePage === "home" || activePage === "operacional" || activePage === "consultoria" || activePage === "consultoria-relatorio" ? ""
            : activePage === "general-dashboard" ? "Visão Geral"
            : activePage === "cash-flow" ? "Financeiro"
            : activePage === "assistant" ? "IA"
            : activePage === "financial-imports" ? "Financeiro"
            : currentProductInfo?.nome || ""
          }
        />
        <div className="p-4 md:p-7">{renderPage()}</div>
      </main>
    </div>
  );
}
