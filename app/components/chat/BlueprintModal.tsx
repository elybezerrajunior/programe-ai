
import React, { useState } from 'react';
import { Dialog, DialogRoot, DialogTitle, DialogDescription } from '~/components/ui/Dialog';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import { Badge } from '~/components/ui/Badge';
import { toast } from 'react-toastify';

type PlanType = 'free' | 'starter' | 'builder' | 'pro' | 'enterprise';

interface BusinessCategory {
    id: string;
    name: string;
    description: string;
    minPlan: PlanType;
}

const BUSINESS_CATEGORIES: BusinessCategory[] = [
    // STARTER
    { id: 'clinica-simples', name: 'Clínica Simples', description: 'Agendamento e gestão básica para clínicas.', minPlan: 'starter' },
    { id: 'salao-beleza', name: 'Salão de Beleza', description: 'Gestão de horários e clientes para salões.', minPlan: 'starter' },
    { id: 'barbearia', name: 'Barbearia', description: 'Agendamento e controle de caixa para barbearias.', minPlan: 'starter' },
    { id: 'pet-shop', name: 'Pet Shop', description: 'Gestão de banho, tosa e vendas.', minPlan: 'starter' },
    { id: 'academia-pequena', name: 'Academia Pequena', description: 'Controle de acesso e mensalidades.', minPlan: 'starter' },
    { id: 'escola-infantil', name: 'Escola Infantil', description: 'Comunicação com pais e agenda.', minPlan: 'starter' },
    { id: 'lava-jato', name: 'Lava Jato', description: 'Fila de espera e serviços.', minPlan: 'starter' },
    { id: 'oficina-mecanica', name: 'Oficina Mecânica', description: 'Orçamentos e ordens de serviço.', minPlan: 'starter' },
    { id: 'agenda-online', name: 'Agenda Online', description: 'Sistema de agendamento genérico.', minPlan: 'starter' },
    { id: 'pagina-vendas', name: 'Página de Vendas', description: 'Landing page para conversão.', minPlan: 'starter' },
    { id: 'orcamento-simples', name: 'Sistema de Orçamento', description: 'Gerador de orçamentos simples.', minPlan: 'starter' },
    { id: 'cadastro-clientes', name: 'Cadastro de Clientes', description: 'CRM básico para gestão de contatos.', minPlan: 'starter' },

    // BUILDER
    { id: 'crm-vendas', name: 'CRM de Vendas', description: 'Pipeline de vendas e automação.', minPlan: 'builder' },
    { id: 'sistema-financeiro', name: 'Sistema Financeiro', description: 'Controle de caixa, DRE e fluxo.', minPlan: 'builder' },
    { id: 'plataforma-cursos', name: 'Plataforma de Cursos', description: 'Área de membros e aulas.', minPlan: 'builder' },
    { id: 'imobiliaria', name: 'Imobiliária', description: 'Gestão de imóveis e contratos.', minPlan: 'builder' },
    { id: 'escritorio-juridico', name: 'Escritório Jurídico', description: 'Gestão de processos e clientes.', minPlan: 'builder' },
    { id: 'contabilidade', name: 'Contabilidade', description: 'Gestão fiscal e documentos.', minPlan: 'builder' },
    { id: 'clinica-odontologica', name: 'Clínica Odontológica', description: 'Odontograma e agendamento.', minPlan: 'builder' },
    { id: 'clinica-veterinaria', name: 'Clínica Veterinária', description: 'Prontuário e internação.', minPlan: 'builder' },

    // PRO
    { id: 'erp-completo', name: 'ERP Completo', description: 'Gestão integrada de recursos.', minPlan: 'pro' },
    { id: 'marketplace', name: 'Marketplace', description: 'Plataforma multivendedor.', minPlan: 'pro' },
    { id: 'plataforma-saas', name: 'Plataforma SaaS', description: 'Base para Software as a Service.', minPlan: 'pro' },
    { id: 'sistema-assinatura', name: 'Sistema de Assinatura', description: 'Gestão de recorrência.', minPlan: 'pro' },
    { id: 'app-delivery', name: 'App Delivery', description: 'Sistema de pedidos e entregas.', minPlan: 'pro' },
    { id: 'plataforma-comunidade', name: 'Plataforma de Comunidade', description: 'Fórum e interação social.', minPlan: 'pro' },
    { id: 'help-desk', name: 'Help Desk', description: 'Sistema de chamados e suporte.', minPlan: 'pro' },
    { id: 'gestao-projetos', name: 'Gestão de Projetos', description: 'Tarefas, prazos e equipes.', minPlan: 'pro' },
    { id: 'saas-nichado', name: 'SaaS Nichado', description: 'Solução específica para micro-nichos.', minPlan: 'pro' },

    // ENTERPRISE
    { id: 'multiempresa', name: 'Multiempresa', description: 'Gestão de múltiplas filiais.', minPlan: 'enterprise' },
    { id: 'white-label-saas', name: 'White-label SaaS', description: 'SaaS rebrandable.', minPlan: 'enterprise' },
    { id: 'sistemas-regulatorios', name: 'Sistemas Regulatórios', description: 'Compliance e normas.', minPlan: 'enterprise' },
    { id: 'solucoes-governamentais', name: 'Soluções Governamentais', description: 'Para setor público.', minPlan: 'enterprise' },
    { id: 'integracoes-corporativas', name: 'Integrações Corporativas', description: 'Conectores com sistemas legado.', minPlan: 'enterprise' },
    { id: 'governanca-compliance', name: 'Governança e Compliance', description: 'Auditoria e controle.', minPlan: 'enterprise' },
];

