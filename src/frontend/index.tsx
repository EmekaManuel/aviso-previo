import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Text,
  Heading,
  SectionMessage,
  Box,
  Stack,
  Badge,
  Lozenge,
  Button,
  Inline,
} from '@forge/react';
import { invoke } from '@forge/bridge';

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

  const handleApplyOverride = async () => {
    if (!assessment || !overrideText.trim()) return;
    try {
      await invoke('overrideIssueDecision', {
        issueKey: assessment.issueKey,
        overrideReason: overrideText,
      });
      setAssessment((prev) =>
        prev
          ? {
              ...prev,
              overridden: true,
              overriddenBy: 'Engineer / Counsel',
              overrideReason: overrideText,
            }
          : null
      );
      setShowOverrideInput(false);
    } catch (e) {
      console.error('Override error:', e);
    }
  };

  if (loading) {
    return <Text>Analyzing contract commitments...</Text>;
  }

  if (!assessment) {
    return null;
  }

  // State 1: EXISTING VENDOR NO CHANGE or UNRELATED (Quiet state)
  if (
    assessment.classification === 'EXISTING_VENDOR_NO_CHANGE' ||
    assessment.classification === 'UNRELATED'
  ) {
    return (
      <Stack space="space.150">
        <SectionMessage appearance="discovery">
          <Text weight="bold">Sample data · Fictional</Text>
          <Text>Aviso Previo subprocessor compliance monitor for Ayo Payroll.</Text>
        </SectionMessage>
        <Box padding="space.100" backgroundColor="color.background.neutral.subtle">
          <Inline space="space.100" alignBlock="center">
            <Lozenge appearance="success">Approved Subprocessor Status</Lozenge>
            <Text size="small">
              {assessment.classification === 'EXISTING_VENDOR_NO_CHANGE'
                ? `Routine maintenance for approved vendor ${assessment.vendor || 'existing vendor'}. No new customer notice obligations triggered.`
                : 'No third-party data processing changes detected on this ticket.'}
            </Text>
          </Inline>
        </Box>
        <Text size="small" color="color.text.subtlest">
          Aviso Previo summarizes your contracts. It is not legal advice.
        </Text>
      </Stack>
    );
  }

  // State 2: NO CUSTOMER DATA (e.g. ENG-160 sandbox testing)
  if (assessment.classification === 'NO_CUSTOMER_DATA') {
    return (
      <Stack space="space.150">
        <SectionMessage appearance="discovery">
          <Text weight="bold">Sample data · Fictional</Text>
          <Text>Aviso Previo subprocessor compliance monitor for Ayo Payroll.</Text>
        </SectionMessage>

        <SectionMessage
          appearance={confirmedNoData ? 'success' : 'information'}
          title={`Third-Party Tool (${assessment.vendor || 'Third Party'}) with No Customer Data`}
        >
          <Text>
            This ticket mentions vendor <strong>{assessment.vendor || 'third party'}</strong> in a staging or synthetic data context. No customer personal data is processed.
          </Text>
          {confirmedNoData ? (
            <Lozenge appearance="success">Confirmed: Synthetic Data Only</Lozenge>
          ) : (
            <Box padding="space.050">
              <Button appearance="primary" onClick={handleConfirmSynthetic}>
                Confirm: Synthetic Data Only (No Notice Required)
              </Button>
            </Box>
          )}
        </SectionMessage>

        <Text size="small" color="color.text.subtlest">
          Aviso Previo summarizes your contracts. It is not legal advice.
        </Text>
      </Stack>
    );
  }

  // State 3: LOCATION CHANGE (e.g. ENG-156 EU -> US)
  if (assessment.classification === 'LOCATION_CHANGE') {
    return (
      <Stack space="space.200">
        <SectionMessage appearance="discovery">
          <Text weight="bold">Sample data · Fictional</Text>
          <Text>Aviso Previo subprocessor compliance monitor for Ayo Payroll.</Text>
        </SectionMessage>

        <Box padding="space.150">
          <Stack space="space.150">
            <Inline space="space.100" alignBlock="center">
              <Heading as="h4">Location Conflict: {assessment.vendor || 'RelayPost'}</Heading>
              <Lozenge appearance="removed">Location Restriction Hold</Lozenge>
            </Inline>

            <Text>
              Existing vendor <strong>{assessment.vendor || 'RelayPost'}</strong> is changing data processing location from the EU to the US.{' '}
              <Text weight="bold" as="strong">
                3 customer DPAs forbid processing outside the EU/UK:
              </Text>
            </Text>

            <Box padding="space.100" backgroundColor="color.background.neutral.subtle">
              <Stack space="space.050">
                <Text size="small">• Nordic Logistics AS (Norway · EEA exclusive)</Text>
                <Text size="small">• Bavaria HealthTech GmbH (Germany · EU exclusive)</Text>
                <Text size="small">• Stockholm Retail Group AB (Sweden · EEA exclusive)</Text>
              </Stack>
            </Box>

            <Box
              padding="space.150"
              backgroundColor="color.background.accent.teal.subtlest"
            >
              <Inline space="space.100" alignBlock="center">
                <Text weight="semibold">Earliest permitted go-live:</Text>
                <Badge appearance="added">{assessment.earliestGoLiveDate || '19 January 2027'}</Badge>
              </Inline>
            </Box>
          </Stack>
        </Box>

        <Text size="small" color="color.text.subtlest">
          Aviso Previo summarizes your contracts. It is not legal advice.
        </Text>
      </Stack>
    );
  }

  // State 4: NEW SUBPROCESSOR (e.g. ENG-142 Glimpse session replay)
  return (
    <Stack space="space.200">
      {/* Sample Data Banner */}
      <SectionMessage appearance="discovery">
        <Text weight="bold">Sample data · Fictional</Text>
        <Text>Aviso Previo subprocessor compliance monitor for Ayo Payroll.</Text>
      </SectionMessage>

      {/* Main Advisory Box */}
      <Box padding="space.150">
        <Stack space="space.150">
          <Inline space="space.100" alignBlock="center">
            <Heading as="h4">New Subprocessor Detected: {assessment.vendor || 'Glimpse'}</Heading>
            {assessment.overridden ? (
              <Lozenge appearance="moved">Overridden by Counsel</Lozenge>
            ) : (
              <Lozenge appearance="removed">Release Hold Active</Lozenge>
            )}
          </Inline>

          <Text>
            This ticket introduces a new subprocessor.{' '}
            <Text weight="bold" as="strong">
              {assessment.affectedCustomers || 41} customer DPAs apply:
            </Text>{' '}
            33 require 30 days notice, 6 require 60 days notice, and{' '}
            <Text weight="bold" as="strong">
              {assessment.terminationRightsCount || 2} customers hold objection-and-termination rights
            </Text>
            .{' '}
            <Text weight="bold" as="strong">
              {assessment.locationConflictsCount || 3} customers forbid processing outside the EU
            </Text>
            ; this vendor stores data in the US.
          </Text>

          {/* Quiet accent single date box */}
          <Box
            padding="space.150"
            backgroundColor="color.background.accent.teal.subtlest"
          >
            <Inline space="space.100" spread="space-between" alignBlock="center">
              <Inline space="space.100" alignBlock="center">
                <Text weight="semibold">Earliest permitted go-live:</Text>
                <Badge appearance="added">{assessment.earliestGoLiveDate || '19 January 2027'}</Badge>
              </Inline>
              {assessment.legalRequestKey && (
                <Text size="small">
                  Privacy Request: <strong>{assessment.legalRequestKey}</strong>
                </Text>
              )}
            </Inline>
          </Box>

          {/* Clause quote excerpt in serif box */}
          <Box
            padding="space.150"
            backgroundColor="color.background.neutral.subtle"
          >
            <Stack space="space.100">
              <Inline space="space.100" alignBlock="center">
                <Text weight="semibold" size="small">
                  Sample Clause Excerpt — {assessment.sampleClauseCustomer || 'Nordic Logistics AS'}
                </Text>
                <Lozenge appearance="success">Confirmed by Counsel</Lozenge>
              </Inline>
              <Text size="small">
                <em>
                  &ldquo;
                  {assessment.sampleClauseQuote ||
                    'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days and terminate if reasonable resolution cannot be agreed.'}
                  &rdquo;
                </em>
              </Text>
            </Stack>
          </Box>

          {/* Human Decision Override Control */}
          {assessment.overridden ? (
            <SectionMessage appearance="warning" title="Release Hold Overridden">
              <Text>
                Overridden by: {assessment.overriddenBy}. Reason: {assessment.overrideReason}
              </Text>
            </SectionMessage>
          ) : showOverrideInput ? (
            <Box padding="space.100" backgroundColor="color.background.neutral.subtle">
              <Stack space="space.100">
                <Text weight="semibold" size="small">Enter override justification:</Text>
                <Inline space="space.100">
                  <Button
                    appearance="danger"
                    onClick={() => {
                      setOverrideText('Vendor agreed to EU data residency addendum.');
                      handleApplyOverride();
                    }}
                  >
                    Apply Legal Exemption Override
                  </Button>
                  <Button appearance="subtle" onClick={() => setShowOverrideInput(false)}>
                    Cancel
                  </Button>
                </Inline>
              </Stack>
            </Box>
          ) : (
            <Inline space="space.100">
              <Button appearance="subtle" onClick={() => setShowOverrideInput(true)}>
                Override Decision
              </Button>
            </Inline>
          )}
        </Stack>
      </Box>

      {/* Mandatory Legal Disclaimer */}
      <Text size="small" color="color.text.subtlest">
        Aviso Previo summarizes your contracts. It is not legal advice.
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <IssuePanelApp />
  </React.StrictMode>
);
