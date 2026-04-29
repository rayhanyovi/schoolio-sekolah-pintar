"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const items = (count: number) => Array.from({ length: count }, (_, index) => index);

export function StatCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items(count).map((index) => (
        <Card key={index} className="overflow-hidden border-border/80 bg-card shadow-sm shadow-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ToolbarSkeleton({
  withSearch = true,
  controls = 2,
  withButton = false,
  className,
}: {
  withSearch?: boolean;
  controls?: number;
  withButton?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {withSearch ? <Skeleton className="h-11 w-full max-w-md rounded-2xl" /> : null}
        {items(controls).map((index) => (
          <Skeleton key={index} className="h-11 w-full rounded-2xl sm:w-40" />
        ))}
      </div>
      {withButton ? <Skeleton className="h-11 w-full rounded-xl sm:w-40" /> : null}
    </div>
  );
}

export function TabsSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/70 p-1", className)}>
      {items(count).map((index) => (
        <Skeleton key={index} className="h-9 w-28 rounded-xl" />
      ))}
    </div>
  );
}

export function UserCardsSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {items(count).map((index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-44" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ContentCardsSkeleton({
  count = 6,
  className,
  compact = false,
}: {
  count?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {items(count).map((index) => (
        <Card key={index}>
          <CardHeader className={cn("space-y-3", compact && "pb-3")}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-center justify-between gap-3 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ThreadCardsSkeleton({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {items(count).map((index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function AssignmentCardsSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {items(count).map((index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ScheduleCardsSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {items(count).map((index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartCardSkeleton({
  className,
  height = 320,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded-[1.5rem]" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function CalendarSkeleton({
  className,
  showSidebar = false,
}: {
  className?: string;
  showSidebar?: boolean;
}) {
  const calendar = (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {items(7).map((index) => (
            <Skeleton key={index} className="h-4 w-full rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {items(35).map((index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (!showSidebar) return calendar;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">{calendar}</div>
      <div className="space-y-6">
        <ChartCardSkeleton height={220} />
        <ContentCardsSkeleton count={3} className="grid-cols-1" compact />
      </div>
    </div>
  );
}

export function TableCardSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-3">
        {items(rows).map((index) => (
          <div key={index} className="grid grid-cols-[1.2fr_1fr_0.8fr] gap-3 rounded-xl border border-border/60 p-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AttendanceWeekSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {items(6).map((index) => (
        <div key={index} className="rounded-[1.25rem] border border-border/70 bg-muted/45 p-4 text-center">
          <Skeleton className="mx-auto h-4 w-10" />
          <Skeleton className="mx-auto mt-3 h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="h-10 w-52" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-10 w-36 rounded-full" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-7 w-52" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {items(6).map((index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