const PLAN_LEVELS: Record<PlanType, number> = {
    free: 0,
    starter: 1,
    builder: 2,
    pro: 3,
    enterprise: 4,
};

const PLAN_NAMES: Record<PlanType, string> = {
    free: 'Free',
    starter: 'Starter',
    builder: 'Builder',
    pro: 'Pro',
    enterprise: 'Enterprise',
};

interface BlueprintModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (business: BusinessCategory) => void;
    userPlan?: PlanType; // We'll assume 'free' if not provided
}

export const BlueprintModal: React.FC<BlueprintModalProps> = ({ open, onClose, onSelect, userPlan = 'free' }) => {
    const [selectedCategory, setSelectedCategory] = useState<PlanType | 'all'>('all');

    const getIsLocked = (minPlan: PlanType) => {
        return PLAN_LEVELS[userPlan] < PLAN_LEVELS[minPlan];
    };

    const categories = ['starter', 'builder', 'pro', 'enterprise'] as const;

    const filteredBusinesses = BUSINESS_CATEGORIES.filter((b) => {
        if (selectedCategory === 'all') return true;
        return b.minPlan === selectedCategory;
    });

    const handleBusinessClick = (business: BusinessCategory) => {
        if (getIsLocked(business.minPlan)) {
            toast.info(
                <div className="flex flex-col gap-1">
                    <span className="font-bold">Recurso Bloqueado</span>
                    <span className="text-sm">
                        Este Blueprint está disponível no plano {PLAN_NAMES[business.minPlan]}.
                        <br />
                        Faça upgrade para desbloquear negócios mais avançados.
                    </span>
                    <Button
                        size="sm"
                        className="mt-2 w-full !bg-[#06241e]"
                        onClick={() => {
                            window.location.href = '/plans';
                        }}
                    >
                        Fazer Upgrade
                    </Button>
                </div>,
                {
                    autoClose: 5000,
                }
            );
            return;
        }

        // Track metrics here if we had the implementation
        // logEvent('blueprint_selected', { business_id: business.id });

        onSelect(business);
        onClose();
    };

    return (
        <DialogRoot open={open} onOpenChange={onClose}>
            <Dialog showCloseButton={true} className="w-[800px] max-w-[95vw] h-[80vh] max-h-[800px] flex flex-col p-0 overflow-hidden !bg-[#071f19]">
                {/* Header */}
                <div className="p-6 border-b border-programe-elements-borderColor !bg-[#071f19] flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold mb-2">Programe Blueprint</DialogTitle>
                    <DialogDescription className="text-base text-programe-elements-textSecondary">
                        Escolha um negócio e receba o plano completo para construir seu sistema.
                    </DialogDescription>

                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                            className={selectedCategory === 'all' ? '!bg-accent-500 !text-white hover:!bg-accent-600' : ''}
                        >
                            Todos
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedCategory(cat)}
                                className={classNames('capitalize', selectedCategory === cat ? '!bg-accent-500 !text-white hover:!bg-accent-600' : '')}
                            >
                                {PLAN_NAMES[cat]}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#071f19] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-programe-elements-borderColor [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBusinesses.map((business) => {
                            const isLocked = getIsLocked(business.minPlan);

                            return (
                                <div
                                    key={business.id}
                                    onClick={() => handleBusinessClick(business)}
                                    className={classNames(
                                        'relative p-4 rounded-xl border transition-all duration-200 cursor-pointer group',
                                        isLocked
                                            ? 'border-programe-elements-borderColor bg-programe-elements-background-depth-1 opacity-70 hover:opacity-100'
                                            : 'border-programe-elements-borderColor bg-programe-elements-background-depth-1 hover:border-accent-500 hover:shadow-md hover:translate-y-[-2px]'
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant={isLocked ? 'secondary' : 'primary'} size="sm" className="capitalize">
                                            {PLAN_NAMES[business.minPlan]}
                                        </Badge>
                                        {isLocked && <div className="i-ph:lock-key text-programe-elements-textTertiary text-lg" />}
                                    </div>

                                    <h3 className="font-bold text-programe-elements-textPrimary mb-1 group-hover:text-accent-500 transition-colors">
                                        {business.name}
                                    </h3>
                                    <p className="text-xs text-programe-elements-textSecondary line-clamp-3">
                                        {business.description}
                                    </p>

                                    {isLocked && (
                                        <div className="absolute inset-0 bg-programe-elements-background-depth-2/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="secondary" className="pointer-events-none">
                                                Requer {PLAN_NAMES[business.minPlan]}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Dialog>
        </DialogRoot>
    );
};
