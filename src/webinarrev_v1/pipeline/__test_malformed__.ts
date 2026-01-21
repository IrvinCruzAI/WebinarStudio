/**
 * Test utility to demonstrate malformed artifact handling
 * This file is for demonstration purposes only
 * Run in dev mode to see console warnings
 */

import { scanPlaceholders } from './placeholderScanner';
import type { DeliverableId } from '../contracts';

export function testMalformedArtifactHandling() {
  console.log('=== Testing Malformed Artifact Handling ===\n');

  const testCases = [
    {
      name: 'Valid artifact',
      artifacts: new Map<DeliverableId, { content: unknown; artifact_id: string }>([
        ['WR1', {
          content: { parsed_intake: { client_name: 'Test {{CLIENT}}' } },
          artifact_id: 'project123:run456:WR1:v1'
        }]
      ]),
      expectedMalformed: 0,
    },
    {
      name: 'Artifact with "undefined" in ID',
      artifacts: new Map<DeliverableId, { content: unknown; artifact_id: string }>([
        ['WR1', {
          content: { parsed_intake: { client_name: 'Test' } },
          artifact_id: 'project123:undefined:WR1:v1'
        }]
      ]),
      expectedMalformed: 1,
    },
    {
      name: 'Artifact with "null" in ID',
      artifacts: new Map<DeliverableId, { content: unknown; artifact_id: string }>([
        ['WR2', {
          content: { blocks: [] },
          artifact_id: 'project123:null:WR2:v1'
        }]
      ]),
      expectedMalformed: 1,
    },
    {
      name: 'Artifact with invalid format (only 3 parts)',
      artifacts: new Map<DeliverableId, { content: unknown; artifact_id: string }>([
        ['WR3', {
          content: { hero_headline: 'Test' },
          artifact_id: 'project123:run456:WR3'
        }]
      ]),
      expectedMalformed: 1,
    },
    {
      name: 'Artifact with invalid deliverable ID',
      artifacts: new Map<DeliverableId, { content: unknown; artifact_id: string }>([
        ['WR4', {
          content: { sequences: [] },
          artifact_id: 'project123:run456:INVALID:v1'
        }]
      ]),
      expectedMalformed: 1,
    },
    {
      name: 'Mixed: 2 valid, 1 malformed',
      artifacts: new Map<DeliverableId, { content: unknown; artifact_id: string }>([
        ['WR1', {
          content: { parsed_intake: { client_name: 'Test {{NAME}}' } },
          artifact_id: 'project123:run456:WR1:v1'
        }],
        ['WR2', {
          content: { blocks: [] },
          artifact_id: 'project123:undefined:WR2:v1'
        }],
        ['WR3', {
          content: { hero_headline: 'Hello [TBD]' },
          artifact_id: 'project123:run456:WR3:v1'
        }]
      ]),
      expectedMalformed: 1,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\nTest: ${testCase.name}`);
    console.log('─'.repeat(50));

    try {
      const result = scanPlaceholders(testCase.artifacts);
      console.log(`✓ Scan completed successfully`);
      console.log(`  Total placeholders found: ${result.total_count}`);
      console.log(`  Critical placeholders: ${result.critical_count}`);
      console.log(`  Valid locations scanned: ${result.locations.length}`);
    } catch (error) {
      console.error(`✗ Scan failed:`, error);
    }
  }

  console.log('\n=== Test Complete ===\n');
}

if (import.meta.env.MODE === 'development') {
  console.log('Malformed artifact test utility loaded.');
  console.log('Call testMalformedArtifactHandling() in dev tools to run tests.');
  (window as any).__testMalformedArtifacts = testMalformedArtifactHandling;
}
