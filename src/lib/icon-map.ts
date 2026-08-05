import {
  Calculator, Megaphone, Bot, MonitorSmartphone, Box, Briefcase, Code, Database,
  FileText, Globe, Heart, Layers, Mail, MessageSquare, Phone, Rocket, Settings,
  Shield, ShoppingCart, Star, Target, Users, Zap, Home, Calendar, BookOpen,
  Package, TrendingUp, Sparkles, FileUp, UserCog, LayoutDashboard, LifeBuoy,
  Wallet, BarChart3, ClipboardList, Building2, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator, Megaphone, Bot, MonitorSmartphone, Box, Briefcase, Code, Database,
  FileText, Globe, Heart, Layers, Mail, MessageSquare, Phone, Rocket, Settings,
  Shield, ShoppingCart, Star, Target, Users, Zap, Home, Calendar, BookOpen,
  Package, TrendingUp, Sparkles, FileUp, UserCog, LayoutDashboard, LifeBuoy,
  Wallet, BarChart3, ClipboardList, Building2,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Box;
}

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
