/** Empty Lexical editor state (single paragraph). */
export const EMPTY_EDITOR_STATE_JSON = JSON.stringify({
  root: {
    children: [
      {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
});

export function normalizeDocumentBodyJson(raw: string | null | undefined): string {
  if (raw == null || raw.trim() === '') {
    return EMPTY_EDITOR_STATE_JSON;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'root' in parsed &&
      (parsed as { root: unknown }).root
    ) {
      return raw;
    }
  } catch {
    // Legacy non-JSON body → empty editor
  }
  return EMPTY_EDITOR_STATE_JSON;
}
