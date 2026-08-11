"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Search,
  UserPlus,
  Dumbbell,
  Package,
  PackagePlus,
  Ticket,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { pagesMetadata } from "@/lib/config/pages";
import { useAppSelector } from "@/lib/hooks";
import { toPermissionRole } from "@/lib/config/roles";
import { getMembers } from "@/lib/data/member";
import { getPackages } from "@/lib/data/package";
import { useDebounce } from "@/hooks/useDebounce";
import type { Member } from "@/components/ui/members/columns";
import type { Package } from "@/components/ui/packages/columns";
import { OpenGymSubscribeDialog } from "@/components/ui/dialogs/open-gym/open-gym-subscribe-dialog";

export function CommandPalette() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(user?.role as string | undefined);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [addPackageOpen, setAddPackageOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);

  const pages = useMemo(
    () =>
      pagesMetadata.navMain.flatMap((group) =>
        group.items
          .filter(
            (item) => permissionRole && item.roles.includes(permissionRole)
          )
          .map((item) => ({ ...item, group: group.title }))
      ),
    [permissionRole]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setMembers([]);
      return;
    }
    if (packages.length === 0) {
      getPackages()
        .then(setPackages)
        .catch(() => setPackages([]));
    }
  }, [open, packages.length]);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!open || term.length < 2) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    setSearching(true);
    getMembers(term, 1, 8)
      .then((response) => {
        if (!cancelled) setMembers(response.data);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-9 w-9 shrink-0 justify-center gap-2 px-0 text-muted-foreground sm:h-9 sm:w-[220px] sm:justify-start sm:px-3"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 truncate text-left text-sm sm:inline">
          Search...
        </span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          {isMac ? "⌘K" : "Ctrl+K"}
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Jump to a page, member, or front-desk action"
      >
        <CommandInput
          placeholder="Search members, pages, or actions..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? "Searching members..." : "No results found."}
          </CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go("/dashboard/our-members?register=1")}>
              <UserPlus />
              Register member
            </CommandItem>
            <CommandItem
              onSelect={() => go("/dashboard/scans-monitor?action=drop-in")}
            >
              <Dumbbell />
              Open gym drop-in
            </CommandItem>
            <CommandItem
              onSelect={() => go("/dashboard/scans-monitor?action=subscribe")}
            >
              <Package />
              Subscribe to open gym
            </CommandItem>
            <CommandItem
              onSelect={() => go("/dashboard/scans-monitor?action=guest")}
            >
              <Ticket />
              Guest package
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setOpen(false);
                if (packages.length === 0) {
                  getPackages()
                    .then(setPackages)
                    .catch(() => setPackages([]));
                }
                setAddPackageOpen(true);
              }}
            >
              <PackagePlus />
              Add package
            </CommandItem>
            <CommandItem onSelect={() => go("/dashboard/schedule")}>
              <CalendarDays />
              Book a class
            </CommandItem>
          </CommandGroup>
          {members.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Members">
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={`${member.name} ${member.phone}`}
                    onSelect={() => go(`/dashboard/our-members/${member.id}`)}
                  >
                    <span className="truncate">{member.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {member.phone}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          <CommandSeparator />
          <CommandGroup heading="Pages">
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.url}
                  value={`${page.title} ${page.group}`}
                  onSelect={() => go(page.url)}
                >
                  {Icon && <Icon />}
                  {page.title}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <OpenGymSubscribeDialog
        packages={packages}
        hideTrigger
        mode="all"
        open={addPackageOpen}
        onOpenChange={setAddPackageOpen}
      />
    </>
  );
}
