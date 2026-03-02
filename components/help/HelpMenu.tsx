"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/constants";

type HelpStep = {
  title: string;
  description: string;
  image?: string;
};

type HelpFeature = {
  name: string;
  roles?: string[];
  steps: HelpStep[];
};

type HelpRoute = {
  route: string;
  roles?: string[];
  features: HelpFeature[];
};

type HelpData = HelpRoute[];

const normalizeRoute = (value: string) => value.replace(/\/+$/, "") || "/";

const splitRouteSegments = (value: string) =>
  normalizeRoute(value).split("/").filter(Boolean);

const isDynamicSegment = (segment: string) =>
  segment.startsWith("[") && segment.endsWith("]");

const isPrefixRouteMatch = (routePattern: string, pathname: string) => {
  const routeSegments = splitRouteSegments(routePattern);
  const pathSegments = splitRouteSegments(pathname);

  if (routeSegments.length === 0) return pathSegments.length === 0;
  if (routeSegments.length > pathSegments.length) return false;

  return routeSegments.every((segment, index) => {
    if (isDynamicSegment(segment)) return true;
    return segment === pathSegments[index];
  });
};

const pickRouteMatch = (routes: HelpRoute[], pathname: string) => {
  const matches = routes
    .filter((item) => isPrefixRouteMatch(item.route, pathname))
    .sort((a, b) => {
      const segmentDiff =
        splitRouteSegments(b.route).length - splitRouteSegments(a.route).length;
      if (segmentDiff !== 0) return segmentDiff;
      return normalizeRoute(b.route).length - normalizeRoute(a.route).length;
    });

  return matches[0] ?? null;
};

type HelpMenuProps = {
  role?: Role;
};

export function HelpMenu({ role }: HelpMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<HelpData>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/instructions.yaml", { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal memuat bantuan.");
        const text = await res.text();
        const { parse } = await import("yaml");
        const parsed = parse(text) as HelpData;
        if (active) setData(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        if (active) {
          setData([]);
          setLoadError(
            error instanceof Error ? error.message : "Gagal memuat bantuan.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const activeRoute = useMemo(
    () => pickRouteMatch(data, pathname),
    [data, pathname],
  );

  const roleFilteredRoute = useMemo(() => {
    if (!activeRoute) return null;
    if (!activeRoute.roles || activeRoute.roles.length === 0) return activeRoute;
    if (!role) return null;
    return activeRoute.roles.includes(role) ? activeRoute : null;
  }, [activeRoute, role]);

  const roleFilteredFeatures = useMemo(() => {
    if (!roleFilteredRoute) return [];
    return roleFilteredRoute.features.filter((feature) => {
      if (!feature.roles || feature.roles.length === 0) return true;
      if (!role) return false;
      return feature.roles.includes(role);
    });
  }, [roleFilteredRoute, role]);

  useEffect(() => {
    if (!roleFilteredRoute || roleFilteredFeatures.length === 0) {
      setSelectedFeature("");
      return;
    }
    const first = roleFilteredFeatures[0]?.name ?? "";
    setSelectedFeature((prev) => {
      if (!prev) return first;
      return roleFilteredFeatures.some((feature) => feature.name === prev)
        ? prev
        : first;
    });
  }, [roleFilteredFeatures, roleFilteredRoute]);

  const visibleFeature = useMemo(() => {
    if (!roleFilteredRoute) return null;
    if (roleFilteredFeatures.length === 0) return null;
    if (!selectedFeature) return roleFilteredFeatures[0] ?? null;
    return (
      roleFilteredFeatures.find((f) => f.name === selectedFeature) ??
      roleFilteredFeatures[0] ??
      null
    );
  }, [roleFilteredFeatures, roleFilteredRoute, selectedFeature]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Bantuan"
      >
        <CircleHelp className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bantuan Fitur</DialogTitle>
            <DialogDescription>
              {roleFilteredRoute
                ? `Panduan untuk ${roleFilteredRoute.route}`
                : "Panduan fitur umum aplikasi"}
            </DialogDescription>
          </DialogHeader>

          {isLoading && (
            <p className="text-sm text-muted-foreground">Memuat bantuan...</p>
          )}
          {!isLoading && loadError && (
            <p className="text-sm text-destructive">{loadError}</p>
          )}
          {!isLoading && !loadError && !roleFilteredRoute && (
            <p className="text-sm text-muted-foreground">
              Belum ada panduan untuk halaman ini.
            </p>
          )}

          {!isLoading && !loadError && roleFilteredRoute && (
            <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex flex-col gap-2">
                {roleFilteredFeatures.map((feature) => (
                  <button
                    key={feature.name}
                    type="button"
                    onClick={() => setSelectedFeature(feature.name)}
                    className={cn(
                      "text-left px-3 py-2 rounded-md border text-sm transition-colors",
                      selectedFeature === feature.name
                        ? "bg-primary/10 border-primary text-primary"
                        : "hover:bg-muted/40",
                    )}
                  >
                    {feature.name}
                  </button>
                ))}
                {roleFilteredFeatures.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1">
                    Belum ada panduan untuk role ini.
                  </p>
                )}
              </div>
              <div className="space-y-3">
                {visibleFeature ? (
                  <>
                    <h3 className="text-base font-semibold">
                      {visibleFeature.name}
                    </h3>
                    <div className="space-y-3">
                      {visibleFeature.steps.map((step, idx) => (
                        <div
                          key={`${visibleFeature.name}-${idx}`}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">
                                {step.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {step.description}
                              </p>
                              {step.image && (
                                <div className="pt-2">
                                  <img
                                    src={step.image}
                                    alt={step.title}
                                    className={cn(
                                      "max-h-48 w-full rounded-md border object-cover",
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Belum ada fitur untuk halaman ini.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
