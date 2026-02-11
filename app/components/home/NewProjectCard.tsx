import { classNames } from '~/utils/classNames';
import { Card } from '~/components/ui/Card';

interface NewProjectCardProps {
  onClick?: () => void;
}

export function NewProjectCard({ onClick }: NewProjectCardProps) {
  return (
    <Card
      className={classNames(
        'p-6 cursor-pointer transition-all border-dashed rounded-xl',
        'bg-transparent hover:border-programe-elements-borderColorActive hover:bg-programe-elements-background-depth-2',
        'flex flex-col items-center justify-center min-h-[200px]'
      )}
      onClick={onClick}
    >
      <div className="w-16 h-16 rounded-full bg-programe-elements-background-depth-3 flex items-center justify-center mb-4">
        <div className="i-ph:plus text-3xl text-programe-elements-textSecondary" />
      </div>
      <h3 className="text-lg font-semibold text-programe-elements-textPrimary mb-1">Novo projeto</h3>
      <p className="text-sm text-programe-elements-textTertiary">Template em branco</p>
    </Card>
  );
}

