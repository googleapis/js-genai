/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {GoogleGenAI} from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function genericOperationTriggers() {
  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  // 1. Create a trigger pointing to the agent
  console.log('Creating trigger...');
  const myTrigger = await ai.triggers.create({
    schedule: '0 9 * * *',
    time_zone: 'America/Argentina/Buenos_Aires',
    display_name: 'issue-solver',
    interaction: {
      agent: 'antigravity-preview-05-2026',
      input: 'List all files under /workspace and describe what you find.',
      environment: {
        type: 'remote',
        sources: [
          {
            type: 'repository',
            source: 'https://github.com/octocat/Spoon-Knife',
            target: '/workspace/spoon-knife',
          },
        ],
      },
    },
  });

  if (myTrigger == null || myTrigger.id == null) {
    throw new Error('Failed to create trigger');
  }
  const triggerId = myTrigger.id;
  console.log(`Trigger created successfully! ID: ${triggerId}`);

  // 3. Get the created trigger and verify fields
  console.log('Getting trigger by ID:', triggerId);
  const fetchedTrigger = await ai.triggers.get(triggerId);
  console.log('Got trigger:', fetchedTrigger);

  // 4. List all triggers and verify presence of the created one
  console.log('Listing triggers:');
  const triggerListResponse = await ai.triggers.list();
  for (const trigger of triggerListResponse.triggers || []) {
    console.log('Trigger:', trigger);
  }
  const found = triggerListResponse.triggers!.some((t) => t.id === triggerId);
  if (!found)
    throw new Error('Created trigger not found in ListTriggers response');

  // 5. Update the trigger (Flip status to paused and then back to active)
  console.log('Pausing trigger...');
  const pausedTrigger = await ai.triggers.update(triggerId, {status: 'paused'});
  console.log('Paused trigger status:', pausedTrigger.status);
  if (pausedTrigger.status !== 'paused')
    throw new Error('Failed to update status to paused');

  console.log('Resuming trigger...');
  const resumedTrigger = await ai.triggers.update(triggerId, {
    status: 'active',
  });
  console.log('Resumed trigger status:', resumedTrigger.status);
  if (resumedTrigger.status !== 'active')
    throw new Error('Failed to update status to active');

  // 6. Run the trigger immediately (creates a trigger execution)
  console.log('Running trigger immediately...');
  const executionResponse = await ai.triggers.run(triggerId);
  console.log('Trigger execution details:', executionResponse);

  // 7. List executions for this trigger and verify last execution succeeded or
  // is in progress
  console.log('Listing executions for trigger:', triggerId);
  const listExecutionsResponse = await ai.triggers.listExecutions(triggerId, {
    pageSize: 5,
  });
  const executions = listExecutionsResponse.trigger_executions || [];
  console.log('Trigger executions:', executions);
  if (executions.length === 0)
    throw new Error('No executions found after manual run');
  // 8. Delete the trigger
  console.log('Deleting trigger:', triggerId);
  await ai.triggers.delete(triggerId);
  console.log('Trigger deleted successfully');
}

async function main() {
  await genericOperationTriggers().catch((e) =>
    console.error('Error in triggers operations:', e),
  );
}

main();
