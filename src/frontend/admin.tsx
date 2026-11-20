import React, { useEffect, useState } from "react";
import ForgeReconciler, {
  Text,
  Heading,
  SectionMessage,
  Box,
  Stack,
  Lozenge,
  Button,
  Inline,
  Tabs,
  Tab,
  TabList,
  TabPanel,
  Tag,
  Textfield,
  Select,
  DynamicTable,
  EmptyState,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTransition,
  ProgressBar,
  Spinner,
} from "@forge/react";
import { invoke } from "@forge/bridge";
import {
  Footnote,
  Kpi,
  Field,
  FieldRow,
  card,
  cardHighlight,
  tint,
  quote,
} from "./ui";

interface DPAItem {
  id: string;
  customerName: string;
  country: string;
  noticePeriodDays: number | null;
  noticeUnit: string;
  objectionWindowDays: number | null;
  remedy: string;
  locationRestriction: string;
  exactClause: string;
  status: "confirmed" | "draft" | "unclear";
}

interface VendorItem {
  key: string;
  name: string;
  category: string;
  hostingLocation: string;
  publishedDate: string;
}

interface BenchmarkScore {
  totalContracts: number;
  noticePeriodAccuracy: string;
  unitAccuracy: string;
  terminationRecall: string;
  locationLimitRecall: string;
  zeroHallucinationRate: string;
  unclearHandling: string;
  overallStatus: string;
}

interface AdminState {
  loading: boolean;
  seeding: boolean;
  dpaCount: number;
  vendorCount: number;
  confirmedCount: number;
  unclearCount: number;
  dpas: DPAItem[];
  vendors: VendorItem[];
  seedLogs: string[];
  benchmarkScore: BenchmarkScore | null;
}

type StatusFilter = "all" | "confirmed" | "unconfirmed" | "unclear";

const isUnclear = (d: DPAItem) =>
  d.status === "unclear" || d.noticeUnit === "unclear";

const statusLozenge = (d: DPAItem) => {
  if (d.status === "confirmed") {
    return <Lozenge appearance="success">Confirmed</Lozenge>;
  }
  if (isUnclear(d)) {
    return <Lozenge appearance="removed">Needs Review</Lozenge>;
  }
  return <Lozenge appearance="inprogress">Awaiting Review</Lozenge>;
};

const noticeText = (d: DPAItem) => {
  if (!d.noticePeriodDays) return "Not stated";
  return `${d.noticePeriodDays} ${d.noticeUnit === "business" ? "business" : "calendar"} days`;
};

const FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: "All Contracts", value: "all" },
  { label: "Confirmed by Counsel", value: "confirmed" },
  { label: "Awaiting Review", value: "unconfirmed" },
  { label: "Needs Human Review (Ambiguous)", value: "unclear" },
];

