import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { type EditorState } from 'lexical';
import { useMemo } from 'react';
import { AccordionNode } from './nodes/AccordionNode';
import { DocumentEditorToolbar } from './DocumentEditorToolbar';
import { normalizeDocumentBodyJson } from './emptyEditorState';
import './document-editor.css';

export type DocumentEditorCanvasProps = {
  /** Lexical SerializedEditorState JSON string. */
  initialJson: string | null;
  /** Bump to remount composer after external reload. */
  editorKey?: string | number;
  onChangeJson?: (json: string) => void;
  readOnly?: boolean;
};

function onError(error: Error): void {
  console.error(error);
}

/**
 * Lexical rich-text canvas + toolbar (Admin theme). Custom blocks use DecoratorNodes.
 */
export function DocumentEditorCanvas({
  initialJson,
  editorKey = 'doc',
  onChangeJson,
  readOnly = false,
}: DocumentEditorCanvasProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: 'WhDocumentEditor',
      theme: {
        paragraph: 'wh-doc-p',
        heading: {
          h2: 'wh-doc-h2',
          h3: 'wh-doc-h3',
        },
        list: {
          ul: 'wh-doc-ul',
          ol: 'wh-doc-ol',
          listitem: 'wh-doc-li',
        },
        link: 'wh-doc-link',
        text: {
          bold: 'wh-doc-bold',
          italic: 'wh-doc-italic',
        },
      },
      editable: !readOnly,
      onError,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AccordionNode,
      ],
      editorState: normalizeDocumentBodyJson(initialJson),
    }),
    // Remount via key when initial content identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- editorKey drives remount
    [editorKey, readOnly],
  );

  const handleChange = (state: EditorState) => {
    onChangeJson?.(JSON.stringify(state.toJSON()));
  };

  return (
    <div className="wh-doc-editor">
      <LexicalComposer key={String(editorKey)} initialConfig={initialConfig}>
        {readOnly ? null : <DocumentEditorToolbar />}
        <div className="wh-doc-editor__canvas sunken-panel">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="wh-doc-editor__content"
                aria-placeholder="Start writing…"
                placeholder={
                  <div className="wh-doc-editor__placeholder">Start writing…</div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        {onChangeJson ? <OnChangePlugin onChange={handleChange} /> : null}
      </LexicalComposer>
    </div>
  );
}
