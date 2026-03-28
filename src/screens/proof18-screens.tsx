"use client";

import { useMemo, useState } from "react";
import { Bell, BookHeart, Coins, CreditCard, Landmark, MessageCircleMore, PiggyBank, ShieldCheck, Sparkles, Wallet } from "lucide-react";

import { ClawrencePromptBox } from "@/components/ui/clawrence-prompt-box";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MomentumMetricsBlock } from "@/components/ui/momentum-metrics-block";
import { TransactionSigningCard } from "@/components/ui/transaction-signing-card";
import { TrustOrbitCard } from "@/components/ui/trust-orbit-card";
import {
  ActionSummaryCard,
  ApprovalRequestCard,
  ClawrenceMessageBubble,
  EmptyState,
  ExplanationCard,
  LoadingState,
  NotificationList,
  PassportBadgeCard,
  PolicyStatusChip,
  ResultPanel,
  TopNavigation,
  TransactionHistoryRow,
  WalletBalanceCard,
  GoalProgressCard,
} from "@/components/shared/proof18-components";
import { useProof18Flows } from "@/flows/use-proof18-flows";
import { useProof18Store } from "@/state/proof18-store";
import { Screen } from "@/types/proof18";
import {
  ConfidentialPolicyResult,
  EvidenceReferenceSurface,
  GuardianAuthoritySurface,
  PausedAccountSurface,
  SigningRequestModalSurface,
  TransactionStateSurface,
  WalletAccountStatus,
} from "@/web3/surfaces";

export function ScreenRouter({ screen }: { screen: Screen }) {
  switch (screen) {
    case "home":
      return <TeenHomeScreen />;
    case "wallet":
      return <TeenWalletScreen />;
    case "goals":
      return <TeenSavingsGoalsScreen />;
    case "request":
      return <TeenRequestActionScreen />;
    case "subscriptions":
      return <TeenSubscriptionsScreen />;
    case "passport":
      return <TeenPassportScreen />;
    case "history":
      return <SharedHistoryScreen />;
    case "chat":
      return <ClawrenceChatScreen />;
    case "family-setup":
      return <ParentFamilySetupScreen />;
    case "teen-wallet-setup":
      return <ParentTeenWalletSetupScreen />;
    case "treasury":
      return <ParentTreasuryScreen />;
    case "rules":
      return <ParentRulesScreen />;
    case "approvals":
      return <ParentApprovalsScreen />;
    case "teen-progress":
      return <ParentTeenProgressScreen />;
    case "history-audit":
      return <ParentHistoryAuditScreen />;
    case "action-details":
      return <SharedActionDetailsScreen />;
    case "execution-result":
      return <SharedExecutionResultScreen />;
    case "notifications":
      return <SharedNotificationsScreen />;
    case "profile-settings":
      return <SharedProfileSettingsScreen />;
    default:
      return <TeenHomeScreen />;
  }
}