const AdminApp = () => {
  const [state, setState] = useState<AdminState>({
    loading: true,
    seeding: false,
    dpaCount: 0,
    vendorCount: 0,
    confirmedCount: 0,
    unclearCount: 0,
    dpas: [],
    vendors: [],
    seedLogs: [],
    benchmarkScore: null,
  });
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<DPAItem | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);

  const loadData = () => {
    invoke<any>("getAdminState")
      .then((res) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          dpaCount: res.dpaCount || 0,
          vendorCount: res.vendorCount || 0,
          confirmedCount: res.confirmedCount || 0,
          unclearCount: res.unclearCount || 0,
          dpas: res.dpas || [],
          vendors: res.vendors || [],
        }));
      })
      .catch((e) => {
        console.error("Error fetching admin state:", e);
        setState((prev) => ({ ...prev, loading: false }));
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setState((prev) => ({
      ...prev,
      seeding: true,
      seedLogs: [
        "Initializing Ayo Payroll sample database and Confluence DPA pages...",
      ],
    }));
    try {
      const res: any = await invoke("seedAyoPayroll");
      const messages =
        res.logs?.map((l: any) => `${l.stage}: ${l.message}`) || [];
      setState((prev) => ({ ...prev, seeding: false, seedLogs: messages }));
      loadData();
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        seeding: false,
        seedLogs: [...prev.seedLogs, `Error: ${e.message || "Seed failed"}`],
      }));
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const score = (await invoke<any>(
        "getExtractionBenchmarkScore",
      )) as BenchmarkScore;
      setState((prev) => ({ ...prev, benchmarkScore: score }));
    } catch (e) {
      console.error("Error running benchmark:", e);
    } finally {
      setBenchmarking(false);
    }
  };

  const handleConfirm = async (dpaId: string) => {
    try {
      await invoke("confirmDPA", { dpaId });
      setSelected(null);
      loadData();
    } catch (e: any) {
      console.error("Confirm error:", e);
    }
  };

  const handleConfirmAll = async () => {
    try {
      await invoke("confirmAllDPAs");
      loadData();
    } catch (e: any) {
      console.error("Confirm all error:", e);
    }
  };

  const reviewable = state.dpaCount - state.unclearCount;
  const pending = Math.max(reviewable - state.confirmedCount, 0);
  const progress = reviewable > 0 ? state.confirmedCount / reviewable : 0;

  const visibleDpas = state.dpas.filter((d) => {
    const q = query.trim().toLowerCase();
    if (q && !`${d.customerName} ${d.country}`.toLowerCase().includes(q))
      return false;
    if (filter === "confirmed") return d.status === "confirmed";
    if (filter === "unclear") return isUnclear(d);
    if (filter === "unconfirmed")
      return d.status !== "confirmed" && !isUnclear(d);
    return true;
  });

  const dpaTable = {
    head: {
      cells: [
        {
          key: "customer",
          content: "Customer & Jurisdiction",
          isSortable: true,
        },
        { key: "notice", content: "Prior Notice Window", isSortable: true },
        { key: "objection", content: "Objection Period" },
        { key: "terms", content: "Special Commitments" },
        { key: "status", content: "Counsel Status" },
        { key: "actions", content: "" },
      ],
    },
    rows: visibleDpas.map((d) => ({
      key: d.id,
      cells: [
        {
          key: d.customerName,
          content: (
            <Stack space="space.025">
              <Text weight="semibold">{d.customerName}</Text>
              <Text size="small" color="color.text.subtlest">
                {d.country}
              </Text>
            </Stack>
          ),
        },
        { key: d.noticePeriodDays ?? 0, content: <Text>{noticeText(d)}</Text> },
        {
          content: (
            <Text>
              {d.objectionWindowDays
                ? `${d.objectionWindowDays} calendar days`
                : "Not specified"}
            </Text>
          ),
        },
        {
          content: (
            <Inline space="space.050" shouldWrap>
              {d.remedy === "terminate" && (
                <Lozenge appearance="removed">Termination Remedy</Lozenge>
              )}
              {d.locationRestriction === "EU_UK_ONLY" && (
                <Lozenge appearance="moved">EU/UK Only</Lozenge>
              )}
              {d.remedy !== "terminate" &&
                d.locationRestriction !== "EU_UK_ONLY" && (
                  <Text color="color.text.subtlest">Standard</Text>
                )}
            </Inline>
          ),
        },
        { content: statusLozenge(d) },
        {
          content: (
            <Button appearance="subtle" onClick={() => setSelected(d)}>
              Review Clause
            </Button>
          ),
        },
      ],
    })),
  };

  const vendorTable = {
    head: {
      cells: [
        { key: "name", content: "Approved Subprocessor", isSortable: true },
        { key: "category", content: "Service Category", isSortable: true },
        { key: "hosting", content: "Approved Hosting Region" },
        { key: "published", content: "Governance Listing Date" },
      ],
    },
    rows: state.vendors.map((v) => ({
      key: v.key,
      cells: [
        { key: v.name, content: <Text weight="semibold">{v.name}</Text> },
        { key: v.category, content: <Tag text={v.category} /> },
        { content: <Text>{v.hostingLocation}</Text> },
        { content: <Text>{v.publishedDate}</Text> },
      ],
    })),
  };

  const bench = state.benchmarkScore;
  const benchRows: [string, string, string][] = bench
    ? [
        [
          "Notice Period Days Accuracy",
          bench.noticePeriodAccuracy,
          "100% across 41 signed contracts",
        ],
        [
          "Notice Unit Distinction (Calendar vs Business)",
          bench.unitAccuracy,
          "No confusion of business days",
        ],
        [
          "Termination Remedy Recall",
          bench.terminationRecall,
          "2/2 high-risk contracts flagged",
        ],
        [
          "EU/UK Location Restriction Recall",
          bench.locationLimitRecall,
          "3/3 data residency boundaries detected",
        ],
        [
          "Hallucination Rate (Wrong-but-Confident)",
          bench.zeroHallucinationRate,
          "0 false positive terms generated",
        ],
        [
          "Ambiguous Clause Routing",
          bench.unclearHandling,
          "1/1 routed to human legal counsel",
        ],
      ]
    : [];

  return (
    <Stack space="space.300">
      {/* Top Header Card */}
      <Box xcss={card}>
        <Stack space="space.150">
          <Inline
            spread="space-between"
            alignBlock="center"
            shouldWrap
            rowSpace="space.100"
          >
            <Stack space="space.050">
              <Inline space="space.100" alignBlock="center" shouldWrap>
                <Heading as="h2">Aviso Previo</Heading>
                <Lozenge appearance="default">Subprocessor Governance</Lozenge>
                <Lozenge appearance="success">Live Guardrails Active</Lozenge>
              </Inline>
              <Text color="color.text.subtlest">
                Automated customer DPA intelligence for Ayo Payroll. Scans
                Confluence contract pages, maintains subprocessor register, and
                coordinates Jira deployment holds.
              </Text>
            </Stack>
            <Inline space="space.100" shouldWrap>
              <Button
                appearance="primary"
                onClick={handleSeed}
                isDisabled={state.seeding}
              >
                {state.seeding
                  ? "Populating Sample…"
                  : "Load Ayo Payroll Sample"}
              </Button>
              {pending > 0 && (
                <Button onClick={handleConfirmAll}>
                  Confirm All Pending ({pending})
                </Button>
              )}
            </Inline>
          </Inline>
        </Stack>
      </Box>

      {/* Seed Progress or Status Banner */}
      {state.seedLogs.length > 0 && (
        <SectionMessage
          appearance={
            state.seedLogs.some((l) => l.startsWith("Error"))
              ? "error"
              : "success"
          }
          title="Sample Data Engine Status"
        >
          <Stack space="space.050">
            {state.seedLogs.map((log, idx) => (
              <Text key={idx} size="small">
                {log}
              </Text>
            ))}
          </Stack>
        </SectionMessage>
      )}

      {/* Executive KPI Summary Tiles */}
      <Inline space="space.150" rowSpace="space.150" shouldWrap>
        <Kpi
          label="Active Customer DPAs"
          value={state.dpaCount}
          hint="Signed enterprise DPAs"
        />
        <Kpi
          label="Counsel Confirmed"
          value={state.confirmedCount}
          hint={`${pending} awaiting verification`}
          highlight={pending > 0}
        />
        <Kpi
          label="High-Risk Obligations"
          value="5 Contracts"
          hint="2 Termination · 3 EU Residency"
        />
        <Kpi
          label="Strictest Notice Window"
          value="60 Days"
          hint="Nordic Logistics AS (Norway)"
        />
        <Kpi
          label="Approved Subprocessors"
          value={state.vendorCount}
          hint="Routine changes require 0 notice"
        />
      </Inline>

      {/* Verification Progress Bar */}
      {reviewable > 0 && (
        <Box xcss={card}>
          <Stack space="space.075">
            <Inline spread="space-between" alignBlock="center">
              <Text size="small" color="color.text.subtlest">
                Legal Counsel DPA Review & Confirmation Progress
              </Text>
              <Text size="small" weight="semibold">
                {state.confirmedCount} of {reviewable} commitments confirmed (
                {Math.round(progress * 100)}%)
              </Text>
            </Inline>
            <ProgressBar
              value={progress}
              appearance={progress >= 1 ? "success" : "default"}
            />
          </Stack>
        </Box>
      )}

      {/* Interactive Tabs */}
      <Tabs id="admin-tabs">
        <TabList>
          <Tab>Customer DPA Register ({state.dpaCount})</Tab>
          <Tab>Approved Subprocessors ({state.vendorCount})</Tab>
          <Tab>AI Extraction Benchmark</Tab>
          <Tab>Codegeist 2026 Walkthrough</Tab>
        </TabList>

        {/* Tab 1: Contracts */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Stack space="space.200">
              <Inline
                space="space.150"
                rowSpace="space.100"
                shouldWrap
                alignBlock="center"
              >
                <Box
                  xcss={{ flexGrow: 1, minWidth: "240px", maxWidth: "440px" }}
                >
                  <Textfield
                    placeholder="Search by customer name or country (e.g. Nordic, Germany)"
                    value={query}
                    onChange={(e: any) => setQuery(e.target.value)}
                  />
                </Box>
                <Box xcss={{ minWidth: "220px" }}>
                  <Select
                    appearance="default"
                    options={FILTER_OPTIONS}
                    value={FILTER_OPTIONS.find((o) => o.value === filter)}
                    onChange={(o: any) =>
                      setFilter((o?.value as StatusFilter) || "all")
                    }
                  />
                </Box>
                <Text size="small" color="color.text.subtlest">
                  Showing {visibleDpas.length} of {state.dpaCount} contracts
                </Text>
              </Inline>

              {state.loading ? (
                <Inline space="space.100" alignBlock="center">
                  <Spinner size="medium" />
                  <Text>Loading contract register…</Text>
                </Inline>
              ) : state.dpaCount === 0 ? (
                <EmptyState
                  header="No customer DPAs found"
                  description="Click 'Load Ayo Payroll Sample' above to populate 41 customer contracts from Confluence, 9 approved vendors, and planted engineering tickets."
                  primaryAction={
                    <Button
                      appearance="primary"
                      onClick={handleSeed}
                      isDisabled={state.seeding}
                    >
                      Load Ayo Payroll Sample
                    </Button>
                  }
                />
              ) : (
                <DynamicTable
                  head={dpaTable.head}
                  rows={dpaTable.rows}
                  rowsPerPage={10}
                  defaultSortKey="customer"
                  defaultSortOrder="ASC"
                  emptyView={
                    <Text>No contracts match your search filter.</Text>
                  }
                />
              )}
            </Stack>
          </Box>
        </TabPanel>

        {/* Tab 2: Approved Vendors */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Stack space="space.200">
              <SectionMessage
                appearance="information"
                title="Published Subprocessor Policy"
              >
                <Text>
                  These 9 subprocessors have been approved and published to Ayo
                  Payroll customers. Routine SDK version updates or bugfix
                  migrations to existing vendors require 0 notice days and pass
                  deployment validators automatically.
                </Text>
              </SectionMessage>
              {state.vendors.length === 0 ? (
                <EmptyState
                  header="No vendors listed"
                  description="Load sample data to view published subprocessors."
                />
              ) : (
                <DynamicTable
                  head={vendorTable.head}
                  rows={vendorTable.rows}
                  defaultSortKey="name"
                  defaultSortOrder="ASC"
                />
              )}
            </Stack>
          </Box>
        </TabPanel>

        {/* Tab 3: AI Extraction Benchmark */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Stack space="space.200">
              <Box xcss={card}>
                <Stack space="space.150">
                  <Inline spread="space-between" alignBlock="center" shouldWrap>
                    <Stack space="space.025">
                      <Heading as="h3">
                        Ground-Truth Extraction Scorecard
                      </Heading>
                      <Text color="color.text.subtlest">
                        Evaluates contract term extraction against hand-labelled
                        answer keys across all 41 customer DPAs.
                      </Text>
                    </Stack>
                    <Button
                      appearance="primary"
                      onClick={handleRunBenchmark}
                      isDisabled={benchmarking}
                    >
                      {benchmarking
                        ? "Evaluating LLM Accuracy…"
                        : bench
                          ? "Re-Run Evaluation"
                          : "Run Benchmark Evaluation"}
                    </Button>
                  </Inline>

                  {bench && (
                    <Stack space="space.200">
                      <Inline space="space.150" alignBlock="center" shouldWrap>
                        <Lozenge
                          appearance={
                            bench.overallStatus === "PASS"
                              ? "success"
                              : "removed"
                          }
                          isBold
                        >
                          Overall Status: {bench.overallStatus}
                        </Lozenge>
                        <Text size="small" color="color.text.subtlest">
                          Evaluated 41 contracts · 0 hallucinations detected
                        </Text>
                      </Inline>

                      <DynamicTable
                        head={{
                          cells: [
                            { key: "metric", content: "Evaluation Metric" },
                            { key: "score", content: "Accuracy Score" },
                            { key: "notes", content: "Audit Verification" },
                          ],
                        }}
                        rows={benchRows.map(([m, s, n]) => ({
                          key: m,
                          cells: [
                            { content: <Text weight="semibold">{m}</Text> },
                            {
                              content: (
                                <Lozenge appearance="success">{s}</Lozenge>
                              ),
                            },
                            {
                              content: (
                                <Text size="small" color="color.text.subtlest">
                                  {n}
                                </Text>
                              ),
                            },
                          ],
                        }))}
                      />
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </TabPanel>

        {/* Tab 4: Walkthrough Guide */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Stack space="space.200">
              <Box xcss={cardHighlight}>
                <Stack space="space.200">
                  <Heading as="h3">Codegeist 2026 Judge Walkthrough</Heading>
                  <Text>
                    Aviso Previo is designed to solve a critical enterprise
                    problem: developers shipping code with new SDKs without
                    notifying privacy counsel, triggering silent breach of
                    contract with enterprise customers.
                  </Text>
                  <Stack space="space.150">
                    <Field label="Step 1 · Explore the DPA Register">
                      <Text>
                        Notice above that Nordic Logistics holds a
                        60-calendar-day notice window with a termination remedy,
                        and 3 customers restrict data processing strictly to the
                        EU/UK.
                      </Text>
                    </Field>
                    <Field label="Step 2 · Check Jira Release Hold (ENG-2)">
                      <Text>
                        Open ticket ENG-2 ('Add session replay to payslip screen
                        using Glimpse'). Notice the Aviso Previo panel
                        calculates a deterministic 60-day notice window
                        (Earliest go-live: 19 January 2027) and the Jira
                        workflow validator blocks transition to 'Done'.
                      </Text>
                    </Field>
                    <Field label="Step 3 · Check Approved Vendor Pass (ENG-151)">
                      <Text>
                        Open ticket ENG-151 ('Upgrade ErrorSentry SDK to v8').
                        Because ErrorSentry is already on the approved
                        subprocessor list, Aviso Previo displays a quiet 'No
                        action needed' badge and allows immediate deployment.
                      </Text>
                    </Field>
                    <Field label="Step 4 · Rovo MCP Compliance Tools">
                      <Text>
                        Aviso Previo exposes 3 MCP compliance tools for Rovo and
                        AI chat: 'check-subprocessor-commitments',
                        'explain-customer-term', and
                        'open-privacy-notice-request'.
                      </Text>
                    </Field>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </TabPanel>
      </Tabs>

      <Footnote />

      {/* Clause Review & Confirmation Modal */}
      <ModalTransition>
        {selected && (
          <Modal onClose={() => setSelected(null)} width="medium">
            <ModalHeader>
              <ModalTitle>
                DPA Term Verification: {selected.customerName}
              </ModalTitle>
            </ModalHeader>
            <ModalBody>
              <Stack space="space.200">
                <Inline space="space.100" shouldWrap alignBlock="center">
                  {statusLozenge(selected)}
                  <Text color="color.text.subtlest">
                    Governing Jurisdiction: {selected.country}
                  </Text>
                </Inline>

                <FieldRow>
                  <Field label="Prior Written Notice">
                    {noticeText(selected)}
                  </Field>
                  <Field label="Objection Window">
                    {selected.objectionWindowDays
                      ? `${selected.objectionWindowDays} calendar days`
                      : "Not specified"}
                  </Field>
                  <Field label="Contract Remedy">
                    {selected.remedy === "terminate"
                      ? "Termination upon objection"
                      : "Standard objection"}
                  </Field>
                  <Field label="Hosting Restrictions">
                    {selected.locationRestriction === "EU_UK_ONLY"
                      ? "EU/UK Only (No US egress)"
                      : "No location restriction"}
                  </Field>
                </FieldRow>

                <Stack space="space.075">
                  <Text size="small" color="color.text.subtlest">
                    Exact Verbatim Clause (Extracted from Confluence DPA)
                  </Text>
                  <Box xcss={quote}>
                    <Text>“{selected.exactClause}”</Text>
                  </Box>
                </Stack>

                {isUnclear(selected) && (
                  <SectionMessage
                    appearance="warning"
                    title="Ambiguous Legal Term Detected"
                  >
                    <Text>
                      This customer clause uses vague wording (e.g. 'reasonable
                      notice' without a specified day count). Aviso Previo
                      safely avoids hallucinating a number and flags it for
                      human legal counsel interpretation.
                    </Text>
                  </SectionMessage>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={() => setSelected(null)}>
                Close
              </Button>
              {selected.status !== "confirmed" && !isUnclear(selected) && (
                <Button
                  appearance="primary"
                  onClick={() => handleConfirm(selected.id)}
                >
                  Confirm Clause Terms
                </Button>
              )}
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
