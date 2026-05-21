import { Zap, Banknote, Building2, Inbox, Wallet, Rocket } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { title: "My Wallet", url: "/wallet", icon: Wallet },
  { title: "Fiat Tokens", url: "/fiat-tokens", icon: Banknote },
  { title: "Asset Tokens", url: "/asset-tokens", icon: Building2 },
  { title: "Requests", url: "/requests", icon: Inbox },
  { title: "Launch Token", url: "/launch", icon: Rocket },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="h-14 px-4 flex items-center border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gradient-primary truncate">Ping Admin</h1>
              <p className="text-xs text-muted-foreground truncate">Asset & Fiat Console</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        className={`w-full ${
                          isActive(item.url)
                            ? "bg-sidebar-accent text-primary"
                            : "hover:bg-sidebar-accent/50"
                        }`}
                      >
                        <NavLink
                          to={item.url}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                          activeClassName="bg-sidebar-accent text-primary font-medium"
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
