import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'programe';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  accent: {
    50: '#E6FDF9',
    100: '#CCFBF3',
    200: '#99F7E7',
    300: '#66F3DB',
    400: '#4FFFE1',
    500: '#06241e',
    600: '#19D8AE',
    700: '#0FB98F',
    800: '#0C9472',
    900: '#096F55',
    950: '#054A38',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  // Dark green backgrounds for dark mode
  darkGreen: {
    50: '#C7D7D2',
    100: '#8FA6A0',
    200: '#5A7A72',
    300: '#3D5A52',
    400: '#2A423A',
    500: '#0B2A22',
    600: '#071F19',
    700: '#050E0C',
    800: '#040A08',
    900: '#030705',
    950: '#020403',
  },
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette('#0B2A22'), // Use dark green for gray alpha in dark mode
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-programe:${x}`)],
  shortcuts: {
    'bolt-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 bolt-ease-cubic-bezier',
    kdb: 'bg-programe-elements-code-background text-programe-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      programe: {
        elements: {
          borderColor: 'var(--programe-elements-borderColor)',
          borderColorActive: 'var(--programe-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--programe-elements-bg-depth-1)',
              2: 'var(--programe-elements-bg-depth-2)',
              3: 'var(--programe-elements-bg-depth-3)',
              4: 'var(--programe-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--programe-elements-textPrimary)',
          textSecondary: 'var(--programe-elements-textSecondary)',
          textTertiary: 'var(--programe-elements-textTertiary)',
          code: {
            background: 'var(--programe-elements-code-background)',
            text: 'var(--programe-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--programe-elements-button-primary-background)',
              backgroundHover: 'var(--programe-elements-button-primary-backgroundHover)',
              text: 'var(--programe-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--programe-elements-button-secondary-background)',
              backgroundHover: 'var(--programe-elements-button-secondary-backgroundHover)',
              text: 'var(--programe-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--programe-elements-button-danger-background)',
              backgroundHover: 'var(--programe-elements-button-danger-backgroundHover)',
              text: 'var(--programe-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--programe-elements-item-contentDefault)',
            contentActive: 'var(--programe-elements-item-contentActive)',
            contentAccent: 'var(--programe-elements-item-contentAccent)',
            contentDanger: 'var(--programe-elements-item-contentDanger)',
            backgroundDefault: 'var(--programe-elements-item-backgroundDefault)',
            backgroundActive: 'var(--programe-elements-item-backgroundActive)',
            backgroundAccent: 'var(--programe-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--programe-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--programe-elements-actions-background)',
            code: {
              background: 'var(--programe-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--programe-elements-artifacts-background)',
            backgroundHover: 'var(--programe-elements-artifacts-backgroundHover)',
            borderColor: 'var(--programe-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--programe-elements-artifacts-inlineCode-background)',
              text: 'var(--programe-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--programe-elements-messages-background)',
            linkColor: 'var(--programe-elements-messages-linkColor)',
            code: {
              background: 'var(--programe-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--programe-elements-messages-inlineCode-background)',
              text: 'var(--programe-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--programe-elements-icon-success)',
            error: 'var(--programe-elements-icon-error)',
            primary: 'var(--programe-elements-icon-primary)',
            secondary: 'var(--programe-elements-icon-secondary)',
            tertiary: 'var(--programe-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--programe-elements-preview-addressBar-background)',
              backgroundHover: 'var(--programe-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--programe-elements-preview-addressBar-backgroundActive)',
              text: 'var(--programe-elements-preview-addressBar-text)',
              textActive: 'var(--programe-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--programe-elements-terminals-background)',
            buttonBackground: 'var(--programe-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--programe-elements-dividerColor)',
          loader: {
            background: 'var(--programe-elements-loader-background)',
            progress: 'var(--programe-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--programe-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--programe-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--programe-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--programe-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--programe-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--programe-elements-cta-background)',
            text: 'var(--programe-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
      },
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
