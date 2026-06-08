"use client";

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type VieViewTabsProps = {
  initialView: "kanban" | "table";
  kanban: ReactNode;
  table: ReactNode;
};

// Bascule kanban/tableau côté client (pas d'aller-retour serveur). Les deux vues
// sont rendues côté serveur et passées en children.
export function VieViewTabs({ initialView, kanban, table }: VieViewTabsProps) {
  return (
    <Tabs defaultValue={initialView}>
      <TabsList aria-label="Mode d'affichage">
        <TabsTrigger value="kanban">Kanban</TabsTrigger>
        <TabsTrigger value="table">Tableau</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban">{kanban}</TabsContent>
      <TabsContent value="table">{table}</TabsContent>
    </Tabs>
  );
}
