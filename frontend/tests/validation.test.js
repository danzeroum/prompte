import { validateRequired, showToast } from '../assets/js/validation.js';

describe('validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detecta campos vazios e marca como inválidos', () => {
    document.body.innerHTML = `
      <input id="a" value="ok">
      <input id="b" value="">
    `;
    const { valid, missing } = validateRequired(['#a', '#b']);
    expect(valid).toBe(false);
    expect(missing).toHaveLength(1);
    expect(document.querySelector('#b').classList.contains('pe-invalid')).toBe(true);
    expect(document.querySelector('#a').classList.contains('pe-invalid')).toBe(false);
  });

  it('considera válido quando todos preenchidos', () => {
    document.body.innerHTML = `<input id="a" value="x"><input id="b" value="y">`;
    expect(validateRequired(['#a', '#b']).valid).toBe(true);
  });

  it('showToast adiciona um toast ao DOM', () => {
    showToast('Título', 'Corpo', 'success', 0);
    const toast = document.querySelector('.pe-toast.pe-toast-success');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Título');
  });
});
