"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchUsersForNotification } from "@/lib/data/notifications";
import type { TargetUserItem } from "@/types/notifications";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, User, Check, Smartphone, AlertCircle, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface UserSearchSelectorProps {
  selectedUsers: TargetUserItem[];
  onSelectUser: (user: TargetUserItem) => void;
  onRemoveUser: (userId: string) => void;
  onClearAll: () => void;
}

export function UserSearchSelector({
  selectedUsers,
  onSelectUser,
  onRemoveUser,
  onClearAll,
}: UserSearchSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [results, setResults] = useState<TargetUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!debouncedSearch || debouncedSearch.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const users = await searchUsersForNotification(debouncedSearch);
        if (!isCancelled) {
          setResults(users);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    performSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isUserSelected = (id: string) =>
    selectedUsers.some((u) => u._id === id);

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Search Input Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by member name, phone number, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-9 pr-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!isLoading && searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="text-[11px] font-medium text-muted-foreground px-2 py-1 flex items-center justify-between border-b mb-1">
              <span>Matching Users ({results.length})</span>
              <span className="text-[10px]">Click to add</span>
            </div>
            {results.map((user) => {
              const selected = isUserSelected(user._id);
              return (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      onRemoveUser(user._id);
                    } else {
                      onSelectUser(user);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-md text-left text-sm transition-colors ${
                    selected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">{user.name}</span>
                        {user.role && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.phoneNumber || user.email || "No contact info"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {user.hasFcmToken ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <Smartphone className="h-3.5 w-3.5" /> App Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70" title="User has not registered app push tokens">
                        <AlertCircle className="h-3 w-3" /> No App Token
                      </span>
                    )}

                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isOpen && !isLoading && searchTerm.length >= 2 && results.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border bg-popover p-4 text-center text-sm text-muted-foreground shadow-xl">
            No users found matching &ldquo;{searchTerm}&rdquo;
          </div>
        )}
      </div>

      {/* Selected Users Chips Container */}
      {selectedUsers.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Selected Recipients ({selectedUsers.length})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
            >
              Clear All
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pt-1">
            {selectedUsers.map((user) => (
              <Badge
                key={user._id}
                variant="secondary"
                className="pl-2 pr-1 py-1 text-xs flex items-center gap-1.5 bg-background border shadow-xs"
              >
                <span className="truncate max-w-[150px] font-medium">{user.name}</span>
                {user.hasFcmToken ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="App active" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="No push token" />
                )}
                <button
                  type="button"
                  onClick={() => onRemoveUser(user._id)}
                  className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
