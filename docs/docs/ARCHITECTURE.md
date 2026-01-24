# Arquitetura Técnica e Padrões - bolt.diy

## Índice

- [Visão Geral](#visão-geral)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Clean Architecture Adaptada para Remix](#clean-architecture-adaptada-para-remix)
- [Padrões de Código](#padrões-de-código)
- [Gerenciamento de Estado](#gerenciamento-de-estado)
- [Roteamento Remix](#roteamento-remix)
- [Estilos e Design System](#estilos-e-design-system)
- [Componentização](#componentização)
- [TypeScript](#typescript)
- [API e Comunicação](#api-e-comunicação)
- [Validação](#validação)
- [Hooks Customizados](#hooks-customizados)
- [Utilitários e Helpers](#utilitários-e-helpers)
- [Constants e Config](#constants-e-config)
- [Barrel Files](#barrel-files)
- [Testes](#testes)
- [Performance](#performance)
- [SEO e Meta Tags](#seo-e-meta-tags)
- [Boas Práticas](#boas-práticas)

---

## Visão Geral

### Arquitetura Escolhida

bolt.diy utiliza uma **Clean Architecture adaptada para Remix**, organizando o código em camadas bem definidas que separam preocupações e facilitam manutenção e testes.

### Tecnologias Principais

- **React 18.3.1**: Framework UI com hooks e context API
- **TypeScript 5.7.2**: Type safety e melhor DX
- **Remix 2.15.2**: Framework full-stack com file-based routing
- **Vite 5.4.11**: Build tool ultra-rápido com HMR
- **UnoCSS 0.61.9**: Utility-first CSS framework
- **Zustand 5.0.3**: Estado global simples e performático
- **Nanostores 0.10.3**: Estado reativo para stores complexas
- **WebContainer API**: Runtime Node.js no browser

### Princípios Arquiteturais

1. **Separation of Concerns**: Cada camada tem responsabilidade única
2. **Dependency Inversion**: Dependências apontam para abstrações
3. **Single Responsibility**: Cada módulo/função faz uma coisa bem
4. **Type Safety**: TypeScript em todo o código
5. **Composability**: Componentes e funções reutilizáveis
6. **Performance First**: Otimizações desde o início

---

## Estrutura de Pastas

### Visão Geral

```
app/
├── components/          # Componentes React organizados por feature
├── lib/                # Lógica de negócio e utilitários
│   ├── .server/        # Código exclusivo do servidor
│   ├── api/            # Clientes de API
│   ├── stores/         # Stores de estado global
│   ├── hooks/          # Hooks customizados
│   ├── services/       # Serviços e casos de uso
│   └── utils/          # Utilitários
├── routes/             # Rotas Remix (file-based routing)
├── styles/             # Estilos globais e SCSS
└── types/              # Tipos TypeScript compartilhados
```

---

## Clean Architecture Adaptada para Remix

### Domain Layer

A camada de domínio contém a lógica de negócio pura, independente de frameworks.

#### Entidades

Entidades são objetos de negócio que encapsulam regras e dados.

```typescript
// types/model.ts
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface Artifact {
  id: string;
  title: string;
  actions: Action[];
}
```

#### Interfaces de Repositórios

Definem contratos para acesso a dados sem especificar implementação.

```typescript
// lib/api/types.ts
export interface IChatRepository {
  sendMessage(messages: Message[]): Promise<StreamingResponse>;
  getModelList(provider: string): Promise<Model[]>;
}

export interface IFileRepository {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
}
```

#### Casos de Uso

Casos de uso orquestram entidades e repositórios para realizar operações de negócio.

```typescript
// lib/services/chatService.ts
export class ChatService {
  constructor(
    private chatRepo: IChatRepository,
    private fileRepo: IFileRepository
  ) {}

  async processMessage(
    message: Message,
    context: ChatContext
  ): Promise<ProcessedResponse> {
    // Lógica de negócio para processar mensagem
    const response = await this.chatRepo.sendMessage([message]);
    // Processar artifacts e aplicar mudanças
    return this.processArtifacts(response.artifacts);
  }
}
```

---

### Data Layer

Implementações concretas de repositórios e integrações externas.

#### Implementação de Repositórios

```typescript
// lib/api/chatRepository.ts
export class ChatRepository implements IChatRepository {
  async sendMessage(messages: Message[]): Promise<StreamingResponse> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new ChatError('Failed to send message');
    }
    
    return response.body; // Stream
  }
}
```

#### Serviços Externos

```typescript
// lib/webcontainer/index.ts
export class WebContainerFileRepository implements IFileRepository {
  constructor(private webcontainer: WebContainer) {}

  async writeFile(path: string, content: string): Promise<void> {
    await this.webcontainer.fs.writeFile(path, content);
  }

  async readFile(path: string): Promise<string> {
    return await this.webcontainer.fs.readFile(path, 'utf-8');
  }
}
```

---

### Presentation Layer

Componentes React, páginas Remix e hooks que conectam UI com lógica de negócio.

#### Componentes

```typescript
// components/chat/Chat.client.tsx
export const Chat: React.FC<ChatProps> = ({ initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const chatService = useChatService();

  const handleSend = async (content: string) => {
    const newMessage: Message = {
      id: generateId(),
      role: 'user',
      content
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    const response = await chatService.processMessage(newMessage, {
      files: getCurrentFiles(),
      context: getContext()
    });
    
    setMessages(prev => [...prev, response.message]);
  };

  return <ChatUI messages={messages} onSend={handleSend} />;
};
```

#### Páginas Remix

```typescript
// routes/chat.$id.tsx
export async function loader({ params }: LoaderFunctionArgs) {
  const chatId = params.id;
  const chat = await loadChat(chatId);
  return json({ chat });
}

export default function ChatPage() {
  const { chat } = useLoaderData<typeof loader>();
  return <Chat initialMessages={chat.messages} />;
}
```

---

## Padrões de Código

### Nomenclatura

#### Arquivos

- **Componentes**: PascalCase (`ChatBox.tsx`, `UserProfile.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useChat.ts`, `useDebounce.ts`)
- **Utilitários**: camelCase (`formatDate.ts`, `parseJson.ts`)
- **Types**: camelCase ou PascalCase (`types.ts`, `ChatTypes.ts`)
- **Stores**: camelCase (`workbench.ts`, `chatStore.ts`)
- **Routes**: Remix conventions (`api.chat.ts`, `chat.$id.tsx`)

#### Componentes

```typescript
// PascalCase para componentes
export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  // ...
};

// Componentes internos em camelCase
const chatMessage: React.FC = () => {
  // ...
};
```

#### Funções e Variáveis

```typescript
// camelCase para funções
function sendMessage(content: string): void {
  // ...
}

// camelCase para variáveis
const userMessage = 'Hello';
const isStreaming = false;
```

#### Tipos e Interfaces

```typescript
// PascalCase para tipos e interfaces
interface ChatMessage {
  id: string;
  content: string;
}

type MessageRole = 'user' | 'assistant';

// Generics com letra maiúscula
interface Repository<T> {
  findById(id: string): Promise<T>;
}
```

#### Constantes

```typescript
// UPPER_SNAKE_CASE para constantes globais
const MAX_MESSAGE_LENGTH = 10000;
const DEFAULT_TIMEOUT = 30000;

// camelCase para constantes locais
const defaultConfig = {
  theme: 'dark',
  language: 'en'
};
```

---

### Documentação

#### JSDoc para Funções Públicas

```typescript
/**
 * Sends a message to the chat and processes the response.
 * 
 * @param message - The message to send
 * @param context - Additional context for processing
 * @returns A promise that resolves with the processed response
 * @throws {ChatError} If the message cannot be sent
 * 
 * @example
 * ```typescript
 * const response = await sendMessage('Hello', { files: [] });
 * ```
 */
export async function sendMessage(
  message: string,
  context: ChatContext
): Promise<ProcessedResponse> {
  // ...
}
```

#### Comentários Inline

```typescript
// Use comentários para explicar "por quê", não "o quê"
// Por quê: Esta otimização reduz o uso de memória em 40%
const optimizedList = useMemo(() => {
  return items.filter(item => item.active);
}, [items]);

// Não faça isso:
// Filter active items
const filtered = items.filter(item => item.active);
```

---

### Tratamento de Erros

#### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### Try/Catch em Funções Async

```typescript
// lib/services/chatService.ts
export async function sendMessage(message: Message): Promise<Response> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new ChatError(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof ChatError) {
      throw error; // Re-throw known errors
    }
    
    // Wrap unknown errors
    throw new ChatError('Failed to send message', { cause: error });
  }
}
```

#### Error Handling em Remix

```typescript
// routes/chat.$id.tsx
export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }
  
  return <div>An unexpected error occurred</div>;
}
```

---

### Imutabilidade

```typescript
// ✅ BOM: Criar novos objetos
const updatedUser = { ...user, name: 'New Name' };

// ✅ BOM: Arrays imutáveis
const newMessages = [...messages, newMessage];

// ✅ BOM: Readonly para prevenir mutação
interface Config {
  readonly apiKey: string;
  readonly timeout: number;
}

// ❌ EVITAR: Mutação direta
user.name = 'New Name'; // Não faça isso!
messages.push(newMessage); // Não faça isso!
```

---

## Gerenciamento de Estado

### Estado Local (useState, useReducer)

```typescript
// Para estado simples
const [input, setInput] = useState<string>('');

// Para estado complexo
const [state, dispatch] = useReducer(chatReducer, initialState);

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'SET_STREAMING':
      return {
        ...state,
        isStreaming: action.payload
      };
    default:
      return state;
  }
}
```

---

### Estado Global (Zustand)

```typescript
// lib/stores/chatStore.ts
import { create } from 'zustand';

interface ChatStore {
  messages: Message[];
  isStreaming: boolean;
  addMessage: (message: Message) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  isStreaming: false,
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  
  clearMessages: () => set({ messages: [] })
}));
```

#### Usando Zustand em Componentes

```typescript
// components/chat/Chat.tsx
export const Chat: React.FC = () => {
  const messages = useChatStore(state => state.messages);
  const isStreaming = useChatStore(state => state.isStreaming);
  const addMessage = useChatStore(state => state.addMessage);

  // Ou usando destructuring
  const { messages, addMessage } = useChatStore();
  
  return (
    <div>
      {messages.map(msg => <Message key={msg.id} message={msg} />)}
    </div>
  );
};
```

---

### Estado Reativo (Nanostores)

Para stores complexas que precisam de reatividade granular:

```typescript
// lib/stores/workbench.ts
import { atom, map } from 'nanostores';

export class WorkbenchStore {
  // Atoms para valores primitivos
  showWorkbench = atom<boolean>(false);
  currentView = atom<'code' | 'diff' | 'preview'>('code');
  
  // MapStore para objetos complexos
  artifacts = map<Record<string, ArtifactState>>({});

  constructor() {
    // HMR support
    if (import.meta.hot) {
      import.meta.hot.data.showWorkbench = this.showWorkbench;
    }
  }
}

// Usando em componentes
import { useStore } from '@nanostores/react';

export const Workbench: React.FC = () => {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const currentView = useStore(workbenchStore.currentView);
  
  return (
    <div>
      {showWorkbench && <View type={currentView} />}
    </div>
  );
};
```

---

### Estado do Servidor (Remix Loaders)

```typescript
// routes/chat.$id.tsx
export async function loader({ params, request }: LoaderFunctionArgs) {
  const chatId = params.id;
  
  // Buscar dados do servidor
  const chat = await getChatById(chatId);
  
  // Validação
  if (!chat) {
    throw new Response('Chat not found', { status: 404 });
  }
  
  // Headers de cache (opcional)
  return json(chat, {
    headers: {
      'Cache-Control': 'public, max-age=60'
    }
  });
}

export default function ChatPage() {
  const chat = useLoaderData<typeof loader>();
  
  return <Chat messages={chat.messages} />;
}
```

---

## Roteamento Remix

### File-based Routing

```
routes/
├── _index.tsx              # Rota raiz (/)
├── chat.$id.tsx            # Rota dinâmica (/chat/:id)
├── api.chat.ts             # Resource route (/api/chat)
├── api.models.$provider.ts # Nested dynamic (/api/models/:provider)
└── git.tsx                 # Rota estática (/git)
```

---

### Loaders

```typescript
// routes/api.models.$provider.ts
export async function loader({ 
  params, 
  request,
  context 
}: LoaderFunctionArgs) {
  const { provider } = params;
  
  if (!provider) {
    throw new Response('Provider required', { status: 400 });
  }
  
  // Acessar variáveis de ambiente
  const apiKey = context.cloudflare?.env?.API_KEY;
  
  // Ler cookies
  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = parseCookies(cookieHeader);
  
  // Buscar dados
  const models = await getModels(provider, { apiKey, apiKeys });
  
  // Retornar JSON
  return json({ models });
}
```

---

### Actions

```typescript
// routes/api.chat.ts
export async function action({ request }: ActionFunctionArgs) {
  // Validar método
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    // Parse body
    const { messages, model, provider } = await request.json();
    
    // Validação
    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'Invalid messages' }, { status: 400 });
    }
    
    // Processar
    const response = await processChat(messages, { model, provider });
    
    // Retornar stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

### Error Boundaries

```typescript
// routes/chat.$id.tsx
import { isRouteErrorResponse, useRouteError } from '@remix-run/react';

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div className="error-container">
        <h1>{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </div>
    );
  }
  
  return (
    <div className="error-container">
      <h1>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  );
}
```

---

### Nested Routes

```typescript
// routes/settings._index.tsx - /settings
export default function SettingsIndex() {
  return <div>Settings Overview</div>;
}

// routes/settings.providers.tsx - /settings/providers
export default function ProvidersSettings() {
  return <div>Provider Settings</div>;
}

// routes/settings.tsx - Layout
export default function SettingsLayout() {
  return (
    <div>
      <SettingsNav />
      <Outlet /> {/* Renderiza rotas filhas */}
    </div>
  );
}
```

---

### Resource Routes

```typescript
// routes/api.health.ts
export async function loader() {
  return json({ status: 'ok', timestamp: Date.now() });
}

// Não exporta componente default
// Acessado via GET /api/health
```

---

## Estilos e Design System

### Sistema de Cores

#### CSS Variables

```css
/* styles/variables.scss */
:root[data-theme="light"] {
  --bolt-elements-background-depth-1: #ffffff;
  --bolt-elements-background-depth-2: #f5f5f5;
  --bolt-elements-textPrimary: #171717;
  --bolt-elements-textSecondary: #525252;
  --bolt-elements-borderColor: #e5e5e5;
}

:root[data-theme="dark"] {
  --bolt-elements-background-depth-1: #0a0a0a;
  --bolt-elements-background-depth-2: #171717;
  --bolt-elements-textPrimary: #fafafa;
  --bolt-elements-textSecondary: #a3a3a3;
  --bolt-elements-borderColor: #404040;
}
```

#### UnoCSS Theme

```typescript
// uno.config.ts
export default defineConfig({
  theme: {
    colors: {
      bolt: {
        elements: {
          background: {
            depth: {
              1: 'var(--bolt-elements-bg-depth-1)',
              2: 'var(--bolt-elements-bg-depth-2)',
            }
          },
          textPrimary: 'var(--bolt-elements-textPrimary)',
          textSecondary: 'var(--bolt-elements-textSecondary)',
        }
      }
    }
  }
});
```

#### Uso em Componentes

```typescript
// ✅ BOM: Usar classes UnoCSS
<div className="bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary">
  Content
</div>

// ✅ BOM: CSS Variables direto quando necessário
<div style={{ backgroundColor: 'var(--bolt-elements-bg-depth-1)' }}>
  Content
</div>
```

---

### Componentes UI Reutilizáveis

```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text',
      secondary: 'bg-bolt-elements-button-secondary-background',
      danger: 'bg-bolt-elements-button-danger-background'
    };
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    return (
      <button
        ref={ref}
        className={clsx(
          variantClasses[variant],
          sizeClasses[size],
          'rounded-md transition-theme',
          className
        )}
        {...props}
      />
    );
  }
);
```

---

### Espaçamento e Tipografia

```typescript
// Usar sistema de espaçamento consistente (8px grid)
<div className="p-4">      // 16px (4 * 4px)
<div className="p-6">      // 24px (6 * 4px)
<div className="gap-2">    // 8px (2 * 4px)

// Tipografia
<h1 className="text-4xl font-bold">Title</h1>
<p className="text-base leading-relaxed">Body text</p>
```

---

### Responsividade

```typescript
// Mobile-first approach
<div className="
  flex flex-col          // Mobile: column
  lg:flex-row            // Desktop: row
  gap-2                  // Small gap
  lg:gap-4               // Larger gap on desktop
">
  <div className="w-full lg:w-1/2">Left</div>
  <div className="w-full lg:w-1/2">Right</div>
</div>
```

---

### Temas (Dark/Light Mode)

```typescript
// lib/stores/theme.ts
export const themeStore = atom<'dark' | 'light'>('dark');

// Aplicar tema no root
useEffect(() => {
  const theme = themeStore.get();
  document.documentElement.setAttribute('data-theme', theme);
}, []);
```

---

## Componentização

### Estrutura de Componentes

```typescript
// components/chat/ChatBox.tsx
import { memo } from 'react';

interface ChatBoxProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
}

// Memo para evitar re-renders desnecessários
export const ChatBox = memo<ChatBoxProps>(({
  input,
  onInputChange,
  onSend,
  isStreaming
}) => {
  return (
    <div className="chat-box">
      <textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={isStreaming}
      />
      <button onClick={onSend} disabled={isStreaming}>
        Send
      </button>
    </div>
  );
});
```

---

### Padrões de Props

```typescript
// ✅ BOM: Interface explícita
interface MessageProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (id: string) => void;
}

export const Message: React.FC<MessageProps> = ({
  message,
  isStreaming = false,
  onEdit
}) => {
  // ...
};

// ✅ BOM: Extensão de HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  className,
  ...props
}) => {
  return <button className={clsx(className, variant)} {...props} />;
};
```

---

### Variantes de Componentes

#### Composição vs Props

```typescript
// ✅ BOM: Composição (mais flexível)
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
  <CardFooter>Actions</CardFooter>
</Card>

// ✅ BOM: Props para variantes simples
<Button variant="primary" size="lg">Click</Button>
```

---

### Componentes Controlados vs Não Controlados

```typescript
// Controlado
const [value, setValue] = useState('');
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// Não controlado (com ref)
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} defaultValue="initial" />
```

---

## TypeScript

### Tipos e Interfaces

```typescript
// ✅ BOM: Interface para objetos
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ BOM: Type para unions e intersections
type Status = 'pending' | 'success' | 'error';
type UserWithStatus = User & { status: Status };

// ✅ BOM: Type aliases para complex types
type EventHandler = (event: Event) => void;
type AsyncFunction<T> = () => Promise<T>;
```

---

### Generics

```typescript
// ✅ BOM: Generics para reutilização
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

class UserRepository implements Repository<User> {
  async findById(id: string): Promise<User | null> {
    // ...
  }
}

// ✅ BOM: Generic constraints
interface Identifiable {
  id: string;
}

function getById<T extends Identifiable>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}
```

---

### Utility Types

```typescript
// ✅ BOM: Utility types comuns
type PartialUser = Partial<User>;              // Todas props opcionais
type RequiredUser = Required<User>;            // Todas props obrigatórias
type UserEmail = Pick<User, 'email'>;          // Selecionar props
type UserWithoutId = Omit<User, 'id'>;         // Remover props
type UserNames = Record<string, string>;       // Mapa de string para string

// ✅ BOM: Custom utility types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type Nullable<T> = T | null;
type Maybe<T> = T | null | undefined;
```

---

### Type Guards

```typescript
// ✅ BOM: Type guards
function isMessage(obj: unknown): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'role' in obj &&
    'content' in obj
  );
}

function processMessage(data: unknown) {
  if (isMessage(data)) {
    // TypeScript sabe que data é Message aqui
    console.log(data.content);
  }
}

// ✅ BOM: Discriminated unions
type Response = 
  | { success: true; data: User }
  | { success: false; error: string };

function handleResponse(response: Response) {
  if (response.success) {
    console.log(response.data); // TypeScript sabe que data existe
  } else {
    console.error(response.error); // TypeScript sabe que error existe
  }
}
```

---

## API e Comunicação

### Cliente HTTP

```typescript
// lib/fetch.ts
export async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return response.json();
}
```

---

### Tratamento de Erros de API

```typescript
// lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

// Uso
try {
  const data = await fetchJson<User>('/api/user');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      // Handle not found
    } else if (error.status >= 500) {
      // Handle server error
    }
  }
}
```

---

### Cache e Revalidação

```typescript
// Remix loader com cache
export async function loader({ request }: LoaderFunctionArgs) {
  const data = await fetchData();
  
  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=60, s-maxage=300'
    }
  });
}

