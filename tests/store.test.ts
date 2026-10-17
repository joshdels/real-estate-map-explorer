import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyStore } from '../src/store';
import type { DataRepository, Dataset } from '../src/types';

const seed: Dataset = { metadata: { name: 'test', version: 1, isSample: true, notice: 'sample' }, utilities: {}, destinations: [], routes: [], properties: [] };

beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe('PropertyStore', () => {
  it('persists mutations through the configured repository', async () => {
    const repository: DataRepository = { source: 'local', load: vi.fn(async () => structuredClone(seed)), save: vi.fn(async () => undefined) };
    const store = new PropertyStore(repository); await store.initialize(); await store.saveUtilities({ Water: ['Municipal'] });
    expect(repository.save).toHaveBeenCalledOnce(); expect(store.snapshot().utilities.Water).toEqual(['Municipal']);
  });

  it('falls back to bundled JSON when the primary load fails', async () => {
    const repository: DataRepository = { source: 'supabase', load: vi.fn(async () => { throw new Error('offline'); }), save: vi.fn(async () => undefined) };
    const store = new PropertyStore(repository); await store.initialize();
    expect(store.source).toBe('local'); expect(store.snapshot().properties.length).toBeGreaterThan(0);
  });

  it('falls back to local persistence when a remote save fails', async () => {
    const repository: DataRepository = { source: 'supabase', load: vi.fn(async () => structuredClone(seed)), save: vi.fn(async () => { throw new Error('write rejected'); }) };
    const store = new PropertyStore(repository); await store.initialize(); await store.saveUtilities({ Internet: ['Sample fiber'] });
    expect(store.source).toBe('local'); expect(JSON.parse(localStorage.getItem('real-estate-map-explorer.data.v6') ?? '{}').utilities.Internet).toEqual(['Sample fiber']);
  });
});
