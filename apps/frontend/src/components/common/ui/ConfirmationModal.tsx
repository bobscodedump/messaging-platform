import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size='sm'>
      <div className='space-y-5'>
        <p className='text-[0.95rem] leading-relaxed text-foreground/80'>{message}</p>
        <div className='flex justify-end gap-2.5'>
          <Button variant='ghost' onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={isDestructive ? 'destructive' : 'primary'} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
