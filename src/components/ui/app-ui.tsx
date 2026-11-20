"use client";

import {
  Button,
  Loader,
  MantineProvider,
  Skeleton,
  type ButtonProps,
} from "@mantine/core";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function AppUiProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={{
        primaryColor: "indigo",
        defaultRadius: "xl",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        headings: { fontFamily: "Georgia, Times New Roman, serif" },
      }}
    >
      {children}
    </MantineProvider>
  );
}

type UiButtonProps = ButtonProps & ComponentPropsWithoutRef<"button">;

export function UiButton({ children, className, ...props }: UiButtonProps) {
  return (
    <Button className={["ui-button", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Button>
  );
}

export function UiSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <span className="ui-spinner" role="status" aria-label={label}>
      <Loader size="sm" color="indigo" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function PageSkeleton() {
  return (
    <main className="page-loading" role="status" aria-label="Loading page">
      <div className="page-loading-inner">
        <div className="page-loading-header" aria-hidden="true">
          <Skeleton height={44} width={168} radius="md" />
          <div>
            <Skeleton height={16} width={86} radius="xl" />
            <Skeleton height={16} width={116} radius="xl" />
            <Skeleton height={40} width={132} radius="xl" />
          </div>
        </div>
        <div className="page-loading-heading">
          <UiSpinner label="Loading lots" />
          <Skeleton height={42} width="min(520px, 86vw)" radius="md" />
          <Skeleton height={18} width="min(680px, 90vw)" radius="xl" />
          <Skeleton height={18} width="min(460px, 72vw)" radius="xl" />
        </div>
        <div className="page-loading-grid" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <article className="page-loading-card" key={item}>
              <Skeleton className="page-loading-image" height={190} radius="md" />
              <div className="page-loading-card-copy">
                <Skeleton height={14} width="34%" radius="xl" />
                <Skeleton height={24} width="52%" radius="md" />
                <Skeleton height={18} width="78%" radius="xl" />
                <Skeleton height={14} width="92%" radius="xl" />
                <Skeleton height={14} width="66%" radius="xl" />
                <div className="page-loading-actions">
                  <Skeleton height={36} width={82} radius="xl" />
                  <Skeleton height={36} width={82} radius="xl" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
