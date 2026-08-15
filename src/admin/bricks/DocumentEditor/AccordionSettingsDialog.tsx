import { useId, useState } from 'react';
import { Button, FieldRow, TextBox, TitleBarControl, TitleBarControls } from '../../chrome';
import { DesktopModal } from '../DesktopModal';
import { DialogWindow } from '../DialogWindow';
import type { AccordionItem } from './nodes/AccordionNode';

export type AccordionSettingsDialogProps = {
  items: AccordionItem[];
  onConfirm: (items: AccordionItem[]) => void;
  onCancel: () => void;
};

function newItemId(): string {
  return `acc-${Math.random().toString(36).slice(2, 10)}`;
}

/** Configure accordion sections (plain-text MVP). */
export function AccordionSettingsDialog({
  items: initial,
  onConfirm,
  onCancel,
}: AccordionSettingsDialogProps) {
  const [items, setItems] = useState(() =>
    initial.map((item) => ({ ...item })),
  );
  const baseId = useId();

  const updateItem = (id: string, patch: Partial<AccordionItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  return (
    <DesktopModal>
      <DialogWindow
        title="Accordion"
        titleIcon="folder"
        titleBarControls={
          <TitleBarControls>
            <TitleBarControl action="Close" onClick={onCancel} />
          </TitleBarControls>
        }
        actions={
          <>
            <Button
              type="button"
              isDefault
              onClick={() => onConfirm(items)}
            >
              OK
            </Button>
            <Button type="button" onClick={onCancel}>
              Cancel
            </Button>
          </>
        }
      >
        <p style={{ marginTop: 0 }}>
          Sections shown as a placeholder in the editor. Public accordion
          rendering comes later.
        </p>
        {items.map((item, index) => (
          <div key={item.id} className="wh-doc-accordion-form-row">
            <FieldRow>
              <label htmlFor={`${baseId}-title-${item.id}`}>
                Title {index + 1}
              </label>
              <TextBox
                id={`${baseId}-title-${item.id}`}
                value={item.title}
                onChange={(event) =>
                  updateItem(item.id, { title: event.target.value })
                }
              />
            </FieldRow>
            <FieldRow>
              <label htmlFor={`${baseId}-body-${item.id}`}>Body {index + 1}</label>
              <TextBox
                id={`${baseId}-body-${item.id}`}
                value={item.body}
                onChange={(event) =>
                  updateItem(item.id, { body: event.target.value })
                }
              />
            </FieldRow>
            <FieldRow className="justify-end">
              <Button
                type="button"
                disabled={items.length <= 1}
                onClick={() =>
                  setItems((prev) => prev.filter((row) => row.id !== item.id))
                }
              >
                Remove
              </Button>
            </FieldRow>
          </div>
        ))}
        <FieldRow className="justify-end">
          <Button
            type="button"
            onClick={() =>
              setItems((prev) => [
                ...prev,
                { id: newItemId(), title: `Section ${prev.length + 1}`, body: '' },
              ])
            }
          >
            Add section
          </Button>
        </FieldRow>
      </DialogWindow>
    </DesktopModal>
  );
}
