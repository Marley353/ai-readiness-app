import { scenes } from '../app/SceneManager';
import { MenuScene } from './MenuScene';
import { NewGameScene } from './NewGameScene';
import { SaveLoadScene } from './SaveLoadScene';
import { OptionsScene } from './OptionsScene';
import { GameOverScene } from './GameOverScene';
import { VictoryScene } from './VictoryScene';
import { GeoscapeScene } from '../geoscape/GeoscapeScene';
import { BaseScene } from '../base/BaseScene';
import { InterceptScene } from '../intercept/InterceptScene';
import { BattleScene } from '../battle/BattleScene';
import { DebriefScene } from '../debrief/DebriefScene';
import { MonthlyReportScene } from '../debrief/MonthlyReportScene';
import { SoldiersScene } from '../soldiers/SoldiersScene';
import { InventoryScene } from '../inventory/InventoryScene';
import { ResearchScene } from '../research/ResearchScene';
import { ManufactureScene } from '../manufacture/ManufactureScene';
import { UfopaediaScene } from '../ufopaedia/UfopaediaScene';

export function registerScenes() {
  scenes.register('menu', () => new MenuScene());
  scenes.register('newgame', () => new NewGameScene());
  scenes.register('saveload', () => new SaveLoadScene());
  scenes.register('options', () => new OptionsScene());
  scenes.register('gameover', () => new GameOverScene());
  scenes.register('victory', () => new VictoryScene());
  scenes.register('geoscape', () => new GeoscapeScene());
  scenes.register('base', () => new BaseScene());
  scenes.register('intercept', () => new InterceptScene());
  scenes.register('battle', () => new BattleScene());
  scenes.register('debrief', () => new DebriefScene());
  scenes.register('monthly', () => new MonthlyReportScene());
  scenes.register('soldiers', () => new SoldiersScene());
  scenes.register('inventory', () => new InventoryScene());
  scenes.register('research', () => new ResearchScene());
  scenes.register('manufacture', () => new ManufactureScene());
  scenes.register('ufopaedia', () => new UfopaediaScene());
}
