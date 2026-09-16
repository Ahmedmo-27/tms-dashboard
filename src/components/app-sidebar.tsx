"use client";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { UserInfo } from "./ui/userInfo";
import { pagesMetadata } from "@/lib/config/pages";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";

function itemPath(url: string): string {
  return url.split("?")[0];
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const unreadCount = useAppSelector((state) => state.mail.unreadCount);
  const permissionRole = toPermissionRole(user?.role as string | undefined);

  const visibleGroups = pagesMetadata.navMain
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => permissionRole && item.roles.includes(permissionRole)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const allPaths = visibleGroups.flatMap((group) =>
    group.items.map((item) => itemPath(item.url))
  );

  const isNavActive = (hrefPath: string) => {
    if (pathname === hrefPath) return true;
    if (!pathname.startsWith(`${hrefPath}/`)) return false;
    return !allPaths.some(
      (other) =>
        other !== hrefPath &&
        other.length > hrefPath.length &&
        (pathname === other || pathname.startsWith(`${other}/`))
    );
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserInfo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent data-walkthrough="sidebar-nav">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const hrefPath = itemPath(item.url);
                const isActive = isNavActive(hrefPath);
                const isInboxItem = item.url.includes("/mailing/received") || item.title === "Inbox";

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          {IconComponent && <IconComponent />}
                          <span className="truncate">{item.title}</span>
                        </div>
                        {isInboxItem && unreadCount > 0 && (
                          <span className="ml-auto flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
