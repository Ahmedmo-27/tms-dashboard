import { Skeleton } from "../skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "../card";

export function CoachTodaySkeleton() {
  return (
    <div className="space-y-4">
      {/* Next session card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            <Skeleton className="h-5 w-28 rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-52 rounded" />
              <Skeleton className="h-3 w-28 rounded mt-1" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Today's classes card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-32 rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
              </div>
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2-Column Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Scans Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-20 rounded" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
            <Skeleton className="h-8 w-36 rounded-md" />
          </CardContent>
        </Card>

        {/* PT Clients Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CoachScansSkeleton() {
  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 border-b pb-3">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>

      {/* Class scan cards */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-36 rounded" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[180px] rounded-md border m-2 p-2 divide-y divide-border/40 overflow-hidden">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CoachClientsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search */}
      <Skeleton className="h-10 w-full rounded-md" />

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Client List */}
      <div className="divide-y overflow-hidden rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-stretch justify-between p-4 gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachClientDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Back to clients button */}
      <Skeleton className="h-8 w-32 rounded-md mb-2 -ml-2" />

      {/* Member summary card */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </CardContent>
      </Card>

      {/* Packages section */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24 rounded" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CoachScheduleSkeleton() {
  return (
    <div className="space-y-4">
      {/* Week nav header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-6 w-36 sm:w-48 rounded" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* 7-column desktop grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 space-y-3 min-h-[300px]">
            <div className="border-b pb-2 text-center space-y-1">
              <Skeleton className="h-3 w-10 mx-auto rounded" />
              <Skeleton className="h-4 w-6 mx-auto rounded" />
            </div>
            <div className="space-y-2">
              <div className="rounded-lg border p-2 space-y-1.5 bg-muted/20">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CoachTicketsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header and create button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-12 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      {/* Search and refresh */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-10 flex-1 max-w-sm rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Tickets table */}
      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="divide-y divide-border/40">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CoachSettingsSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Skeleton className="h-5 w-20 rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <Skeleton className="h-5 w-36 rounded" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}
