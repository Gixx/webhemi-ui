import { useEffect, type RefObject } from 'react';

const HIGHLIGHTED = 'highlighted';

function isBodyRow(element: EventTarget | null): element is HTMLTableRowElement {
  return (
    element instanceof HTMLTableRowElement && element.parentElement?.tagName === 'TBODY'
  );
}

/**
 * Port of admin98 `tableView.js`: click toggles `.highlighted` on tbody rows
 * for `table.interactive`.
 */
export function useTableView(
  tableRef: RefObject<HTMLTableElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const table = tableRef.current;
    if (!enabled || !table) {
      return;
    }
    if (table.dataset.interactiveBound === 'true') {
      return;
    }
    table.dataset.interactiveBound = 'true';

    const onClick = (event: MouseEvent) => {
      const newlySelectedRow = event.composedPath().find(isBodyRow);
      if (!newlySelectedRow) {
        return;
      }

      const tbody = newlySelectedRow.parentElement;
      if (!tbody) {
        return;
      }

      const previouslySelectedRow = Array.from(tbody.children)
        .filter(isBodyRow)
        .find((row) => row.classList.contains(HIGHLIGHTED));

      if (previouslySelectedRow && previouslySelectedRow !== newlySelectedRow) {
        previouslySelectedRow.classList.remove(HIGHLIGHTED);
      }

      newlySelectedRow.classList.toggle(HIGHLIGHTED);
    };

    table.addEventListener('click', onClick);
    return () => {
      table.removeEventListener('click', onClick);
      delete table.dataset.interactiveBound;
    };
  }, [tableRef, enabled]);
}
