import { useEffect, useState, type CSSProperties } from 'react';
import {
  Button,
  FieldRow,
  StatusBar,
  StatusBarField,
  TextBox,
  TitleBarControl,
  TitleBarControls,
} from '../../chrome';
import { HeadingPanelWindow } from '../HeadingPanelWindow';
import { DesktopModal } from '../DesktopModal';
import { MessageDialog } from '../MessageDialog';
import { playAdminSound } from '../../lib/playAdminSound';
import { cn } from '../../../lib/cn';
import { DocumentEditorCanvas } from './DocumentEditorCanvas';

export type DocumentEditorWindowProps = {
  title: string;
  /** Initial document title (editable). */
  documentTitle?: string;
  /** Lexical JSON body. */
  bodyJson?: string | null;
  loading?: boolean;
  saving?: boolean;
  canEdit?: boolean;
  error?: string | null;
  statusMessage?: string | null;
  onClearStatusMessage?: () => void;
  onSave?: (payload: { title: string; body: string }) => void;
  errorSoundUrl?: string;
  onAlertClose?: () => void;
  onClose: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onActivate?: () => void;
  inactive?: boolean;
  maximized?: boolean;
  resizable?: boolean;
  className?: string;
  style?: CSSProperties;
  width?: number;
};

/**
 * Shell window hosting Lexical document editing (Phase 10 Slice 4).
 */
export function DocumentEditorWindow({
  title,
  documentTitle: documentTitleProp = '',
  bodyJson = null,
  loading = false,
  saving = false,
  canEdit = true,
  error = null,
  statusMessage = null,
  onClearStatusMessage,
  onSave,
  errorSoundUrl,
  onAlertClose,
  onClose,
  onMinimize,
  onMaximize,
  onActivate,
  inactive = false,
  maximized = false,
  resizable = true,
  className,
  style,
  width,
}: DocumentEditorWindowProps) {
  const [documentTitle, setDocumentTitle] = useState(documentTitleProp);
  const [draftBody, setDraftBody] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDocumentTitle(documentTitleProp);
    setDraftBody(null);
    setDirty(false);
    setEditorKey((value) => value + 1);
  }, [documentTitleProp, bodyJson]);

  useEffect(() => {
    if (!error) {
      return;
    }
    setAlertMessage(error);
    playAdminSound('chord', errorSoundUrl);
  }, [error, errorSoundUrl]);

  const handleSave = () => {
    if (!canEdit || !onSave || saving || loading) {
      return;
    }
    const trimmed = documentTitle.trim();
    if (!trimmed) {
      setAlertMessage('Title is required.');
      playAdminSound('chord', errorSoundUrl);
      return;
    }
    const body = draftBody ?? bodyJson ?? '';
    onSave({ title: trimmed, body });
    setDirty(false);
  };

  return (
    <>
      <HeadingPanelWindow
        className={cn('document-editor-window', maximized && 'is-maximized', className)}
        title={title}
        titleIcon="folder"
        inactive={inactive}
        resizable={resizable}
        width={width}
        style={style}
        onMouseDown={onActivate}
        titleBarControls={
          <TitleBarControls>
            <TitleBarControl action="Minimize" onClick={onMinimize} />
            {resizable ? (
              <TitleBarControl
                action={maximized ? 'Restore' : 'Maximize'}
                onClick={onMaximize}
              />
            ) : null}
            <TitleBarControl action="Close" onClick={onClose} />
          </TitleBarControls>
        }
        statusBar={
          <StatusBar>
            <StatusBarField>
              {loading
                ? 'Loading…'
                : saving
                  ? 'Saving…'
                  : statusMessage
                    ? statusMessage
                    : dirty
                      ? 'Unsaved changes'
                      : 'Ready'}
            </StatusBarField>
            {statusMessage ? (
              <StatusBarField>
                <Button type="button" onClick={onClearStatusMessage}>
                  Clear
                </Button>
              </StatusBarField>
            ) : null}
          </StatusBar>
        }
      >
        <FieldRow>
          <label htmlFor="wh-doc-title">Title</label>
          <TextBox
            id="wh-doc-title"
            value={documentTitle}
            disabled={!canEdit || loading || saving}
            onChange={(event) => {
              setDocumentTitle(event.target.value);
              setDirty(true);
            }}
          />
        </FieldRow>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <p>Loading document…</p>
          ) : (
            <DocumentEditorCanvas
              editorKey={editorKey}
              initialJson={bodyJson}
              readOnly={!canEdit || saving}
              onChangeJson={(json) => {
                setDraftBody(json);
                setDirty(true);
              }}
            />
          )}
        </div>
        <FieldRow className="justify-end">
          <Button
            type="button"
            isDefault
            disabled={!canEdit || !dirty || loading || saving || !onSave}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </FieldRow>
      </HeadingPanelWindow>
      {alertMessage ? (
        <DesktopModal>
          <MessageDialog
            type="error"
            title="Error"
            message={alertMessage}
            onClose={() => {
              setAlertMessage(null);
              onAlertClose?.();
            }}
          />
        </DesktopModal>
      ) : null}
    </>
  );
}
