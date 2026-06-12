"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsRates } from "@/components/settings/rates-form";
import { SettingsShopInfo } from "@/components/settings/shop-info-form";
import { SettingsPricing } from "@/components/settings/pricing-form";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Shop information, silver rates, and pricing configuration
        </p>
      </div>

      <Tabs defaultValue="shop" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shop">Shop Information</TabsTrigger>
          <TabsTrigger value="rates">Silver Rate</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-4">
          <SettingsShopInfo />
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <SettingsRates />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <SettingsPricing />
        </TabsContent>
      </Tabs>
    </div>
  );
}
