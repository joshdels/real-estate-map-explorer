import { describe, expect, it } from 'vitest';
import { parseImageUrls, validHttpUrl, validMediaUrl, validateDataset } from '../src/validation';

const dataset = { metadata: { name: 'test', version: 1, isSample: true, notice: 'sample' }, utilities: {}, destinations: [], routes: [], properties: [{ id: 'p1', title: 'Sample', address: 'Example', coordinates: [1, 2], polygon: [[1, 2], [1, 3], [2, 3]], area: '1 sqm', price: 1, status: 'Available', utilities: {}, media: { images: ['https://example.com/a.jpg', 'javascript:alert(1)'] } }] };

describe('dataset validation', () => {
  it('accepts valid coordinates and removes unsafe media URLs', () => { const result = validateDataset(dataset); expect(result.properties[0].media?.images).toEqual(['https://example.com/a.jpg']); });
  it('rejects an invalid property boundary', () => { expect(() => validateDataset({ ...dataset, properties: [{ ...dataset.properties[0], polygon: [[200, 2], [1, 3], [2, 3]] }] })).toThrow(/Invalid property/); });
  it('parses newline and comma separated gallery URLs', () => { expect(parseImageUrls('https://example.com/1.jpg\ninvalid, https://example.com/2.jpg')).toHaveLength(2); });
  it('permits only HTTP(S) URLs', () => { expect(validHttpUrl('https://example.com')).toBe(true); expect(validHttpUrl('data:text/html,test')).toBe(false); });
  it('permits bundled root-relative media without permitting script URLs', () => { expect(validMediaUrl('/images/sample.png')).toBe(true); expect(validMediaUrl('javascript:alert(1)')).toBe(false); });
});
