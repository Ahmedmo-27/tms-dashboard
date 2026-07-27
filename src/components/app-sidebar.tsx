"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { UserInfo } from "./ui/userInfo";
import { pagesMetadata } from "@/lib/config/pages";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(user?.role as string | undefined);

  const visibleGroups = pagesMetadata.navMain
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => permissionRole && item.roles.includes(permissionRole)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserInfo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {visibleGroups.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => { 
                      const IconComponent = item.icon;
                      return(
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.url === pathname}>
                          <a href={item.url}>{IconComponent && <IconComponent />}{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )})}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

