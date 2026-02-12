import type { WebContainer } from '@webcontainer/api';
import { path as nodePath } from '~/utils/path';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ensure-project-ready');

async function collectSrcFiles(
  webcontainer: WebContainer,
  dir: string,
  acc: string[] = [],
): Promise<string[]> {
  try {
    const entries = await webcontainer.fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries as Array<{ name: string; isFile: () => boolean; isDirectory: () => boolean }>) {
      const full = nodePath.join(dir, entry.name);
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      if (entry.isDirectory()) {
        await collectSrcFiles(webcontainer, full, acc);
      } else if (entry.isFile() && /\.(jsx?|tsx?)$/.test(entry.name)) {
        acc.push(full);
      }
    }
  } catch {}
  return acc;
}

export async function ensureViteReactEntryExists(webcontainer: WebContainer): Promise<void> {
  try {
    let indexHtml: string;
    try {
      indexHtml = await webcontainer.fs.readFile('index.html', 'utf-8');
    } catch {
      return;
    }

    const scriptMatch = indexHtml.match(/src=["']([^"']*\/main\.(jsx|tsx))["']/);
    if (!scriptMatch) return;

    const entryPath = scriptMatch[1].replace(/^\//, '');
    const isTsx = scriptMatch[2] === 'tsx';

    try {
      await webcontainer.fs.readFile(entryPath, 'utf-8');
      return;
    } catch {
      logger.debug(`Creating missing React entry: ${entryPath}`);
    }

    const minimalMain = isTsx
      ? `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`
      : `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

    const appPath = entryPath.replace('main.' + scriptMatch[2], 'App.' + scriptMatch[2]);
    let appExists = false;
    try {
      await webcontainer.fs.readFile(appPath, 'utf-8');
      appExists = true;
    } catch {}

    const minimalApp = `function App() {
  return <h1>Hello World</h1>
}
export default App
`;

    await webcontainer.fs.mkdir(nodePath.dirname(entryPath), { recursive: true });
    await webcontainer.fs.writeFile(entryPath, minimalMain);

    if (!appExists) {
      await webcontainer.fs.writeFile(appPath, minimalApp);
    }

    const cssPath = nodePath.join(nodePath.dirname(entryPath), 'index.css');
    try {
      await webcontainer.fs.readFile(cssPath, 'utf-8');
    } catch {
      await webcontainer.fs.writeFile(cssPath, '* { margin: 0; padding: 0; box-sizing: border-box; }');
    }

    const viteConfigPaths = ['vite.config.js', 'vite.config.ts'];
    let hasViteConfig = false;
    for (const configPath of viteConfigPaths) {
      try {
        const config = await webcontainer.fs.readFile(configPath, 'utf-8');
        hasViteConfig = config.includes('react') || config.includes('React');
        if (hasViteConfig) break;
      } catch {}
    }
    if (!hasViteConfig) {
      const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;
      await webcontainer.fs.writeFile('vite.config.js', viteConfig);
    }

    logger.debug(`Created React entry files for ${entryPath}`);
  } catch (error) {
    logger.debug('ensureViteReactEntryExists failed:', error);
  }
}

export async function ensureReactComponentStubs(webcontainer: WebContainer): Promise<void> {
  try {
    const srcFiles = await collectSrcFiles(webcontainer, 'src');
    if (srcFiles.length === 0) return;

    const importRegex = /import\s+(?:\{[\w\s,]+\}|\*\s+as\s+\w+|\w+)\s+from\s+["'](\.\.?\/[^"']+)["']/g;
    const missing = new Set<string>();

    for (const filePath of srcFiles) {
      let content: string;
      try {
        content = await webcontainer.fs.readFile(filePath, 'utf-8');
      } catch {
        continue;
      }
      const fileDir = nodePath.dirname(filePath);
      importRegex.lastIndex = 0;
      let m;
      while ((m = importRegex.exec(content)) !== null) {
        const importPath = m[1];
        if (importPath.endsWith('.css') || importPath.endsWith('.scss')) continue;
        const basePath = nodePath.normalize(nodePath.join(fileDir, importPath)).replace(/^\//, '');
        const extensions = ['.jsx', '.tsx', '.js', '.ts'];
        const indexPaths = ['/index.jsx', '/index.tsx', '/index.js', '/index.ts'];
        let exists = false;
        for (const fileExt of extensions) {
          try {
            await webcontainer.fs.readFile(basePath + fileExt, 'utf-8');
            exists = true;
            break;
          } catch {}
        }
        if (!exists) {
          for (const ip of indexPaths) {
            try {
              await webcontainer.fs.readFile(basePath + ip, 'utf-8');
              exists = true;
              break;
            } catch {}
          }
        }
        if (!exists) missing.add(basePath);
      }
    }

    const projectExt = srcFiles.some((f) => f.endsWith('.tsx')) ? 'tsx' : 'jsx';
    for (const basePath of missing) {
      const name = nodePath.basename(basePath);
      const isHook = /^use[A-Z]/.test(name) || name.includes('Store') || name.includes('store');
      const stubExt = basePath.includes('store') || isHook ? 'js' : projectExt;
      const stubPath = basePath + '.' + stubExt;
      const stubContent = isHook
        ? `export default function ${name}() { return {} }\n`
        : `import React from 'react'\nexport default function ${name.replace(/^./, (c) => c.toUpperCase())}() { return null }\n`;

      try {
        await webcontainer.fs.mkdir(nodePath.dirname(stubPath), { recursive: true });
        await webcontainer.fs.writeFile(stubPath, stubContent);
        logger.debug(`Created stub: ${stubPath}`);
      } catch (err) {
        logger.debug(`Failed to create stub ${stubPath}:`, err);
      }
    }
  } catch (error) {
    logger.debug('ensureReactComponentStubs failed:', error);
  }
}

export async function ensureProjectReady(webcontainer: WebContainer): Promise<void> {
  await ensureViteReactEntryExists(webcontainer);
  await ensureReactComponentStubs(webcontainer);
}
