interface LogoProps {
  /** Largura em pixels. Padrão: 90 */
  width?: number;
  /** Caminho da imagem. Padrão: /logo.svg */
  src?: string;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Logo da marca Programe Studio.
 * Usa /logo.svg por padrão, que se adapta a temas claro e escuro.
 */
export function Logo({ width = 90, src = '/logo.svg', className = '' }: LogoProps) {
  return (
    <img
      src={src}
      alt="Programe Studio"
      width={width}
      height={Math.round((83 / 95) * width)}
      className={`h-auto object-contain ${className}`.trim()}
    />
  );
}
