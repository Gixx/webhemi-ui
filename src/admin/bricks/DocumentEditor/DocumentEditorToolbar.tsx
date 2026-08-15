import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, type HeadingTagType } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { Button, FieldRow } from '../../chrome';
import { $createAccordionNode } from './nodes/AccordionNode';

/** Compact toolbar for document editing under Admin theme. */
export function DocumentEditorToolbar() {
  const [editor] = useLexicalComposerContext();

  const formatHeading = (tag: HeadingTagType | 'paragraph') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      if (tag === 'paragraph') {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }
      $setBlocksType(selection, () => $createHeadingNode(tag));
    });
  };

  const insertAccordion = () => {
    editor.update(() => {
      const selection = $getSelection();
      const node = $createAccordionNode();
      if ($isRangeSelection(selection)) {
        selection.insertNodes([node]);
      }
    });
  };

  const insertLink = () => {
    const url = window.prompt('Link URL:', 'https://');
    if (url == null) {
      return;
    }
    const trimmed = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, trimmed === '' ? null : trimmed);
  };

  return (
    <FieldRow className="wh-doc-toolbar">
      <Button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        Bold
      </Button>
      <Button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        Italic
      </Button>
      <Button type="button" onClick={() => formatHeading('paragraph')}>
        Body
      </Button>
      <Button type="button" onClick={() => formatHeading('h2')}>
        H2
      </Button>
      <Button type="button" onClick={() => formatHeading('h3')}>
        H3
      </Button>
      <Button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      >
        List
      </Button>
      <Button
        type="button"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      >
        Numbered
      </Button>
      <Button type="button" onClick={insertLink}>
        Link
      </Button>
      <Button type="button" onClick={insertAccordion}>
        Accordion
      </Button>
      <Button
        type="button"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        Undo
      </Button>
      <Button
        type="button"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        Redo
      </Button>
    </FieldRow>
  );
}
