import {
  savePrompt,
  listSavedPrompts,
  deleteSavedPrompt,
  updateSavedPrompt,
  listCollections,
  createCollection,
  renameCollection,
  deleteCollection,
} from '../assets/js/savedPrompts.js';

// Sem VITE_SUPABASE_* no ambiente de teste, isConfigured() é false → fallback
// localStorage. Cobrimos o caminho offline-first.
describe('savedPrompts — fallback localStorage', () => {
  beforeEach(() => localStorage.clear());

  it('rejeita conteúdo vazio', async () => {
    const res = await savePrompt({ template: 't', content: '   ' });
    expect(res.ok).toBe(false);
    expect(res.error).toBe('empty');
  });

  it('salva localmente e lista (mais recente primeiro)', async () => {
    expect((await savePrompt({ template: 'a', content: 'primeiro' })).where).toBe('local');
    await savePrompt({ template: 'b', content: 'segundo' });
    const list = await listSavedPrompts();
    expect(list).toHaveLength(2);
    expect(list[0].content).toBe('segundo');
    expect(list[1].template).toBe('a');
  });

  it('remove pelo ts no fallback local', async () => {
    await savePrompt({ template: 'a', content: 'x' });
    const [item] = await listSavedPrompts();
    await deleteSavedPrompt(item.ts);
    expect(await listSavedPrompts()).toHaveLength(0);
  });

  it('salva com campos novos (collection, tags, favorite)', async () => {
    await savePrompt({ template: 'a', content: 'texto', collection: 'col-1', tags: ['ts', 'refactor'], favorite: true });
    const [item] = await listSavedPrompts();
    expect(item.collection).toBe('col-1');
    expect(item.tags).toEqual(['ts', 'refactor']);
    expect(item.favorite).toBe(true);
  });

  it('migração defensiva: itens antigos recebem defaults', async () => {
    // Simula dado antigo sem campos novos
    localStorage.setItem('pe:saved-prompts', JSON.stringify([
      { template: 'old', title: 'Old', content: 'texto antigo', ts: '2024-01-01T00:00:00Z' }
    ]));
    const [item] = await listSavedPrompts();
    expect(item.collection).toBeNull();
    expect(item.tags).toEqual([]);
    expect(item.favorite).toBe(false);
  });

  it('updateSavedPrompt atualiza campos por ts', async () => {
    await savePrompt({ template: 'a', content: 'texto' });
    const [item] = await listSavedPrompts();
    await updateSavedPrompt(item.ts, { favorite: true, title: 'Novo título' });
    const [updated] = await listSavedPrompts();
    expect(updated.favorite).toBe(true);
    expect(updated.title).toBe('Novo título');
  });

  it('updateSavedPrompt retorna false para ts inexistente', async () => {
    const ok = await updateSavedPrompt('ts-inexistente', { favorite: true });
    expect(ok).toBe(false);
  });
});

describe('collections — fallback localStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('cria e lista coleções', async () => {
    const res = await createCollection('Minha Coleção');
    expect(res.ok).toBe(true);
    expect(res.id).toBeTruthy();
    const cols = await listCollections();
    expect(cols).toHaveLength(1);
    expect(cols[0].name).toBe('Minha Coleção');
  });

  it('rejeita nome vazio', async () => {
    const res = await createCollection('   ');
    expect(res.ok).toBe(false);
  });

  it('renomeia coleção', async () => {
    const { id } = await createCollection('Original');
    await renameCollection(id, 'Renomeada');
    const cols = await listCollections();
    expect(cols[0].name).toBe('Renomeada');
  });

  it('exclui coleção e prompts viram collection:null', async () => {
    const { id } = await createCollection('Para excluir');
    await savePrompt({ template: 'a', content: 'texto', collection: id });
    await deleteCollection(id);
    const cols = await listCollections();
    expect(cols).toHaveLength(0);
    const prompts = await listSavedPrompts();
    expect(prompts[0].collection).toBeNull();
  });
});
