import { useState, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent } from 'react';
import { SystemIcon } from '../../chrome/SystemIcon';
import { Table, TableRow } from '../../chrome/Table';
import { cn } from '../../../lib/cn';
import {
  beginExplorerDrag,
  endExplorerDrag,
  EXPLORER_DND_MIME,
  readExplorerDragIds,
} from './explorerDnd';
import {
  formatExplorerSize,
  isExplorerLocation,
  type ExplorerItem,
  type ExplorerView,
} from './types';

export { EXPLORER_DND_MIME };

export type ExplorerSelectModifiers = {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

export type ExplorerContentProps = {
  view: ExplorerView;
  items: ExplorerItem[];
  /** Selected item ids in the content pane (multi-select). */
  selectedIds?: string[];
  /** Items currently on the cut clipboard (ghosted in the listing). */
  cutItemIds?: string[];
  onSelect?: (item: ExplorerItem, modifiers: ExplorerSelectModifiers) => void;
  onOpen?: (item: ExplorerItem) => void;
  /** Drop selected/dragged ids onto a location item (folder / library). */
  onItemsDrop?: (itemIds: string[], targetId: string) => void;
};

function Glyph({ kind }: { kind: ExplorerItem['kind'] }) {
  return <span className={cn('explorer-glyph', kind)} aria-hidden />;
}

function modifiersFromEvent(event: {
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}): ExplorerSelectModifiers {
  return {
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  };
}

/**
 * Right-pane content: large-icons / list / details.
 * Click selects (Ctrl/Cmd toggles, Shift ranges); double-click opens.
 * Drag onto folder locations to move.
 */
export function ExplorerContent({
  view,
  items,
  selectedIds = [],
  cutItemIds = [],
  onSelect,
  onOpen,
  onItemsDrop,
}: ExplorerContentProps) {
  const selected = new Set(selectedIds);
  const cut = new Set(cutItemIds);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const openItem = (item: ExplorerItem) => {
    onOpen?.(item);
  };

  const selectFromMouse = (
    item: ExplorerItem,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => {
    onSelect?.(item, modifiersFromEvent(event));
  };

  const onDragStartItem = (item: ExplorerItem, event: ReactDragEvent) => {
    if (!onItemsDrop) {
      event.preventDefault();
      return;
    }
    const ids = selected.has(item.id) ? selectedIds : [item.id];
    beginExplorerDrag(ids, event.dataTransfer);
    if (!selected.has(item.id)) {
      onSelect?.(item, { ctrlKey: false, metaKey: false, shiftKey: false });
    }
  };

  const canDropOn = (item: ExplorerItem) => isExplorerLocation(item) && !item.disabled;

  const onDragOverItem = (item: ExplorerItem, event: ReactDragEvent) => {
    if (!onItemsDrop || !canDropOn(item)) {
      return;
    }
    event.preventDefault();
    try {
      event.dataTransfer.dropEffect = 'move';
    } catch {
      // Synthetic drag events may expose a read-only dataTransfer.
    }
    if (dragOverId !== item.id) {
      setDragOverId(item.id);
    }
  };

  const onDragLeaveItem = (item: ExplorerItem) => {
    if (dragOverId === item.id) {
      setDragOverId(null);
    }
  };

  const onDropItem = (item: ExplorerItem, event: ReactDragEvent) => {
    if (!onItemsDrop || !canDropOn(item)) {
      return;
    }
    event.preventDefault();
    setDragOverId(null);
    const ids = readExplorerDragIds(event).filter((id) => id !== item.id);
    endExplorerDrag();
    if (ids.length === 0) {
      return;
    }
    onItemsDrop(ids, item.id);
  };

  const itemClass = (item: ExplorerItem) =>
    cn(
      item.hidden && 'is-hidden',
      selected.has(item.id) && 'is-selected',
      cut.has(item.id) && 'is-cut',
      dragOverId === item.id && 'is-drag-over',
    );

  if (view === 'large-icons') {
    return (
      <div className="explorer-content-inner large-icons">
        {items.map((item) => (
          <SystemIcon
            key={item.id}
            kind={item.kind}
            label={item.label}
            labelTone="dark"
            draggable={Boolean(onItemsDrop)}
            className={itemClass(item)}
            onActivate={(event) => selectFromMouse(item, event)}
            onOpen={() => openItem(item)}
            onDragStart={(event) => onDragStartItem(item, event)}
            onDragOver={(event) => onDragOverItem(item, event)}
            onDragLeave={() => onDragLeaveItem(item)}
            onDrop={(event) => onDropItem(item, event)}
          />
        ))}
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="explorer-content-inner list">
        {items.map((item) => (
          <a
            key={item.id}
            href="#"
            draggable={Boolean(onItemsDrop)}
            className={cn('explorer-list-item', itemClass(item))}
            onClick={(event: ReactMouseEvent<HTMLAnchorElement>) => {
              event.preventDefault();
              selectFromMouse(item, event);
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              openItem(item);
            }}
            onDragStart={(event) => onDragStartItem(item, event)}
            onDragOver={(event) => onDragOverItem(item, event)}
            onDragLeave={() => onDragLeaveItem(item)}
            onDrop={(event) => onDropItem(item, event)}
          >
            <Glyph kind={item.kind} />
            <span className="label">{item.label}</span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="explorer-content-inner details">
      <Table className="explorer-details">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Type</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              draggable={Boolean(onItemsDrop)}
              highlighted={selected.has(item.id)}
              className={itemClass(item)}
              onClick={(event) => selectFromMouse(item, event)}
              onDoubleClick={() => openItem(item)}
              onDragStart={(event) => onDragStartItem(item, event)}
              onDragOver={(event) => onDragOverItem(item, event)}
              onDragLeave={() => onDragLeaveItem(item)}
              onDrop={(event) => onDropItem(item, event)}
            >
              <td className="name-cell">
                <Glyph kind={item.kind} />
                {item.label}
              </td>
              <td>{formatExplorerSize(item.sizeBytes)}</td>
              <td>{item.typeLabel ?? ''}</td>
              <td>{item.modifiedAt ?? ''}</td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
