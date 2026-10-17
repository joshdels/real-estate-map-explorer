import { beforeEach, describe, expect, it } from 'vitest';
import { MediaViewer } from '../src/media-viewer';

beforeEach(() => {
  document.body.innerHTML = `<div id="media-dialog" hidden><section><button id="close-media">Close</button><h2 id="media-title"></h2><div id="media-stage"></div><p id="media-caption"></p></section></div>`;
});

describe('MediaViewer gallery', () => {
  it('opens bundled images and moves forward and backward', () => {
    const viewer = new MediaViewer();
    viewer.open({ title: 'Sample gallery', type: 'gallery', urls: ['/images/one.png', '/images/two.png'], isExample: true });
    expect(document.querySelector<HTMLImageElement>('#media-stage img')?.src).toContain('/images/one.png');
    expect(document.querySelector('.gallery-count')?.textContent).toBe('1 / 2');
    viewer.nextGallery(1);
    expect(document.querySelector<HTMLImageElement>('#media-stage img')?.src).toContain('/images/two.png');
    viewer.nextGallery(-1);
    expect(document.querySelector('.gallery-count')?.textContent).toBe('1 / 2');
  });
});
