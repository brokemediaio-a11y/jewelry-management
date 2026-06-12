"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoneOptionsPanel } from "@/components/stones/stone-options-panel";

export default function StonesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stones</h1>
        <p className="text-muted-foreground">
          Manage stone types, colors, cuts, and clarity options for inventory
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stone Configuration Options</CardTitle>
          <CardDescription>
            Add and edit options used when configuring stones on inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="type">
            <TabsList className="mb-6 flex h-auto flex-wrap gap-1">
              <TabsTrigger value="type">Stone Type</TabsTrigger>
              <TabsTrigger value="color">Stone Color</TabsTrigger>
              <TabsTrigger value="cut">Stone Cut</TabsTrigger>
              <TabsTrigger value="clarity">Stone Clarity</TabsTrigger>
            </TabsList>

            <TabsContent value="type">
              <StoneOptionsPanel
                kind="TYPE"
                title="Stone Type"
                description="Ruby, Emerald, Sapphire, Zircon, Feroza, and more"
              />
            </TabsContent>

            <TabsContent value="color">
              <StoneOptionsPanel
                kind="COLOR"
                title="Stone Color"
                description="Glassy, Gray, Deep Green, and more"
              />
            </TabsContent>

            <TabsContent value="cut">
              <StoneOptionsPanel
                kind="CUT"
                title="Stone Cut"
                description="Hexagonal, Round, Solitaire, Triangle, and more"
              />
            </TabsContent>

            <TabsContent value="clarity">
              <StoneOptionsPanel
                kind="CLARITY"
                title="Stone Clarity"
                description="Black, Full Clear, Hair, Mild, and more"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
