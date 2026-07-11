import { describe, it, expect } from 'vitest';
import { parseJSONResponse } from './groqClient.js';

describe('parseJSONResponse', () => {
  it('parses clean JSON', () => {
    expect(parseJSONResponse('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON wrapped in markdown fences', () => {
    const raw = '```json\n{"risk_level":"high"}\n```';
    expect(parseJSONResponse(raw)).toEqual({ risk_level: 'high' });
  });

  it('extracts JSON from surrounding prose', () => {
    const raw = 'Here is your plan: {"immediate_actions":[]} Hope this helps!';
    expect(parseJSONResponse(raw)).toEqual({ immediate_actions: [] });
  });
});
