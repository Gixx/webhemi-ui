import type { ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import type { SystemIconKind } from '../../chrome/SystemIcon';

export type IconPanelSelectionInfoProps = {
  kind: SystemIconKind;
  label: ReactNode;
  description: ReactNode;
};

/**
 * Left info column content for icon-panel layouts: glyph + title + description.
 * Glyph uses CSS background (same as desktop `.icon.*`) so PHP AssetMapper digests work.
 */
export function IconPanelSelectionInfo({
  kind,
  label,
  description,
}: IconPanelSelectionInfoProps) {
  return (
    <>
      <span className={cn('info-icon', kind)} aria-hidden />
      <h1 className="info-title">{label}</h1>
      <hr className="info-separator" />
      <p className="info-description">{description}</p>
    </>
  );
}