// Client-side cache com SWR pattern
function useCachedData<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      setData(JSON.parse(cached));
      setIsLoading(false);
    }

    fetcher().then(result => {
      setData(result);
      sessionStorage.setItem(key, JSON.stringify(result));
      setIsLoading(false);
    });
  }, [key]);

  return { data, isLoading };
}
```

---

## Validação

### Validação Client-side (Zod)

```typescript
// types/schemas.ts
import { z } from 'zod';

export const messageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
  createdAt: z.date().optional()
});

export type Message = z.infer<typeof messageSchema>;

// Uso
function sendMessage(data: unknown) {
  try {
    const message = messageSchema.parse(data);
    // message é tipado como Message aqui
    return processMessage(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle validation errors
      console.error(error.errors);
    }
    throw error;
  }
}
```

---

### Validação Server-side

```typescript
// routes/api.chat.ts
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  
  // Validar com Zod
  const result = messageSchema.safeParse(body);
  
  if (!result.success) {
    return json(
      { error: 'Validation failed', details: result.error.errors },
      { status: 400 }
    );
  }
  
  // result.data é tipado como Message
  return processMessage(result.data);
}
```

---

### Schemas Compartilhados

```typescript
// lib/validation/schemas.ts
export const chatSchemas = {
  message: messageSchema,
  artifact: artifactSchema,
  // ...
};

