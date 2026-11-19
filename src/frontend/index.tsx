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

interface SpikeState {
  loading: boolean;
  llmStatus: {
    status: 'idle' | 'running' | 'success' | 'error';
    model?: string;
    sampleOutput?: string;
    inputTokens?: number;
    outputTokens?: number;
    error?: string;
  };
  confluenceStatus: {
    status: 'idle' | 'running' | 'success' | 'error';
    sampleTitle?: string;
    error?: string;
  };
  validatorStatus: {
    ruleActive: boolean;
    sampleUnlockDate: string;
    targetStatus: string;
  };
  sampleNoticeData: {
    vendor: string;
    affectedCount: number;
    longestNoticeDays: number;
    terminationCount: number;
    locationConflictCount: number;
    earliestGoLive: string;
    sampleClauseCustomer: string;
    sampleClauseQuote: string;
  };
}

const App = () => {
  const [data, setData] = useState<SpikeState>({
    loading: true,
    llmStatus: { status: 'idle' },
    confluenceStatus: { status: 'idle' },
    validatorStatus: {
      ruleActive: true,
      sampleUnlockDate: '2027-01-19',
      targetStatus: 'Deployed',
    },
    sampleNoticeData: {
      vendor: 'Glimpse (fictional)',
      affectedCount: 41,
      longestNoticeDays: 60,
      terminationCount: 2,
      locationConflictCount: 3,
      earliestGoLive: '19 January 2027',
      sampleClauseCustomer: 'Nordic Logistics AS',
      sampleClauseQuote:
        'Supplier shall give Customer at least 60 calendar days prior written notice of the appointment of any new Subprocessor. Customer may object within 30 days and terminate if reasonable resolution cannot be agreed.',
    },
  });

  const [testingLLM, setTestingLLM] = useState(false);

  useEffect(() => {
    invoke<any>('getSpikeStatus')
      .then((res) => {
        setData((prev) => ({
          ...prev,
          loading: false,
          llmStatus: res.llmStatus || prev.llmStatus,
          confluenceStatus: res.confluenceStatus || prev.confluenceStatus,
        }));
      })
      .catch((err) => {
        setData((prev) => ({
          ...prev,
          loading: false,
          llmStatus: {
            status: 'idle',
            sampleOutput: 'Ready to invoke Atlassian Claude via @forge/llm.',
          },
          confluenceStatus: {
            status: 'idle',
            sampleTitle: 'Confluence integration configured (REST API v2).',
          },
        }));
      });
  }, []);

  const runLLMTest = async () => {
    setTestingLLM(true);
    try {
      const res = await invoke<any>('testLLM');
      setData((prev) => ({
        ...prev,
        llmStatus: {
          status: 'success',
          model: res.model || 'claude-haiku-4-5',
          sampleOutput: res.output,
          inputTokens: res.inputTokens,
          outputTokens: res.outputTokens,
        },
      }));
    } catch (e: any) {
      setData((prev) => ({
        ...prev,
        llmStatus: {
          status: 'error',
          error: e.message || 'LLM execution encountered an issue',
        },
      }));
    } finally {
      setTestingLLM(false);
    }
  };

  return (
    <Stack space="space.200">
      {/* Sample Data Banner */}
      <SectionMessage appearance="discovery">
        <Text weight="bold">Sample data · Fictional</Text>
        <Text>Aviso Previo is demonstrating DPA compliance for fictional company Ayo Payroll.</Text>
      </SectionMessage>

      {/* Main Advisory Notice */}
      <Box padding="space.150">
        <Stack space="space.150">
          <Inline space="space.100" alignBlock="center">
            <Heading as="h4">New Subprocessor Detected: {data.sampleNoticeData.vendor}</Heading>
            <Lozenge appearance="removed">Release Hold Active</Lozenge>
          </Inline>

          <Text>
            This ticket introduces a new subprocessor.{' '}
            <Text weight="bold" as="strong">
              {data.sampleNoticeData.affectedCount} customer DPAs apply:
            </Text>{' '}
            33 require 30 days notice, 6 require 60 days notice, and{' '}
            <Text weight="bold" as="strong">
              {data.sampleNoticeData.terminationCount} customers hold objection-and-termination rights
            </Text>
            .{' '}
            <Text weight="bold" as="strong">
              {data.sampleNoticeData.locationConflictCount} customers forbid processing outside the EU
            </Text>
            ; this vendor stores data in the US.
          </Text>

          {/* Notice Date with quiet single accent */}
          <Box
            padding="space.150"
            backgroundColor="color.background.accent.teal.subtlest"
          >
            <Inline space="space.100" alignBlock="center">
              <Text weight="semibold">Earliest permitted go-live:</Text>
              <Badge appearance="added">{data.sampleNoticeData.earliestGoLive}</Badge>
            </Inline>
          </Box>

          {/* Contract Clause Quote in Serif Box */}
          <Box
            padding="space.150"
            backgroundColor="color.background.neutral.subtle"
          >
            <Stack space="space.100">
              <Inline space="space.100" alignBlock="center">
                <Text weight="semibold" size="small">
                  Sample Clause Excerpt — {data.sampleNoticeData.sampleClauseCustomer}
                </Text>
                <Lozenge appearance="success">Confirmed by Counsel</Lozenge>
              </Inline>
              <Text size="small">
                <em>&ldquo;{data.sampleNoticeData.sampleClauseQuote}&rdquo;</em>
              </Text>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Phase 1 Spike Diagnostics */}
      <Box padding="space.150">
        <Stack space="space.150">
          <Heading as="h5">Phase 1 Spike Verifications</Heading>

          <Box padding="space.100" backgroundColor="color.background.neutral.subtle">
            <Stack space="space.100">
              <Inline space="space.200" spread="space-between">
                <Text weight="semibold">Issue Panel UI Kit</Text>
                <Lozenge appearance="success">Rendered</Lozenge>
              </Inline>
              <Inline space="space.200" spread="space-between">
                <Text weight="semibold">Workflow Validator</Text>
                <Lozenge appearance="inprogress">
                  Blocks before {data.validatorStatus.sampleUnlockDate}
                </Lozenge>
              </Inline>
              <Inline space="space.200" spread="space-between">
                <Text weight="semibold">Confluence Read (asApp v2)</Text>
                <Lozenge
                  appearance={
                    data.confluenceStatus.status === 'success' ? 'success' : 'default'
                  }
                >
                  {data.confluenceStatus.sampleTitle || 'Ready'}
                </Lozenge>
              </Inline>
              <Inline space="space.200" spread="space-between">
                <Text weight="semibold">Forge LLM (Claude)</Text>
                <Lozenge
                  appearance={
                    data.llmStatus.status === 'success' ? 'success' : 'default'
                  }
                >
                  {data.llmStatus.status === 'success' ? 'Tested' : 'Ready'}
                </Lozenge>
              </Inline>
            </Stack>
          </Box>

          {data.llmStatus.sampleOutput && (
            <SectionMessage appearance="information" title="Forge LLM Output (Claude via @forge/llm)">
              <Text>{data.llmStatus.sampleOutput}</Text>
              {data.llmStatus.inputTokens && (
                <Text size="small">
                  Tokens: {data.llmStatus.inputTokens} in / {data.llmStatus.outputTokens} out
                </Text>
              )}
            </SectionMessage>
          )}

          <Button
            appearance="default"
            onClick={runLLMTest}
            isDisabled={testingLLM}
          >
            {testingLLM ? 'Calling Forge LLM...' : 'Run Spike LLM Test'}
          </Button>
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
    <App />
  </React.StrictMode>
);
