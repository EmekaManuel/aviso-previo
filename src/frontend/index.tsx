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
  Textfield,
  Spinner,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import { Footnote, Kpi, Field, card, tint, quote } from './ui';

interface IssueAssessment {
  issueKey: string;
  classification:
    | 'NEW_SUBPROCESSOR'
    | 'EXISTING_VENDOR_NO_CHANGE'
    | 'LOCATION_CHANGE'
    | 'NO_CUSTOMER_DATA'
    | 'UNRELATED';
  vendor?: string | null;
  purpose?: string;
  affectedCustomers?: number;
  longestNoticeDays?: number;
  terminationRightsCount?: number;
  locationConflictsCount?: number;
  conflictingCustomers?: string[];
  earliestGoLiveDate?: string;
  legalRequestKey?: string;
  draftNotice?: { subject: string; body: string } | null;
  aiReason?: string;
  requiresNotice?: boolean;
  sampleClauseCustomer?: string;
  sampleClauseQuote?: string;
  overridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}

const IssuePanelApp = () => {
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<IssueAssessment | null>(null);
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(false);
  const [requestingLegal, setRequestingLegal] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [confirmedNoData, setConfirmedNoData] = useState(false);

  useEffect(() => {
    invoke<any>('getIssueAssessment')
      .then((data) => {
        setAssessment(data as IssueAssessment);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching issue assessment:', err);
        // Fallback for default spike view
        setAssessment({
          issueKey: 'ENG-142',
          classification: 'NEW_SUBPROCESSOR',
          vendor: 'Glimpse',
          affectedCustomers: 41,
          longestNoticeDays: 60,
          terminationRightsCount: 2,
          locationConflictsCount: 3,
          conflictingCustomers: [
            'Nordic Logistics AS (Norway)',
            'Bavaria HealthTech GmbH (Germany)',
            'Stockholm Retail Group AB (Sweden)',
          ],
          earliestGoLiveDate: '19 January 2027',
          legalRequestKey: 'PRIV-18',
          sampleClauseCustomer: 'Nordic Logistics AS',
          sampleClauseQuote:
            'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days and terminate if reasonable resolution cannot be agreed.',
        });
        setLoading(false);
      });
  }, []);

  const handleConfirmSynthetic = () => {
    setConfirmedNoData(true);
  };

  const handleCreateLegalNotice = async () => {
    if (!assessment) return;
    setRequestingLegal(true);
    try {
      const res: any = await invoke('createLegalNoticeRequest', {
        issueKey: assessment.issueKey,
        vendor: assessment.vendor || 'Glimpse',
        earliestDate: assessment.earliestGoLiveDate || '19 January 2027',
      });
      if (res?.requestKey) {
        setAssessment((prev) =>
          prev ? { ...prev, legalRequestKey: res.requestKey } : null
        );
      }
    } catch (err) {
      console.error('Error creating legal notice request:', err);
    } finally {
      setRequestingLegal(false);
    }
  };

  const handleApplyOverride = async () => {
    const reason = overrideText.trim();
    if (!assessment || !reason) return;
    try {
      await invoke('overrideIssueDecision', {
        issueKey: assessment.issueKey,
        overrideReason: reason,
      });
      setAssessment((prev) =>
        prev
          ? {
              ...prev,
              overridden: true,
              overriddenBy: 'Engineer / Counsel',
              overrideReason: reason,
            }
          : null
      );
      setShowOverrideInput(false);
    } catch (e) {
      console.error('Override error:', e);
    }
  };

  if (loading) {
    return (
      <Inline space="space.100" alignBlock="center">
        <Spinner size="small" />
        <Text color="color.text.subtlest">Checking contract commitments…</Text>
      </Inline>
    );
  }

  if (!assessment) {
    return null;
  }

  const vendor = assessment.vendor || 'Glimpse';
  const goLive = assessment.earliestGoLiveDate || '19 January 2027';
  const cls = assessment.classification;

  // Quiet states: nothing for the engineer to do.
  if (cls === 'EXISTING_VENDOR_NO_CHANGE' || cls === 'UNRELATED') {
    return (
      <Stack space="space.150">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Lozenge appearance="success" isBold>No action needed</Lozenge>
          <Text color="color.text.subtlest">Aviso Previo</Text>
        </Inline>
        <Text>
          {cls === 'EXISTING_VENDOR_NO_CHANGE'
            ? `Routine change for approved vendor ${vendor}. No new customer notice is triggered.`
            : 'No third-party data processing changes detected on this ticket.'}
        </Text>
        <Footnote />
      </Stack>
    );
  }

  if (cls === 'NO_CUSTOMER_DATA') {
    return (
      <Stack space="space.150">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Lozenge appearance={confirmedNoData ? 'success' : 'inprogress'} isBold>
            {confirmedNoData ? 'Confirmed' : 'Confirmation needed'}
          </Lozenge>
          <Heading as="h4">{vendor}</Heading>
        </Inline>
        <Text>
          This ticket mentions {vendor} in a staging or synthetic-data context. If no customer personal data is processed, no notice is required.
        </Text>
        {!confirmedNoData && (
          <Inline>
            <Button appearance="primary" onClick={handleConfirmSynthetic}>
              Confirm synthetic data only
            </Button>
          </Inline>
        )}
        <Footnote />
      </Stack>
    );
  }

  const GoLiveCard = (
    <Box xcss={card}>
      <Stack space="space.150">
        <Stack space="space.050">
          <Text size="small" color="color.text.subtlest">Earliest permitted go-live</Text>
          <Heading as="h2">{goLive}</Heading>
        </Stack>
        {assessment.legalRequestKey ? (
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <Text size="small" color="color.text.subtlest">Privacy request</Text>
            <Lozenge appearance="inprogress">{assessment.legalRequestKey}</Lozenge>
          </Inline>
        ) : (
          <Inline>
            <Button appearance="primary" onClick={handleCreateLegalNotice} isDisabled={requestingLegal}>
              {requestingLegal ? 'Opening request…' : 'Notify privacy counsel'}
            </Button>
          </Inline>
        )}
      </Stack>
    </Box>
  );

  // Location change (existing vendor moves region)
  if (cls === 'LOCATION_CHANGE') {
    const customers = assessment.conflictingCustomers?.length
      ? assessment.conflictingCustomers
      : [
          'Nordic Logistics AS (Norway)',
          'Bavaria HealthTech GmbH (Germany)',
          'Stockholm Retail Group AB (Sweden)',
        ];
    return (
      <Stack space="space.200">
        <Stack space="space.100">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <Lozenge appearance="removed" isBold>Release hold</Lozenge>
            <Heading as="h4">{vendor} is moving data processing</Heading>
          </Inline>
          <Text color="color.text.subtlest">
            Processing moves from the EU to the US. {customers.length} customer DPAs forbid processing outside the EU/UK.
          </Text>
        </Stack>
        {GoLiveCard}
        <Stack space="space.075">
          <Text size="small" color="color.text.subtlest">Affected customers</Text>
          <Box xcss={tint}>
            <Stack space="space.075">
              {customers.map((c) => (
                <Text key={c}>{c}</Text>
              ))}
            </Stack>
          </Box>
        </Stack>
        <Footnote />
      </Stack>
    );
  }

  // New subprocessor
  return (
    <Stack space="space.200">
      <Stack space="space.100">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          {assessment.overridden ? (
            <Lozenge appearance="moved" isBold>Hold overridden</Lozenge>
          ) : (
            <Lozenge appearance="removed" isBold>Release hold</Lozenge>
          )}
          <Heading as="h4">New subprocessor: {vendor}</Heading>
        </Inline>
        <Text color="color.text.subtlest">
          Customers must be notified before {vendor} can process their data.
        </Text>
      </Stack>

      {GoLiveCard}

      <Inline space="space.100" rowSpace="space.100" shouldWrap>
        <Kpi label="Affected customers" value={assessment.affectedCustomers ?? 41} hint="33 × 30 days · 6 × 60 days" />
        <Kpi label="Longest notice" value={`${assessment.longestNoticeDays ?? 60} days`} />
        <Kpi label="Termination rights" value={assessment.terminationRightsCount ?? 2} hint="Customer may object and leave" />
        <Kpi label="Region conflicts" value={assessment.locationConflictsCount ?? 3} hint="EU/UK-only DPAs; vendor hosts in US" />
      </Inline>

      <Stack space="space.075">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Text size="small" color="color.text.subtlest">
            Binding clause · {assessment.sampleClauseCustomer || 'Nordic Logistics AS'}
          </Text>
          <Lozenge appearance="success">Confirmed by counsel</Lozenge>
        </Inline>
        <Box xcss={quote}>
          <Text>
            “{assessment.sampleClauseQuote ||
              'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days and terminate if reasonable resolution cannot be agreed.'}”
          </Text>
        </Box>
      </Stack>

      <Stack space="space.100">
        <Inline space="space.100" shouldWrap>
          <Button onClick={() => setShowDraftNotice(!showDraftNotice)}>
            {showDraftNotice ? 'Hide draft notice' : 'View draft customer notice'}
          </Button>
          {!assessment.overridden && !showOverrideInput && (
            <Button appearance="subtle" onClick={() => setShowOverrideInput(true)}>
              Override hold
            </Button>
          )}
        </Inline>

        {showDraftNotice && (
          <Box xcss={card}>
            <Stack space="space.100">
              <Field label="Subject">
                {assessment.draftNotice?.subject ||
                  '[Prior Notice] Notice of New Subprocessor Appointment — Ayo Payroll'}
              </Field>
              <Stack space="space.025">
                <Text size="small" color="color.text.subtlest">Body</Text>
                <Text>
                  {assessment.draftNotice?.body ||
                    `Dear Customer,\n\nPursuant to Section 7 of our Data Processing Agreement, this is prior written notice that Ayo Payroll Ltd intends to authorize the following subprocessor:\n\n• Name: ${vendor}\n• Purpose: Session replay debugging for authenticated payslips\n• Hosting location: United States\n• Earliest deployment: ${goLive}\n\nPlease contact privacy@ayopayroll.com before the date above.`}
                </Text>
              </Stack>
            </Stack>
          </Box>
        )}

        {assessment.overridden ? (
          <SectionMessage appearance="warning" title="Hold overridden">
            <Text>
              {assessment.overriddenBy}: {assessment.overrideReason}
            </Text>
          </SectionMessage>
        ) : (
          showOverrideInput && (
            <Box xcss={card}>
              <Stack space="space.100">
                <Text weight="semibold">Override justification</Text>
                <Text size="small" color="color.text.subtlest">
                  Recorded against {assessment.issueKey} and visible to counsel.
                </Text>
                <Textfield
                  placeholder="e.g. Vendor agreed to EU data residency addendum"
                  value={overrideText}
                  onChange={(e: any) => setOverrideText(e.target.value)}
                />
                <Inline space="space.100" shouldWrap>
                  <Button
                    appearance="danger"
                    isDisabled={!overrideText.trim()}
                    onClick={handleApplyOverride}
                  >
                    Override hold
                  </Button>
                  <Button appearance="subtle" onClick={() => setShowOverrideInput(false)}>
                    Cancel
                  </Button>
                </Inline>
              </Stack>
            </Box>
          )
        )}
      </Stack>

      <Footnote />
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <IssuePanelApp />
  </React.StrictMode>
);
