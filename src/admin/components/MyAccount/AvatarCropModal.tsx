import { useRef, useState, type FormEvent } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import {
  Button,
  FieldRow,
  TitleBarControl,
  TitleBarControls,
  WindowBody,
} from '../../chrome';
import { PaneWindowShell } from '../../bricks/_lib/PaneWindowShell';
import { cropImageToJpegBlob } from './avatarCrop';

export type AvatarCropModalProps = {
  imageUrl: string;
  onConfirm: (blob: Blob) => void;
  onClose: () => void;
  onError?: (message: string) => void;
};

function initialCrop(mediaWidth: number, mediaHeight: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, 1, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

/**
 * Square crop dialog for My Account upload avatars (max 256×256 JPEG on confirm).
 */
export function AvatarCropModal({
  imageUrl,
  onConfirm,
  onClose,
  onError,
}: AvatarCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop>();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const image = imgRef.current;
    if (!image || !completed) {
      onError?.('Select a crop area.');
      return;
    }
    setBusy(true);
    try {
      const blob = await cropImageToJpegBlob(image, completed);
      onConfirm(blob);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not crop image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PaneWindowShell
      className="avatar-crop-dialog"
      width={420}
      title="Crop Avatar"
      titleIcon="users"
      titleBarControls={
        <TitleBarControls>
          <TitleBarControl action="Close" onClick={onClose} />
        </TitleBarControls>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <WindowBody>
          <p style={{ marginTop: 0 }}>Drag to select a square area.</p>
          <div
            style={{
              maxHeight: 280,
              overflow: 'auto',
              background: '#000',
              textAlign: 'center',
            }}
          >
            <ReactCrop
              crop={crop}
              aspect={1}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompleted(c)}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt=""
                style={{ maxWidth: '100%' }}
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  setCrop(initialCrop(naturalWidth, naturalHeight));
                }}
              />
            </ReactCrop>
          </div>
          <FieldRow className="justify-end" style={{ marginTop: 12 }}>
            <Button type="submit" isDefault accessKey="k" loading={busy}>
              OK
            </Button>
            <Button type="button" accessKey="a" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
          </FieldRow>
        </WindowBody>
      </form>
    </PaneWindowShell>
  );
}
