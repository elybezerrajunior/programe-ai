/**
 * Hook para coleta de Fingerprint do dispositivo
 *
 * Usa FingerprintJS para identificação probabilística do dispositivo.
 *
 * Instalação:
 * pnpm add @fingerprintjs/fingerprintjs
 *
 * Opcionalmente, para maior precisão:
 * pnpm add @fingerprintjs/fingerprintjs-pro
 */

import { useState, useEffect, useCallback } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Resultado do fingerprint
 */
export interface FingerprintResult {
  fingerprintId: string | null;
  fingerprintConfidence: number;
  loading: boolean;
  error: string | null;
}

/**
 * Dados adicionais do dispositivo coletados
 */
export interface DeviceData {
  userAgent: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

/**
 * Hook para coletar fingerprint do dispositivo
 * 
 * @returns Objeto com fingerprintId, confidence, loading e error
 */
export function useFingerprint(): FingerprintResult & DeviceData & { refetch: () => Promise<void> } {
  const [fingerprintId, setFingerprintId] = useState<string | null>(null);
  const [fingerprintConfidence, setFingerprintConfidence] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dados do dispositivo (coletados sincronamente)
  const [deviceData, setDeviceData] = useState<DeviceData>({
    userAgent: '',
    screenResolution: '',
    language: '',
    timezone: '',
  });
  
  const collectFingerprint = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Coletar dados básicos do dispositivo primeiro
      const basicDeviceData: DeviceData = {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        screenResolution: typeof window !== 'undefined' 
          ? `${window.screen.width}x${window.screen.height}` 
          : '',
        language: typeof navigator !== 'undefined' 
          ? navigator.language || (navigator as any).userLanguage || '' 
          : '',
        timezone: typeof Intl !== 'undefined' 
          ? Intl.DateTimeFormat().resolvedOptions().timeZone 
          : '',
      };
      
      setDeviceData(basicDeviceData);

      // Tentar carregar FingerprintJS
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();

        setFingerprintId(result.visitorId);
        setFingerprintConfidence(result.confidence.score);
      } catch (fpError) {
        // FingerprintJS não está instalado ou falhou — usar fallback
        console.warn('FingerprintJS not available, using fallback:', fpError);

        const fallbackId = await generateFallbackFingerprint(basicDeviceData);
        setFingerprintId(fallbackId);
        setFingerprintConfidence(0.5);
      }
    } catch (err) {
      console.error('Error collecting fingerprint:', err);
      setError(err instanceof Error ? err.message : 'Erro ao coletar fingerprint');
      setFingerprintId(null);
      setFingerprintConfidence(0);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    collectFingerprint();
  }, [collectFingerprint]);
  
  return {
    fingerprintId,
    fingerprintConfidence,
    loading,
    error,
    ...deviceData,
    refetch: collectFingerprint,
  };
}

/**
 * Gera um fingerprint fallback quando FingerprintJS não está disponível
 *
 * Usa dados disponíveis do navegador para criar um hash único.
 */
async function generateFallbackFingerprint(deviceData: DeviceData): Promise<string> {
  const components = [
    deviceData.userAgent,
    deviceData.screenResolution,
    deviceData.language,
    deviceData.timezone,
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : '',
    typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : '',
    typeof navigator !== 'undefined' ? navigator.maxTouchPoints : '',
    typeof screen !== 'undefined' ? screen.colorDepth : '',
    typeof screen !== 'undefined' ? screen.pixelDepth : '',
  ];
  
  const dataString = components.filter(Boolean).join('|');
  
  // Usar SubtleCrypto para gerar hash
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 32);  // Primeiros 32 caracteres
  }
  
  // Fallback simples se SubtleCrypto não estiver disponível
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Hook simplificado que retorna apenas o fingerprint quando disponível
 */
export function useFingerprintId(): string | null {
  const { fingerprintId, loading } = useFingerprint();
  
  if (loading) {
    return null;
  }
  
  return fingerprintId;
}

/**
 * Componente para coletar fingerprint e passar via context
 * Pode ser usado para centralizar a coleta
 */
export interface FingerprintContextValue extends FingerprintResult, DeviceData {}
