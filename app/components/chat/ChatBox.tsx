import React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { Dropdown, DropdownItem } from '~/components/ui/Dropdown';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { SupabaseConnection } from './SupabaseConnection';
import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import type { DesignScheme } from '~/types/design-scheme';
import type { ElementInfo } from '~/components/workbench/Inspector';
import { Tooltip } from '~/components/ui/Tooltip';

export interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
  envConfigured?: boolean;
  isPreviewMode?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const handleToggleListening = () => {
    if (props.isListening) {
      props.stopListening();
    } else {
      props.startListening();
    }
  };

  return (
    <div
      className={classNames(
        'relative backdrop-blur-sm p-4 rounded-xl border border-bolt-elements-borderColor w-full mx-auto z-prompt transition-shadow duration-300 ease-out scale-in opacity-0',
        props.isPreviewMode
          ? 'max-w-6xl shadow-xl ring-1 ring-bolt-elements-borderColor/50 bg-bolt-elements-background-depth-2/90 hover:shadow-2xl'
          : 'max-w-chat shadow-lg bg-bolt-elements-background-depth-2 ring-1 ring-black/5 dark:ring-white/5',
      )}
      style={{ animationFillMode: 'forwards' }}
    >
      {props.isPreviewMode && (
        <div
          className="absolute -inset-4 rounded-2xl opacity-25 blur-3xl pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle, rgba(34, 244, 198, 0.35) 0%, rgba(34, 244, 198, 0) 70%)',
          }}
        />
      )}
      <div className="relative z-10">
        <svg className={classNames(styles.PromptEffectContainer)}>
          <defs>
            <linearGradient
              id={props.isPreviewMode ? 'preview-line-gradient' : 'line-gradient'}
              x1="20%"
              y1="0%"
              x2="-14%"
              y2="10%"
              gradientUnits="userSpaceOnUse"
              gradientTransform="rotate(-45)"
            >
              <stop offset="0%" stopColor="#22F4C6" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="#22F4C6" stopOpacity="80%"></stop>
              <stop offset="50%" stopColor="#22F4C6" stopOpacity="80%"></stop>
              <stop offset="100%" stopColor="#22F4C6" stopOpacity="0%"></stop>
            </linearGradient>
            <linearGradient id={props.isPreviewMode ? 'preview-shine-gradient' : 'shine-gradient'}>
              <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
              <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
              <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
              <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
            </linearGradient>
          </defs>
          <rect
            className={classNames(props.isPreviewMode ? styles.PromptEffectLineAnimated : styles.PromptEffectLine)}
            pathLength="100"
            strokeLinecap="round"
            stroke={props.isPreviewMode ? `url(#preview-line-gradient)` : `url(#line-gradient)`}
          ></rect>
          <rect
            className={classNames(styles.PromptShine)}
            x="48"
            y="24"
            width="70"
            height="1"
            fill={props.isPreviewMode ? `url(#preview-shine-gradient)` : `url(#shine-gradient)`}
          ></rect>
        </svg>
        <div>
          <ClientOnly>
            {() => {
              // Ocultar completamente quando configurado via env vars
              if (props.envConfigured) {
                return null;
              }

              return (
                <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
                  <ModelSelector
                    key={props.provider?.name + ':' + props.modelList.length}
                    model={props.model}
                    setModel={props.setModel}
                    modelList={props.modelList}
                    provider={props.provider}
                    setProvider={props.setProvider}
                    providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                    apiKeys={props.apiKeys}
                    modelLoading={props.isModelLoading}
                  />
                  {(props.providerList || []).length > 0 &&
                    props.provider &&
                    !LOCAL_PROVIDERS.includes(props.provider.name) && (
                      <APIKeyManager
                        provider={props.provider}
                        apiKey={props.apiKeys[props.provider.name] || ''}
                        setApiKey={(key) => {
                          props.onApiKeysChange(props.provider.name, key);
                        }}
                      />
                    )}
                </div>
              );
            }}
          </ClientOnly>
        </div>
        <FilePreview
          files={props.uploadedFiles}
          imageDataList={props.imageDataList}
          onRemove={(index) => {
            props.setUploadedFiles?.(props.uploadedFiles.filter((_, i) => i !== index));
            props.setImageDataList?.(props.imageDataList.filter((_, i) => i !== index));
          }}
        />
        <ClientOnly>
          {() => (
            <ScreenshotStateManager
              setUploadedFiles={props.setUploadedFiles}
              setImageDataList={props.setImageDataList}
              uploadedFiles={props.uploadedFiles}
              imageDataList={props.imageDataList}
            />
          )}
        </ClientOnly>
        {props.selectedElement && (
          <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
            <div className="flex gap-2 items-center lowercase">
              <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
                {props?.selectedElement?.tagName}
              </code>
              selecionado para inspeção
            </div>
            <button
              className="bg-transparent text-accent-500 pointer-auto"
              onClick={() => props.setSelectedElement?.(null)}
            >
              Limpar
            </button>
          </div>
        )}
        <div
          className={classNames('relative border border-bolt-elements-borderColor/80 rounded-xl overflow-hidden bg-bolt-elements-background-depth-1/30')}
        >
          <textarea
            ref={props.textareaRef}
            className={classNames(
              'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
              'transition-all duration-200',
              'hover:border-bolt-elements-focus',
              '[&::-webkit-scrollbar]:hidden',
            )}
            onDragEnter={(e) => {
              e.preventDefault();
              e.currentTarget.style.border = '2px solid #1488fc';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.border = '2px solid #1488fc';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

              const files = Array.from(e.dataTransfer.files);
              files.forEach((file) => {
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader();

                  reader.onload = (e) => {
                    const base64Image = e.target?.result as string;
                    props.setUploadedFiles?.([...props.uploadedFiles, file]);
                    props.setImageDataList?.([...props.imageDataList, base64Image]);
                  };
                  reader.readAsDataURL(file);
                }
              });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                if (event.shiftKey) {
                  return;
                }

                event.preventDefault();

                if (props.isStreaming) {
                  props.handleStop?.();
                  return;
                }

                // ignore if using input method engine
                if (event.nativeEvent.isComposing) {
                  return;
                }

                props.handleSendMessage?.(event);
              }
            }}
            value={props.input}
            onChange={(event) => {
              props.handleInputChange?.(event);
            }}
            onPaste={props.handlePaste}
            style={{
              minHeight: props.TEXTAREA_MIN_HEIGHT,
              maxHeight: props.TEXTAREA_MAX_HEIGHT,
              scrollbarWidth: 'none',
            }}
            placeholder={
              props.chatMode === 'build'
                ? 'Como o Programe.ia pode ajudá-lo hoje?'
                : 'Sobre o que você gostaria de conversar?'
            }
            translate="no"
          />
          <ClientOnly>
            {() => (
              <SendButton
                show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                isStreaming={props.isStreaming}
                disabled={!props.providerList || props.providerList.length === 0}
                onClick={(event) => {
                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                    props.handleSendMessage?.(event);
                  }
                }}
              />
            )}
          </ClientOnly>
          <div className="flex justify-between items-center text-sm px-4 pb-3 pt-2">
            <div className="flex gap-1 items-center">
              <Dropdown
                trigger={
                  <button
                    type="button"
                    className="flex items-center text-bolt-elements-item-contentDefault bg-transparent hover:text-bolt-elements-item-contentActive rounded-md p-1 hover:bg-bolt-elements-item-backgroundActive focus:outline-none transition-all"
                  >
                    <div className="i-ph:folder-plus text-xl" />
                  </button>
                }
              >
                <DropdownItem onSelect={props.handleFileUpload}>
                  <div className="i-ph:file-plus text-lg opacity-60" />
                  Enviar Arquivo
                </DropdownItem>

              </Dropdown>
              <Tooltip content={props.isListening ? 'Parar reconhecimento de voz' : 'Reconhecimento de voz'} side="top">
                <button
                  type="button"
                  onClick={handleToggleListening}
                  disabled={props.isStreaming}
                  className={classNames(
                    'flex items-center bg-transparent rounded-md p-1 focus:outline-none transition-all',
                    props.isListening
                      ? 'text-bolt-elements-item-contentAccent hover:bg-bolt-elements-item-backgroundActive'
                      : 'text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive hover:bg-bolt-elements-item-backgroundActive',
                    props.isStreaming && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {props.isListening ? (
                    <div className="i-ph:microphone-slash text-xl" />
                  ) : (
                    <div className="i-ph:waveform text-xl" />
                  )}
                </button>
              </Tooltip>
            </div>
            <SupabaseConnection />
            <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
          </div>
        </div>
      </div>
    </div>
  );
};
