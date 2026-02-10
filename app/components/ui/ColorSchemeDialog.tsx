import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogDescription, DialogRoot } from './Dialog';
import { Button } from './Button';
import { IconButton } from './IconButton';
import type { DesignScheme } from '~/types/design-scheme';
import {
  defaultDesignScheme,
  designFeatures,
  designFonts,
  paletteRoles,
  themePresets,
  type ThemePreset,
} from '~/types/design-scheme';

export interface ColorSchemeDialogProps {
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
}

export const ColorSchemeDialog: React.FC<ColorSchemeDialogProps> = ({ setDesignScheme, designScheme }) => {
  const [palette, setPalette] = useState<{ [key: string]: string }>(() => {
    if (designScheme?.palette) {
      return { ...defaultDesignScheme.palette, ...designScheme.palette };
    }

    return defaultDesignScheme.palette;
  });

  const [features, setFeatures] = useState<string[]>(designScheme?.features || defaultDesignScheme.features);
  const [font, setFont] = useState<string[]>(designScheme?.font || defaultDesignScheme.font);
  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(designScheme?.themeId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'features' | 'themes'>('themes');

  useEffect(() => {
    if (designScheme) {
      setPalette(() => ({ ...defaultDesignScheme.palette, ...designScheme.palette }));
      setFeatures(designScheme.features || defaultDesignScheme.features);
      setFont(designScheme.font || defaultDesignScheme.font);
      setSelectedThemeId(designScheme.themeId);
    } else {
      setPalette(defaultDesignScheme.palette);
      setFeatures(defaultDesignScheme.features);
      setFont(defaultDesignScheme.font);
      setSelectedThemeId(undefined);
    }
  }, [designScheme]);

  const handleColorChange = (role: string, value: string) => {
    setSelectedThemeId(undefined); // Ao editar manualmente, deixa de ser tema pré-definido
    setPalette((prev) => ({ ...prev, [role]: value }));
  };

  const handleFeatureToggle = (key: string) => {
    setSelectedThemeId(undefined);
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleFontToggle = (key: string) => {
    setSelectedThemeId(undefined);
    setFont((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const handleSave = () => {
    if (selectedThemeId) {
      const theme = themePresets.find((t) => t.id === selectedThemeId);
      if (theme) {
        const fullPalette = { ...defaultDesignScheme.palette, ...theme.scheme.palette };
        setDesignScheme?.({
          palette: fullPalette,
          features: theme.scheme.features,
          font: theme.scheme.font,
          themeId: selectedThemeId,
        });
      } else {
        setDesignScheme?.({ palette, features, font, themeId: selectedThemeId });
      }
    } else {
      setDesignScheme?.({ palette, features, font });
    }
    setIsDialogOpen(false);
  };

  const handleReset = () => {
    setSelectedThemeId(undefined);
    setPalette(defaultDesignScheme.palette);
    setFeatures(defaultDesignScheme.features);
    setFont(defaultDesignScheme.font);
  };

  const handleThemeSelect = (theme: ThemePreset) => {
    setSelectedThemeId(theme.id);
    setPalette({ ...defaultDesignScheme.palette, ...theme.scheme.palette });
    setFeatures(theme.scheme.features);
    setFont(theme.scheme.font);
  };

  const isThemeSelected = (theme: ThemePreset) => selectedThemeId === theme.id;

  const renderColorSection = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
          <span className="i-ph:palette text-bolt-elements-item-contentAccent text-sm" />
          Paleta de cores
        </h3>
        <button
          onClick={handleReset}
          className="text-sm bg-transparent hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-lg flex items-center gap-2 transition-all duration-200"
        >
          <span className="i-ph:arrow-clockwise text-sm" />
          Redefinir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {paletteRoles.map((role) => (
          <div
            key={role.key}
            className="group flex items-center gap-4 p-4 rounded-xl bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/30 hover:border-bolt-elements-borderColor transition-all duration-200"
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-xl shadow-md cursor-pointer transition-all duration-200 hover:scale-110 ring-2 ring-transparent hover:ring-bolt-elements-borderColorActive"
                style={{ backgroundColor: palette[role.key] }}
                onClick={() => document.getElementById(`color-input-${role.key}`)?.click()}
                role="button"
                tabIndex={0}
                aria-label={`Alterar cor de ${role.label}`}
              />
              <input
                id={`color-input-${role.key}`}
                type="color"
                value={palette[role.key]}
                onChange={(e) => handleColorChange(role.key, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                tabIndex={-1}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-bolt-elements-bg-depth-1 rounded-full flex items-center justify-center shadow-sm">
                <span className="i-ph:pencil-simple text-xs text-bolt-elements-textSecondary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-bolt-elements-textPrimary transition-colors">{role.label}</div>
              <div className="text-sm text-bolt-elements-textSecondary line-clamp-2 leading-relaxed">
                {role.description}
              </div>
              <div className="text-xs text-bolt-elements-textTertiary font-mono mt-1 px-2 py-1 bg-bolt-elements-bg-depth-1 rounded-md inline-block">
                {palette[role.key]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTypographySection = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
        <span className="i-ph:text-aa text-bolt-elements-item-contentAccent text-sm" />
        Tipografia
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {designFonts.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFontToggle(f.key)}
            className={`group p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive ${
              font.includes(f.key)
                ? 'bg-bolt-elements-item-backgroundAccent border-bolt-elements-borderColorActive shadow-lg'
                : 'bg-bolt-elements-background-depth-3 border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-bg-depth-2'
            }`}
          >
            <div className="text-center space-y-2">
              <div
                className={`text-2xl font-medium transition-colors ${
                  font.includes(f.key) ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textPrimary'
                }`}
                style={{ fontFamily: f.key }}
              >
                {f.preview}
              </div>
              <div
                className={`text-sm font-medium transition-colors ${
                  font.includes(f.key) ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary'
                }`}
              >
                {f.label}
              </div>
              {font.includes(f.key) && (
                <div className="w-6 h-6 mx-auto bg-bolt-elements-item-contentAccent rounded-full flex items-center justify-center">
                  <span className="i-ph:check text-white text-sm" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
        <span className="i-ph:magic-wand text-bolt-elements-item-contentAccent text-sm" />
        Recursos de design
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {designFeatures.map((f) => {
          const isSelected = features.includes(f.key);

          return (
            <div key={f.key} className="feature-card-container p-2">
              <button
                type="button"
                onClick={() => handleFeatureToggle(f.key)}
                className={`group relative w-full p-6 text-sm font-medium transition-all duration-200 bg-bolt-elements-background-depth-3 text-bolt-elements-item-textSecondary ${
                  f.key === 'rounded'
                    ? isSelected
                      ? 'rounded-3xl'
                      : 'rounded-xl'
                    : f.key === 'border'
                      ? 'rounded-lg'
                      : 'rounded-xl'
                } ${
                  f.key === 'border'
                    ? isSelected
                      ? 'border-3 border-bolt-elements-borderColorActive bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent'
                      : 'border-2 border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive text-bolt-elements-textSecondary'
                    : f.key === 'gradient'
                      ? ''
                      : isSelected
                        ? 'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent shadow-lg'
                        : 'bg-bolt-elements-bg-depth-3 hover:bg-bolt-elements-bg-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                } ${f.key === 'shadow' ? (isSelected ? 'shadow-xl' : 'shadow-lg') : 'shadow-md'}`}
                style={{
                  ...(f.key === 'gradient' && {
                    background: isSelected
                      ? 'linear-gradient(135deg, #0D9488 0%, #059669 50%, #34D399 100%)'
                      : 'var(--bolt-elements-bg-depth-3)',
                    color: isSelected ? 'white' : 'var(--bolt-elements-textSecondary)',
                  }),
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-bolt-elements-bg-depth-1 bg-opacity-20">
                    {f.key === 'rounded' && (
                      <div
                        className={`w-6 h-6 bg-current transition-all duration-200 ${
                          isSelected ? 'rounded-full' : 'rounded'
                        } opacity-80`}
                      />
                    )}
                    {f.key === 'border' && (
                      <div
                        className={`w-6 h-6 rounded-lg transition-all duration-200 ${
                          isSelected ? 'border-3 border-current opacity-90' : 'border-2 border-current opacity-70'
                        }`}
                      />
                    )}
                    {f.key === 'gradient' && (
                      <div
                        className="w-6 h-6 rounded-lg opacity-90"
                        style={{ background: 'linear-gradient(135deg, #0D9488 0%, #059669 50%, #34D399 100%)' }}
                      />
                    )}
                    {f.key === 'shadow' && (
                      <div className="relative">
                        <div
                          className={`w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
                            isSelected ? 'opacity-90' : 'opacity-70'
                          }`}
                        />
                        <div
                          className={`absolute top-1 left-1 w-6 h-6 bg-current rounded-lg transition-all duration-200 ${
                            isSelected ? 'opacity-40' : 'opacity-30'
                          }`}
                        />
                      </div>
                    )}
                    {f.key === 'frosted-glass' && (
                      <div className="relative">
                        <div
                          className={`w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-sm bg-white/20 border border-white/30 ${
                            isSelected ? 'opacity-90' : 'opacity-70'
                          }`}
                        />
                        <div
                          className={`absolute inset-0 w-6 h-6 rounded-lg transition-all duration-200 backdrop-blur-md bg-gradient-to-br from-white/10 to-transparent ${
                            isSelected ? 'opacity-60' : 'opacity-40'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="font-semibold">{f.label}</div>
                    {isSelected && <div className="mt-2 w-8 h-1 bg-current rounded-full mx-auto opacity-60" />}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderThemesSection = () => (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
        <span className="i-ph:sun text-bolt-elements-item-contentAccent text-sm" />
        Temas pré-definidos
      </h3>

      <p className="text-sm text-bolt-elements-textSecondary">
        Escolha um tema para aplicar rapidamente cores, tipografia e recursos.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {themePresets.map((theme) => {
          const isSelected = isThemeSelected(theme);
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleThemeSelect(theme)}
              className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-bolt-elements-borderColorActive bg-bolt-elements-item-backgroundAccent shadow-lg'
                  : 'bg-bolt-elements-background-depth-3 border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
              }`}
            >
              {/* Swatch - overlapping circles like Lovable */}
              <div className="relative flex-shrink-0 w-12 h-12">
                {theme.swatchColors.map((color, i) => (
                  <div
                    key={i}
                    className="absolute w-6 h-6 rounded-full border-2 border-bolt-elements-borderColor shadow-sm"
                    style={{
                      backgroundColor: color,
                      left: i === 0 ? 0 : i === 1 ? 14 : 7,
                      top: i === 0 ? 14 : i === 1 ? 0 : 7,
                      zIndex: theme.swatchColors.length - i,
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className={`font-semibold transition-colors ${
                    isSelected
                      ? 'text-bolt-elements-item-contentAccent'
                      : 'text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary'
                  }`}
                >
                  {theme.name}
                </span>
                {isSelected && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="i-ph:check text-bolt-elements-item-contentAccent text-sm" />
                    <span className="text-xs text-bolt-elements-textSecondary">Selecionado</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <IconButton
        title="Paleta de design"
        className="transition-all hover:bg-bolt-elements-item-backgroundAccent/50 hover:text-bolt-elements-item-contentAccent rounded-lg"
        onClick={() => setIsDialogOpen(!isDialogOpen)}
      >
        <span className="i-ph:palette text-xl" />
      </IconButton>

      <DialogRoot open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog
          className="min-w-[520px] max-w-[90vw] max-h-[90vh] overflow-hidden rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 shadow-2xl shadow-black/20 dark:shadow-black/40"
          showCloseButton={true}
        >
          <div className="flex flex-col h-full max-h-[85vh]">
            {/* Header com accent */}
            <div className="relative px-6 pt-6 pb-4 border-b border-bolt-elements-borderColor/50">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-bolt-elements-item-contentAccent/60 to-transparent rounded-full" />
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-bolt-elements-item-backgroundAccent flex items-center justify-center">
                  <span className="i-ph:palette text-xl text-bolt-elements-item-contentAccent" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-bolt-elements-textPrimary tracking-tight">
                    Paleta de design e recursos
                  </DialogTitle>
                  <DialogDescription className="text-sm text-bolt-elements-textSecondary leading-relaxed mt-1">
                    Personalize cores, tipografia e recursos. A IA usará essas preferências para criar designs que combinem com seu estilo.
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4 pt-4">
              <div className="flex gap-0.5 p-0.5 rounded-xl bg-bolt-elements-background-depth-3/80 border border-bolt-elements-borderColor/50">
                {[
                  { key: 'themes', label: 'Temas', icon: 'i-ph:sun' },
                  { key: 'colors', label: 'Cores', icon: 'i-ph:palette' },
                  { key: 'typography', label: 'Tipografia', icon: 'i-ph:text-aa' },
                  { key: 'features', label: 'Recursos', icon: 'i-ph:magic-wand' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveSection(tab.key as any)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeSection === tab.key
                        ? 'bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary shadow-sm border border-bolt-elements-borderColor/50'
                        : 'bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-2'
                    }`}
                  >
                    <span className={`${tab.icon} text-base`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 px-4 py-4 overflow-y-auto">
              <div className="min-h-[320px]">
                {activeSection === 'colors' && renderColorSection()}
                {activeSection === 'typography' && renderTypographySection()}
                {activeSection === 'features' && renderFeaturesSection()}
                {activeSection === 'themes' && renderThemesSection()}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-4 py-4 border-t border-bolt-elements-borderColor/50 bg-bolt-elements-background-depth-2/30 rounded-b-2xl">
              <div className="text-xs text-bolt-elements-textTertiary">
                {Object.keys(palette).length} cores · {font.length} fontes · {features.length} recursos
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive hover:text-bolt-elements-textPrimary"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text font-medium px-5"
                >
                  Salvar alterações
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      </DialogRoot>

      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--bolt-elements-textTertiary) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--bolt-elements-textTertiary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: var(--bolt-elements-textSecondary);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .feature-card-container {
          min-height: 140px;
          display: flex;
          align-items: stretch;
        }
        .feature-card-container button {
          flex: 1;
        }
      `}</style>
    </div>
  );
};
