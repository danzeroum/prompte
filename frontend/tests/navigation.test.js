import { jest } from '@jest/globals';
import { enhanceNavigation, copyText } from '../assets/js/common.js';

describe('enhanceNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <nav class="sidebar">
        <div class="sb-item active" data-t="a">A</div>
        <div class="sb-item" data-t="b">B</div>
        <a class="sb-item" href="/x">Link</a>
      </nav>
    `;
  });

  it('torna divs clicáveis acessíveis e ignora âncoras', () => {
    enhanceNavigation();
    const divs = document.querySelectorAll('div.sb-item');
    divs.forEach((d) => {
      expect(d.getAttribute('role')).toBe('button');
      expect(d.getAttribute('tabindex')).toBe('0');
    });
    const anchor = document.querySelector('a.sb-item');
    expect(anchor.getAttribute('role')).toBeNull();
    expect(anchor.getAttribute('tabindex')).toBeNull();
  });

  it('sincroniza aria-current com a classe active', () => {
    enhanceNavigation();
    expect(document.querySelector('[data-t="a"]').getAttribute('aria-current')).toBe('page');
    expect(document.querySelector('[data-t="b"]').getAttribute('aria-current')).toBeNull();
  });

  it('Enter dispara click em item não-nativo', () => {
    enhanceNavigation();
    const item = document.querySelector('[data-t="b"]');
    const spy = jest.fn();
    item.addEventListener('click', spy);
    item.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });
});

describe('copyText', () => {
  it('usa navigator.clipboard.writeText', async () => {
    const writeText = jest.fn().mockResolvedValue();
    Object.assign(navigator, { clipboard: { writeText } });
    const ok = await copyText('hello');
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(ok).toBe(true);
  });
});
