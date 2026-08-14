"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Search,
  UserPlus,
  Users,
  UserRound,
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
import { getUsers } from "@/lib/data/users";
import { getNonUserPackages } from "@/lib/data/non-user-packages";
import { getPackages } from "@/lib/data/package";
import { useDebounce } from "@/hooks/useDebounce";
import type { Member } from "@/components/ui/members/columns";
import type { Package as PackageType } from "@/components/ui/packages/columns";
import { OpenGymSubscribeDialog } from "@/components/ui/dialogs/open-gym/open-gym-subscribe-dialog";
import { AddNonMemberPackage } from "@/components/ui/dialogs/package/add-non-member-package";

type PendingMember = {
  id: string;
  name: string;
  phone: string;
  email?: string;
};

type NonMemberPackageHit = {
  id: string;
  name: string;
  phone: string;
  packageName: string;
};

type PaletteAction = {
  id: string;
  label: string;
  keywords: string;
  icon: typeof Search;
  run: () => void;
};

export function CommandPalette() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const permissionRole = toPermissionRole(user?.role as string | undefined);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [nonMembers, setNonMembers] = useState<PendingMember[]>([]);
  const [nonMemberPackages, setNonMemberPackages] = useState<
    NonMemberPackageHit[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [addPackageOpen, setAddPackageOpen] = useState(false);
  const [addNonMemberPackageOpen, setAddNonMemberPackageOpen] = useState(false);
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

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const ensurePackages = useCallback(() => {
    if (packages.length > 0) return;
    getPackages()
      .then(setPackages)
      .catch(() => setPackages([]));
  }, [packages.length]);

  const actions = useMemo<PaletteAction[]>(
    () => [
      {
        id: "register-member",
        label: "Register member",
        keywords: "register signup new member create account",
        icon: UserPlus,
        run: () => go("/dashboard/our-members?register=1"),
      },
      {
        id: "open-gym-drop-in",
        label: "Open gym drop-in",
        keywords: "open gym dropin drop-in day pass walk in",
        icon: Dumbbell,
        run: () => go("/dashboard/scans-monitor?action=drop-in"),
      },
      {
        id: "subscribe-open-gym",
        label: "Subscribe to open gym",
        keywords: "subscribe open gym membership package",
        icon: Package,
        run: () => go("/dashboard/scans-monitor?action=subscribe"),
      },
      {
        id: "guest-package",
        label: "Guest package",
        keywords: "guest package visitor day pass",
        icon: Ticket,
        run: () => go("/dashboard/scans-monitor?action=guest"),
      },
      {
        id: "add-package",
        label: "Add package",
        keywords: "add package subscribe member assign package",
        icon: PackagePlus,
        run: () => {
          setOpen(false);
          ensurePackages();
          setAddPackageOpen(true);
        },
      },
      {
        id: "add-package-non-member",
        label: "Add package to non member",
        keywords:
          "add package non member pending guest non-member nonuser assign",
        icon: UserRound,
        run: () => {
          setOpen(false);
          ensurePackages();
          setAddNonMemberPackageOpen(true);
        },
      },
      {
        id: "book-class",
        label: "Book a class",
        keywords: "book class schedule booking reservation",
        icon: CalendarDays,
        run: () => go("/dashboard/schedule"),
      },
      {
        id: "find-members",
        label: "Search members",
        keywords: "find members our members panel search people",
        icon: Users,
        run: () => go("/dashboard/our-members"),
      },
      {
        id: "find-non-members",
        label: "Search non members",
        keywords:
          "find non members pending requests member requests non-member",
        icon: UserRound,
        run: () => go("/dashboard/member-requests"),
      },
    ],
    [ensurePackages, go]
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
      setNonMembers([]);
      setNonMemberPackages([]);
      return;
    }
    ensurePackages();
  }, [open, ensurePackages]);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (!open || term.length < 2) {
      setMembers([]);
      setNonMembers([]);
      setNonMemberPackages([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    Promise.allSettled([
      getMembers(term, 1, 8),
      getUsers(term, 1, 8),
      getNonUserPackages(term, 1, 8),
    ])
      .then(([membersResult, usersResult, packagesResult]) => {
        if (cancelled) return;

        setMembers(
          membersResult.status === "fulfilled" ? membersResult.value.data : []
        );

        if (usersResult.status === "fulfilled") {
          setNonMembers(
            usersResult.value.data.map(
              (user: {
                _id?: string;
                id?: string;
                name: string;
                phoneNumber?: string;
                phone?: string;
                email?: string;
              }) => ({
                id: user._id ?? user.id ?? "",
                name: user.name,
                phone: user.phoneNumber ?? user.phone ?? "",
                email: user.email,
              })
            )
          );
        } else {
          setNonMembers([]);
        }

        if (packagesResult.status === "fulfilled") {
          setNonMemberPackages(
            packagesResult.value.data.map(
              (pkg: {
                _id?: string;
                name: string;
                phoneNumber?: string;
                pkgId?: { name?: string };
              }) => ({
                id: pkg._id ?? `${pkg.name}-${pkg.phoneNumber}`,
                name: pkg.name,
                phone: pkg.phoneNumber ?? "",
                packageName: pkg.pkgId?.name ?? "Package",
              })
            )
          );
        } else {
          setNonMemberPackages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const memberRequestsHref = (term: string) =>
    `/dashboard/member-requests?searchString=${encodeURIComponent(term)}&page=1`;

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
        description="Jump to a page, member, non-member, or front-desk action"
      >
        <CommandInput
          placeholder="Search actions, members, or non-members..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching
              ? "Searching members and non-members..."
              : "No results found."}
          </CommandEmpty>
          <CommandGroup heading="Actions">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <CommandItem
                  key={action.id}
                  value={`${action.label} ${action.keywords}`}
                  onSelect={action.run}
                >
                  <Icon />
                  {action.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
          {members.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Members">
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={`member ${member.name} ${member.phone}`}
                    onSelect={() => go(`/dashboard/our-members/${member.id}`)}
                  >
                    <Users />
                    <span className="truncate">{member.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {member.phone}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {nonMembers.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Non-members">
                {nonMembers.map((person) => (
                  <CommandItem
                    key={person.id || `${person.name}-${person.phone}`}
                    value={`non member pending ${person.name} ${person.phone} ${person.email ?? ""}`}
                    onSelect={() =>
                      go(
                        memberRequestsHref(
                          person.phone || person.name || debouncedQuery.trim()
                        )
                      )
                    }
                  >
                    <UserRound />
                    <span className="truncate">{person.name}</span>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {person.phone}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
          {nonMemberPackages.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Non-member packages">
                {nonMemberPackages.map((pkg) => (
                  <CommandItem
                    key={pkg.id}
                    value={`non member package ${pkg.name} ${pkg.phone} ${pkg.packageName}`}
                    onSelect={() =>
                      go(memberRequestsHref(pkg.phone || pkg.name))
                    }
                  >
                    <Package />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{pkg.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {pkg.packageName}
                      </div>
                    </div>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      {pkg.phone}
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
                  value={`${page.title} ${page.group} page`}
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
      <AddNonMemberPackage
        packages={packages}
        hideTrigger
        open={addNonMemberPackageOpen}
        onOpenChange={setAddNonMemberPackageOpen}
      />
    </>
  );
}
