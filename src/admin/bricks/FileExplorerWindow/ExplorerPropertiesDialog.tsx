import { Button, FieldRow, TitleBarControl, TitleBarControls } from '../../chrome';
import { cn } from '../../../lib/cn';
import { DialogWindow } from '../DialogWindow';
import { formatExplorerSize, type ExplorerItem } from './types';

export type ExplorerPropertiesDialogProps = {
  item: ExplorerItem;
  /** Parent folder / root label (Location field). */
  parentLabel?: string | null;
  onClose: () => void;
  className?: string;
};

/**
 * Read-only General properties sheet for one explorer item (Win98-style).
 * Rename / attribute edits stay out of scope for this slice.
 */
export function ExplorerPropertiesDialog({
  item,
  parentLabel = null,
  onClose,
  className,
}: ExplorerPropertiesDialogProps) {
  const sizeLabel = formatExplorerSize(item.sizeBytes) || '—';

  return (
    <DialogWindow
      className={cn('explorer-properties-dialog', className)}
      title={`${item.label} Properties`}
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
      actions={
        <FieldRow className="justify-end">
          <Button type="button" isDefault accessKey="o" onClick={onClose}>
            OK
          </Button>
          <Button type="button" accessKey="c" onClick={onClose}>
            Cancel
          </Button>
        </FieldRow>
      }
    >
      <div className="explorer-properties">
        <div className="explorer-properties-identity">
          <span className={cn('explorer-glyph', item.kind)} aria-hidden />
          <span className="explorer-properties-name">{item.label}</span>
        </div>
        <dl className="explorer-properties-list">
          <div>
            <dt>Type:</dt>
            <dd>{item.typeLabel ?? '—'}</dd>
          </div>
          <div>
            <dt>Location:</dt>
            <dd>{parentLabel ?? '—'}</dd>
          </div>
          <div>
            <dt>Size:</dt>
            <dd>{sizeLabel}</dd>
          </div>
          <div>
            <dt>Modified:</dt>
            <dd>{item.modifiedAt ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </DialogWindow>
  );
}
