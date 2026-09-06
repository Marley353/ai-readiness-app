import './design/tokens.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import { boot } from './app/App';
import { scenes } from './app/SceneManager';
import { registerScenes } from './scenes/registry';
import { installTestHooks } from './app/testHooks';
import { loadAtlases } from './render/atlas';
import { sfx } from './audio/sfx';
import { installLifecycle } from './app/lifecycle';
import { installGeoHooks } from './geoscape/hooks';
import { installBaseHooks } from './base/hooks';
import { installInterceptHooks } from './intercept/hooks';
import { installResearchHooks } from './research/hooks';
import { installInventoryHooks } from './inventory/hooks';
import { installDebriefHooks } from './debrief/hooks';
import { installBattleHooks } from './battle/hooks';
import { applyOptions, currentOptions } from './scenes/OptionsScene';

async function start() {
  await Promise.all([
    document.fonts.load('600 16px "IBM Plex Sans"'),
    document.fonts.load('400 16px "IBM Plex Sans"'),
    document.fonts.load('400 16px "IBM Plex Mono"'),
    document.fonts.load('600 16px "IBM Plex Mono"'),
  ]).catch(() => undefined);
  await boot();
  await loadAtlases();
  registerScenes();
  installTestHooks();
  installGeoHooks(); installBaseHooks(); installInterceptHooks(); installResearchHooks(); installInventoryHooks(); installDebriefHooks(); installBattleHooks();
  installLifecycle();
  await sfx.init();
  applyOptions(currentOptions());
  document.getElementById('boot')?.remove();
  const params = new URLSearchParams(location.search);
  scenes.show(params.get('scene') ?? 'menu', {});
}
start().catch((e) => {
  console.error(e);
  const el = document.getElementById('boot');
  if (el) el.textContent = 'Failed to start: ' + (e?.message ?? e);
});
