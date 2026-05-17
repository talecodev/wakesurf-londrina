import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Calendar, LogOut, Trophy, Home } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import logoDark from "@/assets/logo-wordmark.png";

type Variant = "admin" | "rider";

const NAV = {
  admin: [
    { title: "Visão geral", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Calendário", url: "/admin/calendar", icon: Calendar },
  ],
  rider: [
    { title: "Meu progresso", url: "/rider/dashboard", icon: Trophy },
  ],
};

interface Props {
  variant: Variant;
  onLogout: () => void;
}

export function AppSidebar({ variant, onLogout }: Props) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const collapsed = state === "collapsed";
  const items = NAV[variant];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <div className="h-8 w-8 rounded-md bg-background flex items-center justify-center overflow-hidden shrink-0">
            <img src={logoDark} alt="Wakesurf" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs font-bold text-sidebar-foreground tracking-wide leading-none">
                WAKESURF
              </span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Londrina
              </span>
            </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2">
              {variant === "admin" ? "Administração" : "Área do rider"}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-2.5 rounded-md text-sm transition-colors ${
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Ir para o site">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              >
                <Home className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Site público</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Sair">
              <button
                onClick={onLogout}
                className="flex items-center gap-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:bg-destructive/15 hover:text-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sair</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}