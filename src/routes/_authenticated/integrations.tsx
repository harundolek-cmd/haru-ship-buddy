import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/tms/ui";
export const Route = createFileRoute("/_authenticated/integrations")({ component: Integrations });
const items: [string, string, string, string][] = [
  [
    "ELD / GPS",
    "Samsara, Motive",
    "Automatic truck positions and driver hours",
    "Requires a server-side connector, provider credentials, webhook verification and vehicle mapping.",
  ],
  [
    "Load boards",
    "DAT, Truckstop",
    "Load posting, market rates and carrier capacity",
    "Requires a provider agreement and approved API access.",
  ],
  [
    "Accounting",
    "QuickBooks, Xero",
    "Invoice and payment reconciliation",
    "Requires OAuth, account mapping and idempotent synchronization. CSV exports are available now.",
  ],
  [
    "Carrier verification",
    "RMIS, Highway, SAFER",
    "Authority, insurance and onboarding",
    "Requires an authorized data source. Saved MC/DOT numbers are not verification.",
  ],
  [
    "Email / SMS",
    "Provider to be selected",
    "Dispatch messages and appointment updates",
    "Requires verified sender setup and delivery handling. No automatic messages are sent.",
  ],
  [
    "EDI & customer portal",
    "Trading partner setup",
    "Tender acceptance, shipment events and secure customer access",
    "Requires partner-specific mappings and a separate customer authorization model.",
  ],
  [
    "Fuel / IFTA",
    "Fuel card and mileage provider",
    "Jurisdiction mileage and fuel reconciliation",
    "Requires validated mileage and fuel data; no tax returns are calculated or filed.",
  ],
];
function Integrations() {
  return (
    <>
      <PageHeader
        title="Integration Readiness"
        subtitle="External services that need separate provider setup. These integrations are not connected yet."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map(([name, providers, benefit, requirement]) => (
          <Panel
            key={name}
            title={name}
            right={<span className="text-xs text-muted-foreground">Not connected</span>}
          >
            <div className="space-y-3 p-5">
              <p className="font-semibold">{providers}</p>
              <p className="text-sm">{benefit}</p>
              <p className="text-sm text-muted-foreground">{requirement}</p>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
