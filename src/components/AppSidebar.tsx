import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, ShoppingCart, Package, Settings, LogOut, Wand2, Calculator, Sparkles, BookOpen } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "PDV (Caixa)",
        url: "/pdv",
        icon: ShoppingCart,
    },
    {
        title: "Estoque",
        url: "/estoque",
        icon: Package,
    },
    {
        title: "Gerar Imagem",
        url: "/gerar-imagem",
        icon: Wand2,
    },
    {
        title: "Vitrine Digital",
        url: "/vitrine-admin",
        icon: Sparkles,
    },
    {
        title: "Precificação",
        url: "/precificacao",
        icon: Calculator,
    },
    {
        title: "App Mobile",
        url: "/receitas-admin",
        icon: BookOpen,
    },

]

export function AppSidebar() {
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate("/login")
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 px-2 transition-all group-data-[collapsible=icon]:scale-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-white">
                        <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-lg whitespace-nowrap">Hortifruti BP</span>
                </div>
                <div className="hidden h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-white group-data-[collapsible=icon]:flex">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.url}
                                        tooltip={item.title}
                                        size="lg"
                                        className="transition-all hover:translate-x-1"
                                    >
                                        <Link to={item.url}>
                                            <item.icon className="h-5 w-5" />
                                            <span className="font-medium text-base">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            variant="outline"
                            className="justify-center border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                            tooltip="Sair do Sistema"
                        >
                            <LogOut className="h-4 w-4 text-red-500" />
                            <span className="text-red-500 group-data-[collapsible=icon]:hidden">Sair</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
