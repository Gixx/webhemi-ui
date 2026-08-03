import { Button, VerticalBar } from '../../chrome/Button';
import { cn } from '../../../lib/cn';
import type { ExplorerView } from './types';

export type ExplorerToolbarProps = {
  view: ExplorerView;
  onViewChange?: (view: ExplorerView) => void;
  onLevelUp?: () => void;
  /** When true, Up is disabled (forest root / no parent). */
  levelUpDisabled?: boolean;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onDelete?: () => void;
  onProperties?: () => void;
  className?: string;
};

const VIEW_TOOLS: { view: ExplorerView; label: string; className: string }[] = [
  { view: 'large-icons', label: 'Large Icons', className: 'large-icons' },
  { view: 'list', label: 'List', className: 'list' },
  { view: 'details', label: 'Details', className: 'details' },
];

/**
 * Explorer tool strip: navigation / edit stubs + view mode toggle.
 * Icons via product CSS (`.explorer-toolbar button.tool.*`).
 */
export function ExplorerToolbar({
  view,
  onViewChange,
  onLevelUp,
  levelUpDisabled = false,
  onCut,
  onCopy,
  onPaste,
  onUndo,
  onDelete,
  onProperties,
  className,
}: ExplorerToolbarProps) {
  return (
    <div className={cn('panel explorer-toolbar', className)} role="toolbar" aria-label="Explorer">
      <Button
        type="button"
        className="tool level-up"
        aria-label="Up one level"
        disabled={levelUpDisabled}
        onClick={onLevelUp}
      />
      <VerticalBar />
      <Button type="button" className="tool cut" aria-label="Cut" disabled={!onCut} onClick={onCut} />
      <Button
        type="button"
        className="tool copy"
        aria-label="Copy"
        disabled={!onCopy}
        onClick={onCopy}
      />
      <Button
        type="button"
        className="tool paste"
        aria-label="Paste"
        disabled={!onPaste}
        onClick={onPaste}
      />
      <Button
        type="button"
        className="tool undo"
        aria-label="Undo"
        disabled={!onUndo}
        onClick={onUndo}
      />
      <Button
        type="button"
        className="tool delete"
        aria-label="Delete"
        disabled={!onDelete}
        onClick={onDelete}
      />
      <Button
        type="button"
        className="tool properties"
        aria-label="Properties"
        disabled={!onProperties}
        onClick={onProperties}
      />
      <VerticalBar />
      {VIEW_TOOLS.map((tool) => (
        <Button
          key={tool.view}
          type="button"
          className={cn('tool', tool.className)}
          aria-label={tool.label}
          aria-pressed={view === tool.view}
          onClick={() => onViewChange?.(tool.view)}
        />
      ))}
    </div>
  );
}
