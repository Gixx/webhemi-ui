import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useState } from 'react';
import { $getNodeByKey } from 'lexical';
import { Button } from '../../../chrome';
import { AccordionSettingsDialog } from '../AccordionSettingsDialog';
import { $isAccordionNode, type AccordionItem } from './AccordionNode';

export type AccordionPlaceholderProps = {
  nodeKey: string;
  blockId: string;
  items: AccordionItem[];
};

/** Canvas chip for accordion blocks — config opens in a separate dialog. */
export function AccordionPlaceholder({
  nodeKey,
  blockId,
  items,
}: AccordionPlaceholderProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);

  const applyItems = useCallback(
    (next: AccordionItem[]) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isAccordionNode(node)) {
          node.setItems(next);
        }
      });
      setOpen(false);
    },
    [editor, nodeKey],
  );

  const count = items.length;
  const summary =
    count === 0
      ? 'No sections'
      : count === 1
        ? '1 section'
        : `${count} sections`;

  return (
    <>
      <div className="wh-doc-accordion-chip">
        <span className="wh-doc-accordion-chip__label">Accordion</span>
        <span className="wh-doc-accordion-chip__meta">
          {summary}
          {blockId ? ` · ${blockId}` : ''}
        </span>
        <Button type="button" onClick={() => setOpen(true)}>
          Edit…
        </Button>
      </div>
      {open ? (
        <AccordionSettingsDialog
          items={items}
          onCancel={() => setOpen(false)}
          onConfirm={applyItems}
        />
      ) : null}
    </>
  );
}
