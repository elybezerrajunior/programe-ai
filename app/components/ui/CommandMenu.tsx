import { Command } from 'cmdk';
import { type ReactNode, useEffect, useState } from 'react';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogContent } from '@radix-ui/react-dialog';

interface CommandMenuProps {
    trigger: ReactNode;
    children: ReactNode;
}

interface CommandItemProps {
    children: ReactNode;
    onSelect?: () => void;
    className?: string;
    value?: string;
}

export const CommandItem = ({ children, onSelect, className, value }: CommandItemProps) => (
    <Command.Item
        className={classNames(
            'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'text-programe-elements-textPrimary',
            'aria-selected:bg-programe-elements-background-depth-3',
            'aria-selected:text-programe-elements-textPrimary',
            'transition-colors cursor-pointer',
            'outline-none select-none',
            className,
        )}
        onSelect={onSelect}
        value={value}
    >
        {children}
    </Command.Item>
);

export const CommandMenu = ({ trigger, children }: CommandMenuProps) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <>
            <div onClick={() => setOpen(true)}>{trigger}</div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] sm:pt-[20vh]">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setOpen(false)}
                    />
                    <div className="relative z-50 w-full max-w-lg overflow-hidden rounded-xl border border-programe-elements-borderColor bg-programe-elements-background-depth-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <Command className="flex flex-col w-full h-full overflow-hidden">
                            <div className="flex items-center border-b border-programe-elements-borderColor px-3">
                                <div className="i-ph:magnifying-glass text-xl text-programe-elements-textTertiary mr-2" />
                                <Command.Input
                                    placeholder="Busque uma ação..."
                                    className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none text-programe-elements-textPrimary placeholder:text-programe-elements-textTertiary disabled:cursor-not-allowed disabled:opacity-50"
                                    autoFocus
                                />
                            </div>
                            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                                <Command.Empty className="py-6 text-center text-sm text-programe-elements-textSecondary">
                                    Nenhum resultado encontrado.
                                </Command.Empty>
                                {children}
                            </Command.List>
                        </Command>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};
