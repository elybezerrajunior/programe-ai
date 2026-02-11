/**
 * Declaração de tipos para @fingerprintjs/fingerprintjs.
 * Usado quando os tipos do pacote não são resolvidos a partir de node_modules.
 */
declare module '@fingerprintjs/fingerprintjs' {
  export interface GetResult {
    visitorId: string;
    confidence: { score: number };
  }

  export interface LoadOptions {
    monitoring?: boolean;
  }

  export interface Agent {
    get(): Promise<GetResult>;
  }

  export function load(options?: LoadOptions): Promise<Agent>;

  const defaultExport: {
    load: typeof load;
  };
  export default defaultExport;
}
