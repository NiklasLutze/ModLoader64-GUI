import { MessageLayer } from './MessageLayer';
import { ipcRenderer } from 'electron';
import { TunnelMessageHandler } from './GUITunnel';
import { ModManager, Mod, ModStatus } from './ModManager';
import { GUIValues } from './GUIValues';
import { RomManager, Rom } from './RomManager';

class GeneralFormHandler {
  get nickname(): string {
    let _nickname: HTMLInputElement = document.getElementById(
      'nickname'
    ) as HTMLInputElement;
    return _nickname.value;
  }

  set nickname(nick: string) {
    let _nickname: HTMLInputElement = document.getElementById(
      'nickname'
    ) as HTMLInputElement;
    _nickname.value = nick;
    //@ts-ignore
    $('#nickname').textbox('setText', nick);
  }

  get lobby(): string {
    let _lobby: HTMLInputElement = document.getElementById(
      'lobby'
    ) as HTMLInputElement;
    return _lobby.value;
  }

  set lobby(lobby: string) {
    let _lobby: HTMLInputElement = document.getElementById(
      'lobby'
    ) as HTMLInputElement;
    _lobby.value = lobby;
    //@ts-ignore
    $('#lobby').textbox('setText', lobby);
  }

  get password(): string {
    let _password: HTMLInputElement = document.getElementById(
      'password'
    ) as HTMLInputElement;
    return _password.value;
  }

  set password(pw: string) {
    let _password: HTMLInputElement = document.getElementById(
      'password'
    ) as HTMLInputElement;
    _password.value = pw;
    //@ts-ignore
    $('#password').textbox('setText', pw);
  }
}

const formHandler: GeneralFormHandler = new GeneralFormHandler();

function injectItemElement_ModsTab(mod: Mod) {
  let parent = document.getElementById('mods');
  if (parent !== null && parent !== undefined) {
    let entry = document.createElement('div');
    let chk = document.createElement('input');
    chk.id = mod.meta.name;
    entry.appendChild(chk);
    let icon = document.createElement('img');
    icon.src = 'data:image/png;base64, ' + mod.icon;
    icon.width = 30;
    icon.height = 30;
    entry.appendChild(icon);
    let text = document.createElement('span');
    text.textContent = ' ' + mod.meta.name + ' ' + mod.meta.version;
    entry.appendChild(text);
    parent.appendChild(entry);
    let box;
    box = $('#' + mod.meta.name);
    let isChecked = true;
    if (mod.file.indexOf('.disabled') > -1) {
      isChecked = false;
    }
    //@ts-ignore
    box.checkbox({
      checked: isChecked,
      onChange: (checked: boolean) => {
        let status: ModStatus = new ModStatus(mod);
        status.enabled = checked;
        handlers.layer.send('onModStatusChanged', status);
      },
    });
  }
}

let SELECTED_ROM = '';

function injectItemElement_RomsTab(
  parentName: string,
  name: string,
  _icon: string,
  version: string,
  elemBaseName?: string
) {
  let parent = document.getElementById(parentName);
  if (parent !== null && parent !== undefined) {
    let entry = document.createElement('div');
    let chk = document.createElement('input');
    if (elemBaseName !== null && elemBaseName !== undefined) {
      chk.setAttribute('data-id', elemBaseName);
      chk.id = elemBaseName;
    } else {
      chk.setAttribute('data-id', name);
      chk.id = name;
    }
    chk.name = 'selectedRom';
    entry.appendChild(chk);
    /* let icon = document.createElement('img');
		icon.src = 'data:image/png;base64, ' + _icon;
		icon.width = 30;
		icon.height = 30;
		entry.appendChild(icon); */
    let text = document.createElement('span');
    if (elemBaseName !== null && elemBaseName !== undefined) {
      text.id = elemBaseName + '_span';
    } else {
      text.id = name + '_span';
    }
    text.textContent = ' ' + name + ' ' + version;
    entry.appendChild(text);
    parent.appendChild(entry);
    let jq;
    if (elemBaseName !== null && elemBaseName !== undefined) {
      jq = $('#' + elemBaseName);
    } else {
      jq = $('#' + name);
    }
    //@ts-ignore
    jq.radiobutton({
      checked: false,
      onChange: (checked: boolean) => {
        if (checked) {
          SELECTED_ROM = name;
        }
      },
    });
  }
}

class WebSideMessageHandlers {
  layer: MessageLayer;

  constructor(emitter: any, retriever: any) {
    this.layer = new MessageLayer('internal_event_bus', emitter, retriever);
    this.layer.setupMessageProcessor(this);
  }

  doSetup() {
    this.layer.send('electronSetup', {});
  }

  @TunnelMessageHandler('onStatus')
  onStatus(status: string) {}

  @TunnelMessageHandler('readMods')
  onMods(mods: ModManager) {
    mods.mods.forEach((mod: Mod) => {
      injectItemElement_ModsTab(mod);
    });
  }

  @TunnelMessageHandler('readRoms')
  onRoms(roms: RomManager) {
    roms.roms.forEach((rom: Rom) => {
      injectItemElement_RomsTab('_roms', rom.filename, '', '', rom.hash);
    });
  }

  @TunnelMessageHandler('onConfigLoaded')
  onConfigLoaded(config: any) {
    formHandler.nickname = config['NetworkEngine.Client'].nickname;
    formHandler.lobby = config['NetworkEngine.Client'].lobby;
    formHandler.password = config['NetworkEngine.Client'].password;
  }
}

const handlers = new WebSideMessageHandlers(ipcRenderer, ipcRenderer);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    handlers.doSetup();
  }, 100);
});

let startButton = document.getElementById('start');
if (startButton !== null) {
  startButton.addEventListener('click', () => {
    handlers.layer.send(
      'onStartButtonPressed',
      new GUIValues(
        formHandler.nickname,
        formHandler.lobby,
        formHandler.password,
        SELECTED_ROM
      )
    );
  });
}
