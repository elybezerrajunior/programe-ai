export interface DesignScheme {
  palette: { [key: string]: string }; // Changed from string[] to object
  features: string[];
  font: string[];
}

export const defaultDesignScheme: DesignScheme = {
  palette: {
    primary: '#0D9488', // Teal elegante
    secondary: '#0F766E', // Teal escuro
    accent: '#2DD4BF', // Teal claro
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
  },
  features: ['rounded'],
  font: ['sans-serif'],
};

export const paletteRoles = [
  {
    key: 'primary',
    label: 'Primária',
    description: 'Cor principal da marca - use em botões primários, links ativos e elementos interativos principais',
  },
  {
    key: 'secondary',
    label: 'Secundária',
    description: 'Cor de apoio da marca - use em botões secundários, estados inativos e elementos complementares',
  },
  {
    key: 'accent',
    label: 'Destaque',
    description: 'Cor de destaque - use em badges, notificações, estados de foco e elementos de call-to-action',
  },
  {
    key: 'background',
    label: 'Fundo',
    description: 'Plano de fundo da página - use no fundo principal do aplicativo/site atrás de todo o conteúdo',
  },
  {
    key: 'surface',
    label: 'Superfície',
    description: 'Áreas de conteúdo elevadas - use em cards, modais, dropdowns e painéis sobre o fundo',
  },
  { key: 'text', label: 'Texto', description: 'Texto primário - use em títulos, corpo de texto e conteúdo principal legível' },
  {
    key: 'textSecondary',
    label: 'Texto secundário',
    description: 'Texto discreto - use em legendas, placeholders, timestamps e informações menos importantes',
  },
  {
    key: 'border',
    label: 'Borda',
    description: 'Separadores - use em bordas de inputs, divisores, linhas de tabela e contornos de elementos',
  },
  {
    key: 'success',
    label: 'Sucesso',
    description: 'Feedback positivo - use em mensagens de sucesso, estados concluídos e indicadores positivos',
  },
  {
    key: 'warning',
    label: 'Aviso',
    description: 'Alertas de cautela - use em mensagens de aviso, estados pendentes e indicadores que precisam de atenção',
  },
  {
    key: 'error',
    label: 'Erro',
    description: 'Estados de erro - use em mensagens de erro, estados de falha e indicadores de ações destrutivas',
  },
];

export const designFeatures = [
  { key: 'rounded', label: 'Cantos arredondados' },
  { key: 'border', label: 'Borda sutil' },
  { key: 'gradient', label: 'Destaque em gradiente' },
  { key: 'shadow', label: 'Sombra suave' },
  { key: 'frosted-glass', label: 'Vidro fosco' },
];

export const designFonts = [
  { key: 'sans-serif', label: 'Sem serifa', preview: 'Aa' },
  { key: 'serif', label: 'Serifada', preview: 'Aa' },
  { key: 'monospace', label: 'Monoespaçada', preview: 'Aa' },
  { key: 'cursive', label: 'Cursiva', preview: 'Aa' },
  { key: 'fantasy', label: 'Fantasia', preview: 'Aa' },
];

export interface ThemePreset {
  id: string;
  name: string;
  scheme: DesignScheme;
  /** Cores para exibir no swatch (primary, accent, background, etc.) */
  swatchColors: string[];
}

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Padrão',
    swatchColors: ['#F8FAFC', '#E2E8F0', '#475569'],
    scheme: {
      palette: {
        primary: '#0D9488',
        secondary: '#0F766E',
        accent: '#2DD4BF',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['rounded'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'glacier',
    name: 'Glacier',
    swatchColors: ['#E0F2FE', '#38BDF8', '#0284C7'],
    scheme: {
      palette: {
        primary: '#0284C7',
        secondary: '#0369A1',
        accent: '#38BDF8',
        background: '#F0F9FF',
        surface: '#FFFFFF',
        text: '#0C4A6E',
        textSecondary: '#64748B',
        border: '#BAE6FD',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['rounded', 'shadow'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'harvest',
    name: 'Harvest',
    swatchColors: ['#FFEDD5', '#F59E0B', '#D97706'],
    scheme: {
      palette: {
        primary: '#D97706',
        secondary: '#B45309',
        accent: '#F59E0B',
        background: '#FFFBEB',
        surface: '#FFFFFF',
        text: '#292524',
        textSecondary: '#78716C',
        border: '#FDE68A',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['rounded', 'shadow'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    swatchColors: ['#EDE9FE', '#A78BFA', '#7C3AED'],
    scheme: {
      palette: {
        primary: '#7C3AED',
        secondary: '#6D28D9',
        accent: '#A78BFA',
        background: '#FAF5FF',
        surface: '#FFFFFF',
        text: '#3B0764',
        textSecondary: '#6B7280',
        border: '#E9D5FF',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['rounded', 'gradient'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'brutalist',
    name: 'Brutalista',
    swatchColors: ['#FFFFFF', '#334155', '#2DD4BF'],
    scheme: {
      palette: {
        primary: '#14B8A6',
        secondary: '#0D9488',
        accent: '#2DD4BF',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#0F172A',
        textSecondary: '#475569',
        border: '#1E293B',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['border'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidiana',
    swatchColors: ['#1C1917', '#404040', '#A3A3A3'],
    scheme: {
      palette: {
        primary: '#A3A3A3',
        secondary: '#737373',
        accent: '#D4D4D4',
        background: '#0C0A09',
        surface: '#1C1917',
        text: '#FAFAF9',
        textSecondary: '#A8A29E',
        border: '#292524',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      features: ['rounded', 'shadow'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'orchid',
    name: 'Orquídea',
    swatchColors: ['#FCE7F3', '#F472B6', '#DB2777'],
    scheme: {
      palette: {
        primary: '#DB2777',
        secondary: '#BE185D',
        accent: '#F472B6',
        background: '#FDF2F8',
        surface: '#FFFFFF',
        text: '#831843',
        textSecondary: '#9CA3AF',
        border: '#FBCFE8',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['rounded', 'shadow'],
      font: ['sans-serif'],
    },
  },
  {
    id: 'solar',
    name: 'Solar',
    swatchColors: ['#FEF3C7', '#F59E0B', '#F97316'],
    scheme: {
      palette: {
        primary: '#EA580C',
        secondary: '#C2410C',
        accent: '#FB923C',
        background: '#FFFBEB',
        surface: '#FFFFFF',
        text: '#431407',
        textSecondary: '#78716C',
        border: '#FED7AA',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
      },
      features: ['rounded', 'gradient'],
      font: ['sans-serif'],
    },
  },
];
