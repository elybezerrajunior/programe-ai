import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import { DeployButton } from '~/components/deploy/DeployButton';

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({ chatStarted: _chatStarted }: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const activePreview = previews[activePreviewIndex];

  const shouldShowButtons = activePreview;

  return (
    <div className="flex items-center gap-1">
      {/* Deploy Button */}
      {shouldShowButtons && <DeployButton />}

      {/* Debug Tools */}
      {shouldShowButtons && (
        <div className="flex border border-programe-elements-borderColor rounded-md overflow-hidden ml-1">
          <button
            onClick={async () => {
              try {
                const { downloadDebugLog } = await import('~/utils/debugLogger');
                await downloadDebugLog();
              } catch (error) {
                console.error('Failed to download debug log:', error);
              }
            }}
            className="rounded-md items-center justify-center px-3 py-1.5 text-xs bg-programe-elements-button-primary-background text-programe-elements-button-primary-text hover:bg-programe-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5 transition-colors"
            title="Baixar arquivo com log de debug da aplicação"
          >
            <div className="i-ph:download" />
            <span>Baixar log de debug</span>
          </button>
        </div>
      )}
    </div>
  );
}
