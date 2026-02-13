import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';

interface NetlifyDeploymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onDeploy: (siteName?: string) => Promise<boolean | { success: boolean; error?: string }>;
}

export function NetlifyDeploymentDialog({ isOpen, onClose, onDeploy }: NetlifyDeploymentDialogProps) {
    const [siteName, setSiteName] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDeploying(true);
        setError(null);
        try {
            const result = await onDeploy(siteName.trim() || undefined);
            const success = typeof result === 'boolean' ? result : result.success;

            if (success) {
                onClose();
            } else if (typeof result === 'object' && result.error) {
                setError(result.error);
            }
        } catch (error) {
            console.error('Deployment failed:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsDeploying(false);
        }
    };

    const handleClose = () => {
        if (!isDeploying) {
            setSiteName('');
            setError(null);
            onClose();
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
                <div className="fixed inset-0 flex items-center justify-center z-[9999]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[90vw] md:w-[500px]"
                    >
                        <Dialog.Content
                            className="bg-white dark:bg-programe-elements-background-depth-1 rounded-lg border border-programe-elements-borderColor dark:border-programe-elements-borderColor-dark shadow-xl"
                            aria-describedby="netlify-deploy-dialog-description"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-programe-elements-borderColor dark:border-programe-elements-borderColor-dark">
                                <Dialog.Title className="text-lg font-medium text-programe-elements-textPrimary dark:text-programe-elements-textPrimary-dark flex items-center gap-2">
                                    <span className="i-simple-icons:netlify w-5 h-5 text-[#00C7B7]" />
                                    Publicar no Netlify
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                    <button
                                        onClick={handleClose}
                                        disabled={isDeploying}
                                        className="p-2 rounded-lg transition-all duration-200 ease-in-out bg-transparent text-programe-elements-textTertiary hover:text-programe-elements-textPrimary dark:text-programe-elements-textTertiary-dark dark:hover:text-programe-elements-textPrimary-dark hover:bg-programe-elements-background-depth-2 dark:hover:bg-programe-elements-background-depth-3 focus:outline-none focus:ring-2 focus:ring-programe-elements-borderColor dark:focus:ring-programe-elements-borderColor-dark disabled:opacity-50"
                                    >
                                        <span className="i-ph:x block w-5 h-5" aria-hidden="true" />
                                        <span className="sr-only">Close dialog</span>
                                    </button>
                                </Dialog.Close>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <p
                                    id="netlify-deploy-dialog-description"
                                    className="text-sm text-programe-elements-textSecondary dark:text-programe-elements-textSecondary-dark"
                                >
                                    Insira um nome para o seu site. Se deixar em branco, um nome aleatório será gerado.
                                </p>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="site-name"
                                        className="block text-sm font-medium text-programe-elements-textPrimary dark:text-programe-elements-textPrimary-dark"
                                    >
                                        Nome para o seu site (Opcional)
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="site-name"
                                            type="text"
                                            value={siteName}
                                            onChange={(e) => {
                                                setSiteName(e.target.value);
                                                setError(null);
                                            }}
                                            placeholder="my-awesome-site"
                                            disabled={isDeploying}
                                            className={classNames(
                                                'w-full pl-3 pr-10 py-2 rounded-lg text-sm',
                                                'bg-programe-elements-background-depth-2 dark:bg-programe-elements-background-depth-3',
                                                'border',
                                                error
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-programe-elements-borderColor dark:border-programe-elements-borderColor-dark focus:ring-accent-500',
                                                'text-programe-elements-textPrimary dark:text-programe-elements-textPrimary-dark',
                                                'focus:outline-none focus:ring-2',
                                                'placeholder:text-programe-elements-textTertiary dark:placeholder:text-programe-elements-textTertiary-dark',
                                                'disabled:opacity-60 disabled:cursor-not-allowed',
                                            )}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-programe-elements-textTertiary dark:text-programe-elements-textTertiary-dark text-xs">
                                            .netlify.app
                                        </div>
                                    </div>
                                    {error ? (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <span className="i-ph:warning-circle-fill" />
                                            {error}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-programe-elements-textTertiary dark:text-programe-elements-textTertiary-dark">
                                            Somente caracteres alfanuméricos e hífens são permitidos.
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isDeploying}
                                        className="px-4 py-2 rounded-lg text-programe-elements-textSecondary dark:text-programe-elements-textSecondary-dark hover:text-programe-elements-textPrimary dark:hover:text-programe-elements-textPrimary-dark hover:bg-programe-elements-background-depth-2 dark:hover:bg-programe-elements-background-depth-3 text-sm transition-colors disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isDeploying}
                                        className="px-4 py-2 rounded-lg bg-[#00C7B7] hover:bg-[#00B5A6] text-black text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isDeploying ? (
                                            <>
                                                <div className="i-ph:spinner animate-spin w-4 h-4" />
                                                Publicando...
                                            </>
                                        ) : (
                                            <>
                                                <div className="i-ph:rocket-launch w-4 h-4" />
                                                Publicar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </Dialog.Content>
                    </motion.div>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