function TeenHomeScreen() {
  const { wallet, goals, passport, history, subscriptions, treasuryFunded } = useProof18Store();
  const { runSavingsFlow, runSubscriptionFlow } = useProof18Flows();
  const goal = goals[0];

  return (
    <div className="space-y-4">
      <TopNavigation
        title="Teen Home"
        subtitle="quick financial picture"
        actions={
          <div className="flex flex-wrap gap-2">
            <WalletAccountStatus connected={wallet.connected} guardianReady={wallet.guardianReady} />
          </div>
        }
      />

      {!treasuryFunded ? (
        <EmptyState
          title="No treasury funded yet"
          body="The teen dashboard is ready, but household funds still need to land before allowance and requests can move."
        />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <WalletBalanceCard balance={wallet.spendableBalance} allowance={wallet.nextAllowance} />
          <PassportBadgeCard score={passport.score} level={passport.level} streak={passport.streak} />
          {goal ? (
            <GoalProgressCard
              name={goal.name}
              saved={goal.saved}
              target={goal.target}
              onAdd={() => runSavingsFlow(goal.id)}
            />
          ) : (
            <EmptyState title="No goals yet" body="Start a goal to turn allowance into momentum." />
          )}
          <ActionSummaryCard
            title="Quick actions"
            amount="4 actions"
            body="Save money, ask Clawrence, request a subscription, or request a payment without leaving the home screen."
          />
        </div>

        <div className="space-y-4">
          <TrustOrbitCard />
          <div className="grid gap-4 md:grid-cols-2">
            <ExplanationCard title="Recent actions" body={`${history.slice(0, 2).length} recent actions sit in your trail.`} tone="neutral" />
            <ExplanationCard title="Current level" body={`Passport level is ${passport.level}. Next unlock target is ${passport.nextUnlockTarget}.`} tone="good" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionButton icon={PiggyBank} label="Save money" onClick={() => goal && runSavingsFlow(goal.id)} />
            <ActionButton icon={MessageCircleMore} label="Ask Clawrence" />
            <ActionButton icon={CreditCard} label="Request subscription" onClick={() => runSubscriptionFlow()} />
            <ActionButton icon={Coins} label="Request payment" />
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-card/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">subscriptions snapshot</p>
            <p className="mt-2 text-sm text-foreground">
              {subscriptions.filter((sub) => sub.status === "active").length} active, {subscriptions.filter((sub) => sub.status === "approval-pending").length} awaiting approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeenWalletScreen() {
  const { wallet } = useProof18Store();

  return (
    <div className="space-y-4">
      <TopNavigation title="Wallet / Balance" subtitle="household-aware wallet view" />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          <WalletBalanceCard balance={wallet.spendableBalance} allowance={wallet.nextAllowance} label="spendable balance" />
          <WalletBalanceCard balance={wallet.savingsBalance} allowance="Goal vault synced" label="savings balance" />
          <ActionSummaryCard title="Guardian authority state" amount={wallet.guardianReady ? "Live" : "Missing"} body="Household authority stays hidden under the surface, but this card tells you whether approvals can sign." />
          <ActionSummaryCard title="Paused account state" amount={wallet.paused ? "Paused" : "Active"} body="If the parent hits emergency pause, actions stay visible but cannot move." />
        </div>
        <div className="space-y-4">
          <GuardianAuthoritySurface ready={wallet.guardianReady} />
          <PausedAccountSurface paused={wallet.paused} />
          <SigningRequestModalSurface active={false} />
          <TransactionStateSurface pending={false} confirmed={false} />
        </div>
      </div>
    </div>
  );
}

function TeenSavingsGoalsScreen() {
  const { goals, loadingAction } = useProof18Store();
  const { runSavingsFlow } = useProof18Flows();

  return (
    <div className="space-y-4">
      <TopNavigation title="Savings Goals" subtitle="goal cards, progress, and contribution history" />
      {goals.length === 0 ? (
        <EmptyState title="No goals yet" body="Add the first savings goal to unlock vault progress and Passport momentum." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                name={goal.name}
                saved={goal.saved}
                target={goal.target}
                onAdd={() => runSavingsFlow(goal.id)}
                loading={loadingAction === `goal-${goal.id}`}
              />
            ))}
          </div>
          <div className="space-y-4">
            {loadingAction?.startsWith("goal-") ? <LoadingState label="Saving toward the selected goal..." /> : null}
            {goals[0]?.history.map((entry, index) => (
              <ActionSummaryCard
                key={`${entry.label}-${index}`}
                title={entry.label}
                amount={`$${entry.amount.toFixed(2)}`}
                body={`Logged ${entry.time}. This history helps explain how the goal moved.`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeenRequestActionScreen() {
  const { policyPreview, wallet } = useProof18Store();
  const [amount, setAmount] = useState("14.99");
  const [merchant, setMerchant] = useState("FocusFlow Premium");
  const [category, setCategory] = useState("education");

  return (
    <div className="space-y-4">
      <TopNavigation title="Request Action" subtitle="amount, category, merchant, and policy preview" />
      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-4">
          <FormCard>
            <div className="grid gap-4">
              <Field label="Amount">
                <Input value={amount} onChange={(event) => setAmount(event.target.value)} />
              </Field>
              <Field label="Category">
                <Input value={category} onChange={(event) => setCategory(event.target.value)} />
              </Field>
              <Field label="Merchant / app">
                <Input value={merchant} onChange={(event) => setMerchant(event.target.value)} />
              </Field>
              <Field label="Recurring">
                <div className="rounded-[1.2rem] border border-border bg-white/70 px-4 py-3 text-sm text-foreground">Monthly toggle is on for this preview.</div>
              </Field>
            </div>
          </FormCard>
          <ActionSummaryCard
            title="Clawrence explanation"
            amount="$14.99 / mo"
            body="This request repeats each month, touches the education category, and sits above the current auto-renew band."
          />
        </div>
        <div className="space-y-4">
          <ConfidentialPolicyResult policy={policyPreview} />
          <TransactionSigningCard amount={Number(amount)} title={merchant} policy={policyPreview} disabled={!wallet.guardianReady && policyPreview === "red"} />
          <div className="grid gap-4 md:grid-cols-2">
            <ExplanationCard title="Green" body="Moves immediately. Best for savings transfers and small spending inside limits." tone="good" />
            <ExplanationCard title="Yellow" body="Allowed, but guardian still gets a soft notification." tone="warning" />
            <ExplanationCard title="Red" body="Needs a guardian approval before money can move." tone="bad" />
            <ExplanationCard title="Blocked" body="Category or household state prevents execution right now." tone="neutral" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeenSubscriptionsScreen() {
  const { subscriptions } = useProof18Store();
  const active = subscriptions.filter((item) => item.status === "active");
  const requested = subscriptions.filter((item) => item.status !== "active");
  const monthly = active.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-4">
      <TopNavigation title="Subscriptions" subtitle="requested, active, renewal labels, and monthly cost" />
      <div className="grid gap-4 md:grid-cols-3">
        <ActionSummaryCard title="Monthly summary" amount={`$${monthly.toFixed(2)}`} body="Active recurring commitments currently inside the household rhythm." />
        <ActionSummaryCard title="Active subscriptions" amount={String(active.length)} body="Recurring services already approved and funded." />
        <ActionSummaryCard title="Approval status" amount={String(requested.length)} body="Requests still awaiting a decision or denied." />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <SubscriptionColumn title="Requested subscriptions" items={requested} empty="No pending or denied subscriptions yet." />
        <SubscriptionColumn title="Active subscriptions" items={active} empty="No active subscriptions yet." />
      </div>
    </div>
  );
}

function TeenPassportScreen() {
  const { passport } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Passport" subtitle="score, level, streak, unlocks, and score change log" />
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <PassportBadgeCard score={passport.score} level={passport.level} streak={passport.streak} />
          <ActionSummaryCard title="Next unlock target" amount={String(passport.nextUnlockTarget)} body="Reaching the next trust threshold opens wider action bands without exposing the confidential rule values." />
          <ActionSummaryCard title="Unlocked permissions" amount={String(passport.unlockedPermissions.length)} body={passport.unlockedPermissions.join(" · ")} />
        </div>
        <div className="space-y-4">
          {passport.log.map((entry, index) => (
            <ExplanationCard key={`${entry.label}-${index}`} title={`${entry.label} (+${entry.delta})`} body={`Logged ${entry.time}.`} tone="good" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SharedHistoryScreen() {
  const { history } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="History" subtitle="actions, status, amount, date, and evidence trail" />
      <div className="space-y-3">
        {history.map((item) => (
          <TransactionHistoryRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ClawrenceChatScreen() {
  const { lastResult } = useProof18Store();
  const [messages, setMessages] = useState([
    { role: "assistant" as const, body: "Ask me what an action costs, whether it repeats, or whether it needs a parent signature." },
    { role: "user" as const, body: "Can I move some allowance into savings?" },
    { role: "assistant" as const, body: "Yes. That action sits in the safe band, so it can execute immediately and should help your Passport." },
  ]);

  return (
    <div className="space-y-4">
      <TopNavigation title="Clawrence Chat" subtitle="natural language guidance with action explanation cards" />
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3 rounded-[2rem] border border-border/70 bg-white/55 p-4">
          {messages.map((message, index) => (
            <ClawrenceMessageBubble key={`${message.role}-${index}`} role={message.role}>
              {message.body}
            </ClawrenceMessageBubble>
          ))}
        </div>
        <div className="space-y-4">
          <ClawrencePromptBox
            onSend={(message) =>
              setMessages((current) => [
                ...current,
                { role: "user", body: message },
                {
                  role: "assistant",
                  body: "Clawrence understood the request, checked the household rule band, and prepared the next safest move.",
                },
              ])
            }
          />
          <ExplanationCard title="Suggested prompt" body="“If I subscribe to this, what changes next month?”" />
          <ExplanationCard title="Needs parent approval" body="Recurring requests above the household cap automatically generate a parent queue entry." tone="warning" />
          <ExplanationCard title="Done card" body="Successful actions explain what changed in balance, goals, and Passport." tone="good" />
          <ExplanationCard title="Why blocked" body="Blocked actions tell the teen what category or account state caused the stop, without exposing confidential thresholds." tone="bad" />
          {lastResult ? <ResultPanel tone={lastResult.tone} title={lastResult.title} body={lastResult.body} /> : null}
        </div>
      </div>
    </div>
  );
}

function ParentFamilySetupScreen() {
  const { familyCreated, teenAdded, guardianWalletConnected, treasuryFunded } = useProof18Store();
  const { runParentSetupFlow } = useProof18Flows();

  return (
    <div className="space-y-4">
      <TopNavigation
        title="Family Setup"
        subtitle="create family, add teen, connect guardian wallet, fund treasury"
        actions={<ActionButton icon={Landmark} label="Run MVP setup flow" onClick={runParentSetupFlow} />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <SetupCard title="Create family" done={familyCreated} body="Create the family shell that all approvals, balances, and evidence routes sit inside." />
        <SetupCard title="Add teen" done={teenAdded} body="Attach the teen profile and governed wallet surface." />
        <SetupCard title="Connect guardian wallet" done={guardianWalletConnected} body="Guardian becomes the legal and signing authority." />
        <SetupCard title="Fund treasury" done={treasuryFunded} body="Without treasury capital, the teen dashboard remains informative but inactive." />
      </div>
    </div>
  );
}

function ParentTeenWalletSetupScreen() {
  const { wallet } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Teen Wallet Setup" subtitle="wallet creation, guardian connection, authority binding" />
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <WalletBalanceCard balance={wallet.treasuryBalance} allowance="Guardian linked treasury" label="family treasury" />
        <div className="space-y-4">
          <GuardianAuthoritySurface ready={wallet.guardianReady} />
          <WalletAccountStatus connected={wallet.connected} guardianReady={wallet.guardianReady} />
          <ExplanationCard title="Wallet not connected / not ready" body="This state is fully designed. The teen can still see why the account is inactive before signing exists." tone={wallet.connected ? "good" : "warning"} />
        </div>
      </div>
    </div>
  );
}

function ParentTreasuryScreen() {
  const { wallet, history } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Treasury" subtitle="family balance, allocations, funding history, outgoing commitments" />
      <MomentumMetricsBlock
        metrics={[
          { label: "Family balance", value: `$${wallet.treasuryBalance.toFixed(0)}`, delta: "seeded", description: "Available household treasury for teen actions." },
          { label: "Allowance cadence", value: "7d", delta: "weekly", description: "Current allowance schedule." },
          { label: "Outgoing commitments", value: "2", delta: "stable", description: "Recurring or approved obligations." },
          { label: "Evidence bundles", value: `${history.length}`, delta: "live", description: "Receipts preserved for household memory." },
        ]}
      />
    </div>
  );
}

function ParentRulesScreen() {
  const { rules } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Rules & Limits" subtitle="max spend, recurring cap, categories, savings rules, emergency pause" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ActionSummaryCard title="Max daily spend" amount={`$${rules.maxDailySpend}`} body="Teen can move through the day without checking each tiny action." />
        <ActionSummaryCard title="Max single spend" amount={`$${rules.maxSingleSpend}`} body="One-off requests above this band escalate." />
        <ActionSummaryCard title="Recurring cap" amount={`$${rules.recurringCap}`} body="Subscriptions above this amount require parent approval." />
        <ActionSummaryCard title="Approved categories" amount={String(rules.approvedCategories.length)} body={rules.approvedCategories.join(" · ")} />
        <ActionSummaryCard title="Blocked categories" amount={String(rules.blockedCategories.length)} body={rules.blockedCategories.join(" · ")} />
        <ActionSummaryCard title="Emergency pause" amount={rules.emergencyPause ? "On" : "Off"} body="Emergency pause is fully designed and visible in the wallet layer." />
      </div>
    </div>
  );
}

function ParentApprovalsScreen() {
  const { approvals, loadingAction } = useProof18Store();
  const { approveSubscription, denySubscription, runSubscriptionFlow } = useProof18Flows();

  return (
    <div className="space-y-4">
      <TopNavigation
        title="Approvals Queue"
        subtitle="pending requests, teen name, explanation, approve / deny"
        actions={<ActionButton icon={Bell} label="Generate red request" onClick={runSubscriptionFlow} />}
      />
      {approvals.filter((request) => request.status === "pending").length === 0 ? (
        <EmptyState title="Approval queue is clear" body="Run the subscription flow to watch a red policy result move into this queue." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
          <div className="space-y-4">
            {approvals
              .filter((request) => request.status === "pending")
              .map((request) => (
                <ApprovalRequestCard
                  key={request.id}
                  teen={request.teenName}
                  title={request.actionType}
                  amount={request.amount}
                  explanation={request.explanation}
                  onApprove={() => approveSubscription(request.id)}
                  onDeny={() => denySubscription(request.id)}
                  loading={loadingAction === `approval-${request.id}`}
                />
              ))}
          </div>
          <div className="space-y-4">
            {approvals[0] ? (
              <TransactionSigningCard
                amount={approvals[0].amount}
                title={approvals[0].actionType}
                policy="red"
                onApprove={() => approveSubscription(approvals[0].id)}
                disabled={loadingAction === `approval-${approvals[0].id}`}
              />
            ) : null}
            {loadingAction?.startsWith("approval-") ? <LoadingState label="Guardian approval is signing and releasing the request..." /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function ParentTeenProgressScreen() {
  const { passport } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Teen Progress" subtitle="score trends, responsible actions, unlocked permissions" />
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <PassportBadgeCard score={passport.score} level={passport.level} streak={passport.streak} />
        <div className="space-y-4">
          <ExplanationCard title="Recommendation to increase freedom" body="If the streak holds and recurring actions stay clean, the next unlock can widen low-risk spending." tone="good" />
          {passport.log.map((entry, index) => (
            <ActionSummaryCard
              key={`${entry.label}-${index}`}
              title={entry.label}
              amount={`+${entry.delta}`}
              body={`Recorded ${entry.time}. These actions are why the system trusts the teen more.`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ParentHistoryAuditScreen() {
  const { history } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="History / Audit" subtitle="approvals, denials, receipts, policy outcomes, Filecoin references" />
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {history.map((item) => (
            <TransactionHistoryRow key={item.id} item={item} />
          ))}
        </div>
        <div className="space-y-4">
          <EvidenceReferenceSurface reference="fil://bafy...guardian-approved" />
          <ExplanationCard title="Filecoin-backed evidence reference" body="Every important action includes a durable reference for later review or demo storytelling." />
        </div>
      </div>
    </div>
  );
}

function SharedActionDetailsScreen() {
  const { history } = useProof18Store();
  const item = history[0];
  if (!item) return <EmptyState title="No action details yet" body="As flows run, details land here." />;
  return (
    <div className="space-y-4">
      <TopNavigation title="Action Details" subtitle="shared action detail surface" />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <ActionSummaryCard title={item.title} amount={`$${item.amount.toFixed(2)}`} body={`Status: ${item.status}. Policy: ${item.policy}. Approval needed: ${item.approvalNeeded ? "Yes" : "No"}.`} />
        <div className="space-y-4">
          <ConfidentialPolicyResult policy={item.policy} />
          <EvidenceReferenceSurface reference={item.evidenceRef} />
        </div>
      </div>
    </div>
  );
}

function SharedExecutionResultScreen() {
  const { lastResult, loadingAction, history } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Execution Result" subtitle="success, blocked, approval-needed result panel" />
      {loadingAction ? <LoadingState label="An action is still moving through the system." /> : null}
      {lastResult ? <ResultPanel tone={lastResult.tone} title={lastResult.title} body={lastResult.body} /> : <EmptyState title="No result yet" body="Run one of the MVP flows and the latest result panel appears here." />}
      {history[0] ? <TransactionStateSurface pending={false} confirmed={history[0].status === "success"} /> : null}
    </div>
  );
}

function SharedNotificationsScreen() {
  const { notifications } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Notifications" subtitle="shared household notices" />
      <NotificationList items={notifications} />
    </div>
  );
}

function SharedProfileSettingsScreen() {
  const { wallet } = useProof18Store();
  return (
    <div className="space-y-4">
      <TopNavigation title="Profile / Settings" subtitle="wallet status, guardian status, account state" />
      <div className="grid gap-4 lg:grid-cols-2">
        <GuardianAuthoritySurface ready={wallet.guardianReady} />
        <PausedAccountSurface paused={wallet.paused} />
      </div>
    </div>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[1.8rem] border border-border/70 bg-card/75 p-5">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SetupCard({ title, body, done }: { title: string; body: string; done: boolean }) {
  return (
    <ActionSummaryCard
      title={title}
      amount={done ? "Done" : "Pending"}
      body={body}
    />
  );
}

function SubscriptionColumn({
  title,
  items,
  empty,
}: {
  title: string;
  items: { id: string; name: string; amount: number; status: string; renewsOn: string }[];
  empty: string;
}) {
  return (
    <div className="space-y-4">
      <TopNavigation title={title} subtitle="subscription stack" />
      {items.length === 0 ? (
        <EmptyState title="Nothing here" body={empty} />
      ) : (
        items.map((item) => (
          <ActionSummaryCard
            key={item.id}
            title={item.name}
            amount={`$${item.amount.toFixed(2)}`}
            body={`Status: ${item.status}. Renewal label: ${item.renewsOn}.`}
          />
        ))
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-[1.5rem] border border-border/70 bg-card/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:bg-card"
    >
      <span className="rounded-full bg-primary/10 p-2 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}