// Reutilizar em client e server
```

---

## Hooks Customizados

### Padrões de Hooks

```typescript
// ✅ BOM: Hook customizado reutilizável
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Uso
const debouncedSearch = useDebounce(searchTerm, 300);
```

---

### Exemplos de Hooks Reutilizáveis

```typescript
// lib/hooks/useLocalStorage.ts
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// lib/hooks/useMediaQuery.ts
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

---

## Utilitários e Helpers

### Funções Utilitárias

```typescript
// utils/formatDate.ts
export function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: format === 'long' ? 'full' : 'short'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

// utils/classNames.ts
export function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

---

## Constants e Config

### Organização de Constantes

```typescript
// utils/constants.ts
export const WORK_DIR = '/home/project';
export const WORK_DIR_NAME = 'project';

export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DEFAULT_TIMEOUT = 30000;

// Configurações por ambiente
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  enableAnalytics: import.meta.env.PROD,
  debug: import.meta.env.DEV
};
```

---

### Variáveis de Ambiente

```typescript
// Tipos para env vars
interface Env {
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  // ...
}

// Acessar em Remix
export async function loader({ context }: LoaderFunctionArgs) {
  const apiKey = context.cloudflare?.env?.OPENAI_API_KEY;
  // ...
}
```

---

## Barrel Files

### Estrutura Hierárquica

```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';

// components/index.ts
export * from './ui';
export * from './chat';
export * from './workbench';

// Uso
import { Button, ChatBox, Workbench } from '~/components';
```

---

## Performance

### Code Splitting

```typescript
// Lazy loading de componentes pesados
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

### Memoização

```typescript
// ✅ BOM: useMemo para cálculos pesados
const filteredItems = useMemo(() => {
  return items.filter(item => item.active && item.visible);
}, [items]);

// ✅ BOM: useCallback para funções passadas como props
const handleClick = useCallback((id: string) => {
  setSelectedId(id);
}, []);

// ✅ BOM: memo para componentes
export const Message = memo<MessageProps>(({ message }) => {
  return <div>{message.content}</div>;
});
```

---

## Boas Práticas

### Checklist

- ✅ TypeScript estrito habilitado
- ✅ Componentes pequenos e focados
- ✅ Hooks customizados para lógica reutilizável
- ✅ Error boundaries em rotas críticas
- ✅ Validação client e server-side
- ✅ Acessibilidade (ARIA, keyboard navigation)
- ✅ Performance otimizada (lazy loading, memoização)
- ✅ Código limpo e bem documentado

---

*Para mais detalhes sobre estrutura, veja [STRUCTURE.md](./STRUCTURE.md)*

