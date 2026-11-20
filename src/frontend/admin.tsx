import React, { useEffect, useState } from 'react';
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
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { Footnote, Kpi, Field, FieldRow, card, tint, quote } from './ui';

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
  status: 'confirmed' | 'draft' | 'unclear';
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

type StatusFilter = 'all' | 'confirmed' | 'unconfirmed' | 'unclear';

const isUnclear = (d: DPAItem) => d.status === 'unclear' || d.noticeUnit === 'unclear';

const statusLozenge = (d: DPAItem) =>
  d.status === 'confirmed' ? (
    <Lozenge appearance="success">Confirmed</Lozenge>
  ) : isUnclear(d) ? (
    <Lozenge appearance="removed">Needs review</Lozenge>
  ) : (
    <Lozenge appearance="inprogress">Awaiting review</Lozenge>
  );

const noticeText = (d: DPAItem) =>
  d.noticePeriodDays ? `${d.noticePeriodDays} ${d.noticeUnit === 'business' ? 'business' : 'calendar'} days` : 'Not stated';

const FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Awaiting review', value: 'unconfirmed' },
  { label: 'Needs review', value: 'unclear' },
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<DPAItem | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);

  const loadData = () => {
    invoke<any>('getAdminState')
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
        console.error('Error fetching admin state:', e);
        setState((prev) => ({ ...prev, loading: false }));
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    setState((prev) => ({ ...prev, seeding: true, seedLogs: ['Starting sample data population...'] }));
    try {
      const res: any = await invoke('seedAyoPayroll');
      const messages = res.logs?.map((l: any) => `${l.stage}: ${l.message}`) || [];
      setState((prev) => ({ ...prev, seeding: false, seedLogs: messages }));
      loadData();
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        seeding: false,
        seedLogs: [...prev.seedLogs, `Error: ${e.message || 'Seed failed'}`],
      }));
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    try {
      const score = (await invoke<any>('getExtractionBenchmarkScore')) as BenchmarkScore;
      setState((prev) => ({ ...prev, benchmarkScore: score }));
    } catch (e) {
      console.error('Error running benchmark:', e);
    } finally {
      setBenchmarking(false);
    }
  };

  const handleConfirm = async (dpaId: string) => {
    try {
      await invoke('confirmDPA', { dpaId });
      setSelected(null);
      loadData();
    } catch (e: any) {
      console.error('Confirm error:', e);
    }
  };

  const handleConfirmAll = async () => {
    try {
      await invoke('confirmAllDPAs');
      loadData();
    } catch (e: any) {
      console.error('Confirm all error:', e);
    }
  };

  const reviewable = state.dpaCount - state.unclearCount;
  const pending = Math.max(reviewable - state.confirmedCount, 0);
  const progress = reviewable > 0 ? state.confirmedCount / reviewable : 0;

  const visibleDpas = state.dpas.filter((d) => {
    const q = query.trim().toLowerCase();
    if (q && !`${d.customerName} ${d.country}`.toLowerCase().includes(q)) return false;
    if (filter === 'confirmed') return d.status === 'confirmed';
    if (filter === 'unclear') return isUnclear(d);
    if (filter === 'unconfirmed') return d.status !== 'confirmed' && !isUnclear(d);
    return true;
  });

  const dpaTable = {
    head: {
      cells: [
        { key: 'customer', content: 'Customer', isSortable: true },
        { key: 'notice', content: 'Notice period', isSortable: true },
        { key: 'objection', content: 'Objection window' },
        { key: 'terms', content: 'Rights & limits' },
        { key: 'status', content: 'Status' },
        { key: 'actions', content: '' },
      ],
    },
    rows: visibleDpas.map((d) => ({
      key: d.id,
      cells: [
        {
          key: d.customerName,
          content: (
            <Stack space="space.0">
              <Text weight="semibold">{d.customerName}</Text>
              <Text size="small" color="color.text.subtlest">{d.country}</Text>
            </Stack>
          ),
        },
        { key: d.noticePeriodDays ?? 0, content: <Text>{noticeText(d)}</Text> },
        {
          content: (
            <Text>{d.objectionWindowDays ? `${d.objectionWindowDays} days` : '—'}</Text>
          ),
        },
        {
          content: (
            <Inline space="space.050" shouldWrap>
              {d.remedy === 'terminate' && <Lozenge appearance="removed">Can terminate</Lozenge>}
              {d.locationRestriction === 'EU_UK_ONLY' && <Lozenge appearance="moved">EU/UK only</Lozenge>}
              {d.remedy !== 'terminate' && d.locationRestriction !== 'EU_UK_ONLY' && (
                <Text color="color.text.subtlest">None</Text>
              )}
            </Inline>
          ),
        },
        { content: statusLozenge(d) },
        {
          content: (
            <Button appearance="subtle" onClick={() => setSelected(d)}>
              Review
            </Button>
          ),
        },
      ],
    })),
  };

  const vendorTable = {
    head: {
      cells: [
        { key: 'name', content: 'Vendor', isSortable: true },
        { key: 'category', content: 'Category', isSortable: true },
        { key: 'hosting', content: 'Hosting location' },
        { key: 'published', content: 'Listed on' },
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
  const benchRows: [string, string][] = bench
    ? [
        ['Notice period accuracy', bench.noticePeriodAccuracy],
        ['Calendar vs. business day unit', bench.unitAccuracy],
        ['Termination right recall', bench.terminationRecall],
        ['Location limit recall', bench.locationLimitRecall],
        ['Unsupported claims', bench.zeroHallucinationRate],
        ['Ambiguous clauses flagged', bench.unclearHandling],
      ]
    : [];

  return (
    <Stack space="space.300">
      {/* Header */}
      <Stack space="space.100">
        <Inline space="space.150" alignBlock="center" shouldWrap>
          <Heading as="h2">Subprocessor register</Heading>
          <Lozenge appearance="default">Sample data</Lozenge>
        </Inline>
        <Text color="color.text.subtlest">
          Customer DPA terms extracted from Confluence for Ayo Payroll. A term only triggers a release hold after counsel confirms it.
        </Text>
        <Inline space="space.100" shouldWrap>
          <Button appearance="primary" onClick={handleSeed} isDisabled={state.seeding}>
            {state.seeding ? 'Loading sample…' : 'Load sample data'}
          </Button>
          {pending > 0 && (
            <Button onClick={handleConfirmAll}>Confirm {pending} pending</Button>
          )}
        </Inline>
      </Stack>

      {state.seedLogs.length > 0 && (
        <SectionMessage
          appearance={state.seedLogs.some((l) => l.startsWith('Error')) ? 'error' : 'success'}
          title="Sample data"
        >
          <Stack space="space.025">
            {state.seedLogs.map((log, idx) => (
              <Text key={idx} size="small">{log}</Text>
            ))}
          </Stack>
        </SectionMessage>
      )}

      {/* KPIs */}
      <Inline space="space.150" rowSpace="space.150" shouldWrap>
        <Kpi label="Customer DPAs" value={state.dpaCount} />
        <Kpi label="Confirmed" value={state.confirmedCount} hint={`${pending} awaiting review`} />
        <Kpi label="Needs human review" value={state.unclearCount} hint="Ambiguous clause" />
        <Kpi label="Approved vendors" value={state.vendorCount} />
      </Inline>

      {reviewable > 0 && (
        <Stack space="space.075">
          <Inline spread="space-between" alignBlock="center">
            <Text size="small" color="color.text.subtlest">Counsel review progress</Text>
            <Text size="small" weight="semibold">
              {state.confirmedCount} of {reviewable}
            </Text>
          </Inline>
          <ProgressBar value={progress} appearance={progress >= 1 ? 'success' : 'default'} />
        </Stack>
      )}

      <Tabs id="admin-tabs">
        <TabList>
          <Tab>Contracts</Tab>
          <Tab>Vendors</Tab>
          <Tab>Evaluation</Tab>
          <Tab>Walkthrough</Tab>
        </TabList>

        {/* Contracts */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Stack space="space.200">
              <Inline space="space.150" rowSpace="space.100" shouldWrap>
                <Box xcss={{ flexGrow: 1, minWidth: '220px', maxWidth: '420px' }}>
                  <Textfield
                    placeholder="Search customer or country"
                    value={query}
                    onChange={(e: any) => setQuery(e.target.value)}
                  />
                </Box>
                <Box xcss={{ minWidth: '200px' }}>
                  <Select
                    appearance="default"
                    options={FILTER_OPTIONS}
                    value={FILTER_OPTIONS.find((o) => o.value === filter)}
                    onChange={(o: any) => setFilter((o?.value as StatusFilter) || 'all')}
                  />
                </Box>
              </Inline>

              {state.loading ? (
                <Spinner />
              ) : state.dpaCount === 0 ? (
                <EmptyState
                  header="No contracts yet"
                  description="Load the Ayo Payroll sample to add 41 fictional customer DPAs, 9 approved vendors and the demo Jira tickets."
                  primaryAction={
                    <Button appearance="primary" onClick={handleSeed} isDisabled={state.seeding}>
                      Load sample data
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
                  emptyView={<Text>No contracts match your filters.</Text>}
                />
              )}
            </Stack>
          </Box>
        </TabPanel>

        {/* Vendors */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            {state.vendors.length === 0 ? (
              <EmptyState header="No approved vendors" description="Vendors appear here once the sample data is loaded." />
            ) : (
              <DynamicTable head={vendorTable.head} rows={vendorTable.rows} defaultSortKey="name" defaultSortOrder="ASC" />
            )}
          </Box>
        </TabPanel>

        {/* Evaluation */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Stack space="space.200">
              <Text color="color.text.subtlest">
                Compares extracted terms against a hand-labelled answer key for all {state.dpaCount || 41} contracts.
              </Text>
              <Inline>
                <Button onClick={handleRunBenchmark} isDisabled={benchmarking}>
                  {benchmarking ? 'Running…' : bench ? 'Re-run evaluation' : 'Run evaluation'}
                </Button>
              </Inline>
              {bench && (
                <Box xcss={card}>
                  <Stack space="space.200">
                    <Inline space="space.100" alignBlock="center">
                      <Heading as="h4">Extraction accuracy</Heading>
                      <Lozenge appearance={bench.overallStatus === 'PASS' ? 'success' : 'removed'} isBold>
                        {bench.overallStatus}
                      </Lozenge>
                    </Inline>
                    <DynamicTable
                      head={{
                        cells: [
                          { key: 'metric', content: 'Metric' },
                          { key: 'result', content: 'Result' },
                        ],
                      }}
                      rows={benchRows.map(([m, r]) => ({
                        key: m,
                        cells: [{ content: <Text>{m}</Text> }, { content: <Text weight="semibold">{r}</Text> }],
                      }))}
                    />
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </TabPanel>

        {/* Walkthrough */}
        <TabPanel>
          <Box paddingBlockStart="space.200">
            <Box xcss={card}>
              <Stack space="space.200">
                <Heading as="h4">Try it in Jira</Heading>
                <Stack space="space.150">
                  <Field label="1 · Review the register">
                    <Text>
                      Two customers hold termination remedies (Nordic Logistics, Caledonia Finance) and three restrict data to the EU/UK.
                    </Text>
                  </Field>
                  <Field label="2 · New vendor">
                    <Text>
                      Create an ENG ticket: “Add session replay to payslip screen using Glimpse”. The issue panel shows a 60-day release hold.
                    </Text>
                  </Field>
                  <Field label="3 · Existing vendor">
                    <Text>
                      Create an ENG ticket: “Upgrade ErrorSentry SDK to v8”. No hold is raised.
                    </Text>
                  </Field>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </TabPanel>
      </Tabs>

      <Footnote />

      {/* Clause review modal */}
      <ModalTransition>
        {selected && (
          <Modal onClose={() => setSelected(null)} width="medium">
            <ModalHeader>
              <ModalTitle>{selected.customerName}</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <Stack space="space.200">
                <Inline space="space.100" shouldWrap alignBlock="center">
                  {statusLozenge(selected)}
                  <Text color="color.text.subtlest">{selected.country}</Text>
                </Inline>
                <FieldRow>
                  <Field label="Notice period">{noticeText(selected)}</Field>
                  <Field label="Objection window">
                    {selected.objectionWindowDays ? `${selected.objectionWindowDays} days` : 'Not stated'}
                  </Field>
                  <Field label="Remedy">{selected.remedy}</Field>
                  <Field label="Location">
                    {selected.locationRestriction === 'EU_UK_ONLY' ? 'EU/UK only' : 'No restriction'}
                  </Field>
                </FieldRow>
                <Stack space="space.075">
                  <Text size="small" color="color.text.subtlest">Clause as written in the DPA</Text>
                  <Box xcss={quote}>
                    <Text>“{selected.exactClause}”</Text>
                  </Box>
                </Stack>
                {isUnclear(selected) && (
                  <SectionMessage appearance="warning" title="Counsel review required">
                    <Text>This clause is ambiguous, so it will not trigger a release hold until a person resolves it.</Text>
                  </SectionMessage>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={() => setSelected(null)}>Close</Button>
              {selected.status !== 'confirmed' && !isUnclear(selected) && (
                <Button appearance="primary" onClick={() => handleConfirm(selected.id)}>
                  Confirm terms
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
  </React.StrictMode>
);
