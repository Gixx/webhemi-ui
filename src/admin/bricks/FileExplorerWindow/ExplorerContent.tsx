import { SystemIcon } from '../../chrome/SystemIcon';
import { Table, TableRow } from '../../chrome/Table';
import { cn } from '../../../lib/cn';
import {
  formatExplorerSize,
  isExplorerDocument,
  type ExplorerItem,
  type ExplorerView,
} from './types';

export type ExplorerContentProps = {
  view: ExplorerView;
  items: ExplorerItem[];
  selectedId?: string | null;
  /** Item currently on the cut clipboard (ghosted in the listing). */
  cutItemId?: string | null;
  onSelect?: (item: ExplorerItem) => void;
  onOpen?: (item: ExplorerItem) => void;
};

function Glyph({ kind }: { kind: ExplorerItem['kind'] }) {
  return <span className={cn('explorer-glyph', kind)} aria-hidden />;
}

/**
 * Right-pane content: large-icons / list / details.
 * Single click selects; double-click opens. Documents: open is a no-op (editor later).
 */
export function ExplorerContent({
  view,
  items,
  selectedId = null,
  cutItemId = null,
  onSelect,
  onOpen,
}: ExplorerContentProps) {
  const openItem = (item: ExplorerItem) => {
    if (isExplorerDocument(item)) {
      return;
    }
    onOpen?.(item);
  };

  if (view === 'large-icons') {
    return (
      <div className="explorer-content-inner large-icons">
        {items.map((item) => (
          <SystemIcon
            key={item.id}
            kind={item.kind}
            label={item.label}
            labelTone="dark"
            className={cn(
              item.hidden && 'is-hidden',
              selectedId === item.id && 'is-selected',
              cutItemId === item.id && 'is-cut',
            )}
            onActivate={() => onSelect?.(item)}
            onOpen={() => openItem(item)}
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
            className={cn(
              'explorer-list-item',
              item.hidden && 'is-hidden',
              selectedId === item.id && 'is-selected',
              cutItemId === item.id && 'is-cut',
            )}
            onClick={(event) => {
              event.preventDefault();
              onSelect?.(item);
            }}
            onDoubleClick={(event) => {
              event.preventDefault();
              openItem(item);
            }}
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
              highlighted={selectedId === item.id}
              className={cn(item.hidden && 'is-hidden', cutItemId === item.id && 'is-cut')}
              onClick={() => onSelect?.(item)}
              onDoubleClick={() => openItem(item)}
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
