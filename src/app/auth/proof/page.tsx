import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRuntimeCapabilities } from "@/lib/runtime/capabilities";

export const dynamic = "force-dynamic";

async function getJudgesProof() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.CALMA_AGENT_URI_BASE?.replace(/\/api$/, "") ||
    "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/proof/judges`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load judges proof");
  }

  return response.json();
}

function txLink(hash?: string, href?: string) {
  if (!hash || !href) return "Unavailable";
  return (
    <Link href={href} className="text-primary underline underline-offset-4" target="_blank">
      {hash.slice(0, 10)}...{hash.slice(-8)}
    </Link>
  );
}

export default async function JudgesModePage() {
  const payload = await getJudgesProof();
  const runtime = await getRuntimeCapabilities();
  const proof = payload.judgesMode;

  return (
    <main className="grain mx-auto min-h-screen max-w-7xl px-4 py-8">
      <div className="space-y-6">
        <section className="space-y-3">
          <Badge>Calma Judges Mode</Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Dual Flow lanes with guardian autopilot proof.
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Flow is the only value rail. Direct Flow actions, agent-assisted Flow actions, and
            guardian autopilot all resolve into one proof surface with Zama, Vincent, Lit, and
            ERC-8004 evidence attached where applicable.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Lane A</p>
            <h2 className="mt-2 text-2xl font-semibold">Direct Flow</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {proof.directFlowEvidence.length} receipts. No Vincent, Zama, or ERC-8004 dependency
              required to move FLOW.
            </p>
            <div className="mt-4 space-y-3">
              {proof.directFlowEvidence.slice(0, 3).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-border/70 p-3 text-sm">
                  <p className="font-medium text-foreground">{item.action}</p>
                  <p className="mt-1 text-muted-foreground">{txLink(item.flowTxHash, item.flowExplorerUrl)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Lane B</p>
            <h2 className="mt-2 text-2xl font-semibold">Agent-Assisted Flow</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {proof.agentAssistedEvidence.length} receipts with Zama evaluation, Vincent context,
              and ERC-8004 trust evidence.
            </p>
            <div className="mt-4 space-y-3">
              {proof.agentAssistedEvidence.slice(0, 3).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-border/70 p-3 text-sm">
                  <p className="font-medium text-foreground">{item.action}</p>
                  <p className="mt-1 text-muted-foreground">Flow: {txLink(item.flowTxHash, item.flowExplorerUrl)}</p>
                  <p className="mt-1 text-muted-foreground">Zama: {item.zamaTxHash || "Unavailable"}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Autopilot</p>
            <h2 className="mt-2 text-2xl font-semibold">Guardian Only</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Teen autonomy is disabled. Guardian autopilot uses
              {" "}
              {runtime.autopilot?.schedulerBackend || payload.runtime.autopilot.schedulerBackend}
              {" "}
              scheduling and stays inside confidential policy bounds.
            </p>
            <div className="mt-4 space-y-3">
              {proof.guardianAutopilotEvidence.records.slice(0, 3).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-border/70 p-3 text-sm">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-muted-foreground">{item.schedulerBackend}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Policy Control Plane</p>
            <h2 className="mt-2 text-2xl font-semibold">Zama</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Policy mode: <span className="font-medium text-foreground">{proof.zama.policyMode}</span>
            </p>
            <div className="mt-4 space-y-3">
              {proof.zama.evaluations.slice(0, 4).map((item: any) => (
                <div key={item.id} className="rounded-2xl border border-border/70 p-3 text-sm">
                  <p className="font-medium text-foreground">{item.policyMode}</p>
                  <p className="mt-1 text-muted-foreground">{item.zamaTxHash || "No live tx hash"}</p>
                  <p className="mt-1 text-muted-foreground">{item.teenView}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Trust Layer</p>
            <h2 className="mt-2 text-2xl font-semibold">Vincent, Lit, ERC-8004</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>Vincent app: {proof.vincent.appId || "Unavailable"} ({proof.vincent.appVersion || "n/a"})</p>
              <p>Lit executor CID: {payload.runtime.lit.safeExecutorCid || "Unavailable"}</p>
              <p>
                Agent manifest:
                {" "}
                <Link href={proof.erc8004.manifestUrl} target="_blank" className="text-primary underline underline-offset-4">
                  /api/agent.json
                </Link>
              </p>
              <p>
                Agent log:
                {" "}
                <Link href={proof.erc8004.logUrl} target="_blank" className="text-primary underline underline-offset-4">
                  /api/agent_log.json
                </Link>
              </p>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}
