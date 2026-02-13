import React from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogRoot } from '~/components/ui/Dialog';
import { useStore } from '@nanostores/react';
import { expoUrlAtom } from '~/lib/stores/qrCodeStore';
import { QRCode } from 'react-qrcode-logo';

interface ExpoQrModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExpoQrModal: React.FC<ExpoQrModalProps> = ({ open, onClose }) => {
  const expoUrl = useStore(expoUrlAtom);

  return (
    <DialogRoot open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog
        className="text-center !flex-col !mx-auto !text-center !max-w-md"
        showCloseButton={true}
        onClose={onClose}
      >
        <div className="border !border-programe-elements-borderColor flex flex-col gap-5 justify-center items-center p-6 bg-programe-elements-background-depth-2 rounded-md">
          <div className="i-programe:expo-brand h-10 w-full invert dark:invert-none"></div>
          <DialogTitle className="text-programe-elements-textTertiary text-lg font-semibold leading-6">
            Visualizar no seu dispositivo móvel
          </DialogTitle>
          <DialogDescription className="bg-programe-elements-background-depth-3 max-w-sm rounded-md p-1 border border-programe-elements-borderColor">
            Escaneie este código QR com o aplicativo Expo Go no seu dispositivo móvel para abrir seu projeto.
          </DialogDescription>
          <div className="my-6 flex flex-col items-center">
            {expoUrl ? (
              <QRCode
                logoImage="/favicon.svg"
                removeQrCodeBehindLogo={true}
                logoPadding={3}
                logoHeight={50}
                logoWidth={50}
                logoPaddingStyle="square"
                style={{
                  borderRadius: 16,
                  padding: 2,
                  backgroundColor: '#1CF479', // Verde destaque
                }}
                value={expoUrl}
                size={200}
              />
            ) : (
              <div className="text-gray-500 text-center">Nenhuma URL do Expo detectada.</div>
            )}
          </div>
        </div>
      </Dialog>
    </DialogRoot>
  );
};
