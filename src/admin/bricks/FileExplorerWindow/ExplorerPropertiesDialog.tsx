import { useEffect, useState } from 'react';
import { Button, FieldRow, Select, TitleBarControl, TitleBarControls } from '../../chrome';
import { cn } from '../../../lib/cn';
import { DialogWindow } from '../DialogWindow';
import { formatExplorerSize, type ExplorerItem } from './types';
import { parseExplorerEntityId } from './explorerApi';

export type ExplorerPublication = 'draft' | 'published' | 'scheduled';

export type ExplorerPropertiesDialogProps = {
  item: ExplorerItem;
  /** Parent folder / root label (Location field). */
  parentLabel?: string | null;
  canEditPublication?: boolean;
  savingPublication?: boolean;
  onSavePublication?: (publication: ExplorerPublication) => void;
  onClose: () => void;
  className?: string;
};

function canEditNodePublication(item: ExplorerItem): boolean {
  const ref = parseExplorerEntityId(item.id);
  if (ref?.type !== 'node') {
    return false;
  }
  return (
    item.role === 'folder' ||
    item.role === 'document' ||
    item.kind === 'folder' ||
    item.kind === 'file-document' ||
    item.kind === 'file-draft'
  );
}

/**
 * General properties sheet for one explorer item (Win98-style).
 * Content nodes: publication can be changed when `onSavePublication` is set.
 */
export function ExplorerPropertiesDialog({
  item,
  parentLabel = null,
  canEditPublication = false,
  savingPublication = false,
  onSavePublication,
  onClose,
  className,
}: ExplorerPropertiesDialogProps) {
  const sizeLabel = formatExplorerSize(item.sizeBytes) || '—';
  const showPublication = canEditNodePublication(item);
  const [publication, setPublication] = useState<ExplorerPublication>(
    item.publication ?? 'draft',
  );

  useEffect(() => {
    setPublication(item.publication ?? 'draft');
  }, [item.id, item.publication]);

  const publicationDirty = publication !== (item.publication ?? 'draft');
  const editable = Boolean(canEditPublication && onSavePublication && showPublication);

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
          {editable ? (
            <Button
              type="button"
              isDefault
              accessKey="o"
              disabled={savingPublication}
              onClick={() => {
                if (!publicationDirty) {
                  onClose();
                  return;
                }
                onSavePublication?.(publication);
              }}
            >
              OK
            </Button>
          ) : (
            <Button type="button" isDefault accessKey="o" onClick={onClose}>
              OK
            </Button>
          )}
          <Button type="button" accessKey="c" onClick={onClose} disabled={savingPublication}>
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
          {showPublication ? (
            <div>
              <dt>
                <label htmlFor="wh-explorer-publication">Publication:</label>
              </dt>
              <dd>
                {editable ? (
                  <div className="explorer-properties-publication">
                    <Select
                      id="wh-explorer-publication"
                      value={publication}
                      disabled={savingPublication}
                      onChange={(event) =>
                        setPublication(event.target.value as ExplorerPublication)
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </Select>
                    {publication === 'published' ? (
                      <Button
                        type="button"
                        disabled={savingPublication}
                        onClick={() => onSavePublication?.('draft')}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={savingPublication}
                        onClick={() => onSavePublication?.('published')}
                      >
                        Publish
                      </Button>
                    )}
                  </div>
                ) : (
                  (item.publication ?? 'draft')
                )}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </DialogWindow>
  );
}
