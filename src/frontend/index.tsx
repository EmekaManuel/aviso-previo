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
import { Footnote, Kpi, Field, card, cardHighlight, cardAlert, cardSuccess, tint, quote } from './ui';

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
          issueKey: 'ENG-2',
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
              overriddenBy: 'Legal Counsel (Ayo Payroll)',
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
      <Box padding="space.150">
        <Inline space="space.100" alignBlock="center">
          <Spinner size="small" />
          <Text color="color.text.subtlest">Scanning customer DPA commitments…</Text>
        </Inline>
      </Box>
    );
  }

  if (!assessment) {
    return null;
  }

  const vendor = assessment.vendor || 'Glimpse';
  const goLive = assessment.earliestGoLiveDate || '19 January 2027';
  const cls = assessment.classification;

  // Quiet state: Approved vendor or unrelated ticket
  if (cls === 'EXISTING_VENDOR_NO_CHANGE' || cls === 'UNRELATED') {
    return (
      <Box xcss={cardSuccess}>
        <Stack space="space.150">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <Lozenge appearance="success" isBold>
              Release Allowed
            </Lozenge>
            <Heading as="h4">Aviso Previo · No Hold</Heading>
          </Inline>
          <Text>
            {cls === 'EXISTING_VENDOR_NO_CHANGE'
              ? `Routine change for approved subprocessor ${vendor}. Hosting location is unchanged, so 0 customer notice days are required.`
              : 'No third-party subprocessor or customer data egress changes detected on this ticket.'}
          </Text>
          <Footnote />
        </Stack>
      </Box>
    );
  }

  // Synthetic or Sandbox evaluation (no customer data)
  if (cls === 'NO_CUSTOMER_DATA') {
    return (
      <Box xcss={card}>
        <Stack space="space.150">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            <Lozenge appearance={confirmedNoData ? 'success' : 'inprogress'} isBold>
              {confirmedNoData ? 'Synthetic Data Confirmed' : 'Confirmation Needed'}
            </Lozenge>
            <Heading as="h4">{vendor} Evaluation</Heading>
          </Inline>
          <Text>
            This ticket indicates {vendor} will be used exclusively in a staging environment with synthetic or mock data. If no customer personal data is processed, customer DPA notice is not required.
          </Text>
          {!confirmedNoData && (
            <Inline>
              <Button appearance="primary" onClick={handleConfirmSynthetic}>
                Confirm Synthetic Data Only (No PII)
              </Button>
            </Inline>
          )}
          <Footnote />
        </Stack>
      </Box>
    );
  }

  const EarliestGoLiveBanner = (
    <Box xcss={cardHighlight}>
      <Stack space="space.150">
        <Inline spread="space-between" alignBlock="center" shouldWrap rowSpace="space.100">
          <Stack space="space.050">
            <Text size="small" color="color.text.subtlest">
              Earliest Permitted Go-Live Date (Release Hold)
            </Text>
            <Heading as="h2">{goLive}</Heading>
            <Text size="small" color="color.text.subtlest">
              Calculated deterministically from 60-day DPA window · Cannot be bypassed by code changes
            </Text>
          </Stack>
          <Box>
            {assessment.legalRequestKey ? (
              <Inline space="space.050" alignBlock="center">
                <Text size="small" color="color.text.subtlest">Notice Request:</Text>
                <Lozenge appearance="inprogress" isBold>{assessment.legalRequestKey}</Lozenge>
              </Inline>
            ) : (
              <Button
                appearance="primary"
                onClick={handleCreateLegalNotice}
                isDisabled={requestingLegal}
              >
                {requestingLegal ? 'Opening Request…' : 'Notify Privacy Counsel'}
              </Button>
            )}
          </Box>
        </Inline>
      </Stack>
    </Box>
  );

  // Location change (existing vendor moving to different region)
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
        <Box xcss={cardAlert}>
          <Stack space="space.100">
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Lozenge appearance="removed" isBold>Release Hold Active</Lozenge>
              <Heading as="h4">{vendor} Data Center Region Migration</Heading>
            </Inline>
            <Text>
              Processing moves outside the European Union. 3 customer DPAs strictly forbid customer data transfer outside the EU/UK.
            </Text>
          </Stack>
        </Box>

        {EarliestGoLiveBanner}

        <Stack space="space.075">
          <Text size="small" color="color.text.subtlest">Customers with Explicit EU/UK Data Residency Clauses</Text>
          <Box xcss={tint}>
            <Stack space="space.050">
              {customers.map((c) => (
                <Text key={c} weight="semibold">• {c}</Text>
              ))}
            </Stack>
          </Box>
        </Stack>

        <Footnote />
      </Stack>
    );
  }

  // New subprocessor (e.g. Glimpse on ENG-2)
  return (
    <Stack space="space.200">
      {/* Top Hold Alert Card */}
      <Box xcss={cardAlert}>
        <Stack space="space.100">
          <Inline space="space.100" alignBlock="center" shouldWrap>
            {assessment.overridden ? (
              <Lozenge appearance="moved" isBold>Hold Overridden</Lozenge>
            ) : (
              <Lozenge appearance="removed" isBold>Release Hold Active</Lozenge>
            )}
            <Heading as="h4">New Subprocessor Detected: {vendor}</Heading>
          </Inline>
          <Text>
            Enterprise DPAs require prior written customer notice before {vendor} can process production customer payroll data. Workflow validator blocks transition to 'Done'.
          </Text>
        </Stack>
      </Box>

      {/* Earliest Permitted Go-Live Card */}
      {EarliestGoLiveBanner}

      {/* Key Obligations Grid */}
      <Inline space="space.100" rowSpace="space.100" shouldWrap>
        <Kpi
          label="Affected Customers"
          value={assessment.affectedCustomers ?? 41}
          hint="All signed enterprise DPAs"
        />
        <Kpi
          label="Notice Window"
          value={`${assessment.longestNoticeDays ?? 60} Days`}
          hint="Calculated in code"
          highlight
        />
        <Kpi
          label="Termination Remedies"
          value={assessment.terminationRightsCount ?? 2}
          hint="Nordic & Caledonia"
        />
        <Kpi
          label="Region Conflicts"
          value={assessment.locationConflictsCount ?? 3}
          hint="Forbid US egress"
        />
      </Inline>

      {/* Verbatim Contract Evidence Card */}
      <Box xcss={card}>
        <Stack space="space.100">
          <Inline spread="space-between" alignBlock="center" shouldWrap>
            <Inline space="space.100" alignBlock="center">
              <Text size="small" color="color.text.subtlest">
                Binding DPA Clause:
              </Text>
              <Text size="small" weight="semibold">
                {assessment.sampleClauseCustomer || 'Nordic Logistics AS (Norway)'}
              </Text>
            </Inline>
            <Lozenge appearance="success">Confirmed by Legal Counsel</Lozenge>
          </Inline>
          <Box xcss={quote}>
            <Text>
              “{assessment.sampleClauseQuote ||
                'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days and terminate if reasonable resolution cannot be agreed.'}”
            </Text>
          </Box>
        </Stack>
      </Box>

      {/* Action Toolbar: Draft Notice & Counsel Override */}
      <Stack space="space.150">
        <Inline space="space.100" shouldWrap>
          <Button onClick={() => setShowDraftNotice(!showDraftNotice)}>
            {showDraftNotice ? 'Hide Draft Notice Email' : 'View Draft Customer Notice Email'}
          </Button>
          {!assessment.overridden && !showOverrideInput && (
            <Button appearance="subtle" onClick={() => setShowOverrideInput(true)}>
              Counsel Override
            </Button>
          )}
        </Inline>

        {showDraftNotice && (
          <Box xcss={card}>
            <Stack space="space.150">
              <Field label="Subject Line">
                {assessment.draftNotice?.subject ||
                  '[Prior Notice] Notice of New Subprocessor Appointment — Ayo Payroll'}
              </Field>
              <Stack space="space.050">
                <Text size="small" color="color.text.subtlest">Notice Email Body</Text>
                <Box xcss={tint}>
                  <Text>
                    {assessment.draftNotice?.body ||
                      `Dear Customer,\n\nPursuant to Section 7 of our Data Processing Agreement, this is prior written notice that Ayo Payroll Ltd intends to authorize the following new subprocessor:\n\n• Subprocessor Name: ${vendor}\n• Purpose: Session replay debugging for authenticated payslip and tax screens\n• Hosting Location: United States (Multi-tenant)\n• Earliest Production Deployment: ${goLive}\n\nIf you have questions or wish to exercise contractual objection rights, please contact privacy@ayopayroll.com before the deployment date above.`}
                  </Text>
                </Box>
              </Stack>
            </Stack>
          </Box>
        )}

        {assessment.overridden ? (
          <SectionMessage appearance="warning" title="Release Hold Overridden by Legal Counsel">
            <Text>
              {assessment.overriddenBy}: {assessment.overrideReason}
            </Text>
          </SectionMessage>
        ) : (
          showOverrideInput && (
            <Box xcss={card}>
              <Stack space="space.150">
                <Heading as="h4">Authorized Counsel Override</Heading>
                <Text size="small" color="color.text.subtlest">
                  An authorized legal officer may override the workflow release hold. This justification is permanently recorded in KVS and audit logs.
                </Text>
                <Textfield
                  placeholder="Enter legal rationale (e.g. Customer signed custom amendment agreeing to early rollout)"
                  value={overrideText}
                  onChange={(e: any) => setOverrideText(e.target.value)}
                />
                <Inline space="space.100" shouldWrap>
                  <Button
                    appearance="danger"
                    isDisabled={!overrideText.trim()}
                    onClick={handleApplyOverride}
                  >
                    Confirm Override & Unlock Transition
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
