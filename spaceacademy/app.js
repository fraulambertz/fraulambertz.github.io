const $ = (selector) => document.querySelector(selector);
const app = {
  home: $('#homeScreen'), game: $('#gameScreen'), result: $('#resultScreen'), field: $('#playfield'),
  feedback: $('#feedback'), instruction: $('#instruction'), instructionIcon: $('#instructionIcon'), skill: $('#skillLabel'),
  stepLabel: $('#stepLabel'), progress: $('#progressBar'), timer: $('#timer'), missionName: $('#missionName'),
  howToText: $('#howToText'), howToSymbol: $('#howToSymbol')
};

let mode = null;
let taskIndex = 0;
let startedAt = 0;
let timerId = null;
let attempts = 0;
let correct = 0;
let score = 0;
let taskMisses = 0;
let taskFinished = false;
let cleanups = [];
let audioContext = null;
let soundOn = localStorage.getItem('space-input-sound') !== 'off';
let pausedTotal = 0;
let pauseStarted = 0;
let currentTask = null;
let taskRendered = false;

const taskSets = {
  mouse: [
    { skill:'HOVER & TOOLTIP', icon:'◉', level:'BASIS', title:'Hover: ruhig verweilen', text:'Finde „Nebula“. Verweile auf den Planeten, bis ihr Tooltip erscheint.', how:'Bewege den Zeiger auf ein Objekt und lasse ihn dort ruhig stehen. Nach 0,8 Sekunden erscheint eine Zusatzinformation.', location:'Die Maus wird nur bewegt – keine Taste drücken.', render:()=>hoverTask(false) },
    { skill:'HOVER & TOOLTIP', icon:'◉', level:'PROFI', title:'Hover unter Zeitdruck', text:'Enttarne zwei gesuchte Monde über ihre Tooltips.', how:'Verweile auf jedem Objekt, bis der Tooltip sichtbar ist. Klicke nur die gesuchten Monde an.', location:'Zeiger ruhig halten; ein Klick beendet die Auswahl.', render:()=>hoverTask(true) },
    { skill:'LINKSKLICK', icon:'↖', level:'BASIS', title:'Einmal links klicken', text:'Aktiviere drei leuchtende Energiekugeln mit je einem Linksklick.', how:'Drücke die linke Maustaste einmal kurz und lasse sie direkt wieder los.', location:'Linke Maustaste: vorne links auf der Maus.', render:()=>clickTask(3,false) },
    { skill:'LINKSKLICK', icon:'↖', level:'PROFI', title:'Bewegliche Ziele treffen', text:'Aktiviere fünf wandernde Energiekugeln mit Linksklicks.', how:'Ziele zuerst mit dem Zeiger und klicke dann einmal mit der linken Maustaste.', location:'Linke Maustaste: vorne links auf der Maus.', render:()=>clickTask(5,true) },
    { skill:'DOPPELKLICK', icon:'↖↖', level:'BASIS', title:'Zweimal schnell klicken', text:'Öffne zwei Kristalle jeweils mit einem Doppelklick.', how:'Drücke die linke Maustaste zweimal schnell hintereinander, ohne die Maus dazwischen zu bewegen.', location:'Zweimal dieselbe linke Maustaste drücken.', render:()=>doubleClickTask(2,false) },
    { skill:'DOPPELKLICK', icon:'↖↖', level:'PROFI', title:'Gezielte Doppelklicks', text:'Öffne drei kleinere Kristalle mit sauberen Doppelklicks.', how:'Beide Klicks müssen schnell auf demselben Objekt landen. Ein einzelner Klick öffnet nichts.', location:'Linke Maustaste: zweimal kurz hintereinander.', render:()=>doubleClickTask(3,true) },
    { skill:'RECHTSKLICK', icon:'☰', level:'BASIS', title:'Aktionsmenü öffnen', text:'Öffne beim Alien das Menü per Rechtsklick und wähle „Begrüßen“.', how:'Drücke einmal die rechte Maustaste. Dadurch öffnet sich ein Menü mit Aktionen.', location:'Rechte Maustaste: vorne rechts auf der Maus.', render:()=>rightClickTask(false) },
    { skill:'RECHTSKLICK', icon:'☰', level:'PROFI', title:'Passende Aktion finden', text:'Öffne die Menüs der beiden Aliens und wähle ihre gewünschte Aktion.', how:'Öffne jedes Aktionsmenü mit Rechtsklick und wähle danach den richtigen Eintrag mit Linksklick.', location:'Rechts öffnet das Menü, links wählt den Eintrag.', render:()=>rightClickTask(true) },
    { skill:'GENAU KLICKEN', icon:'⊙', level:'BASIS', title:'Präzise zielen', text:'Triff drei kleine Navigationspunkte möglichst genau.', how:'Bewege die Zeigerspitze in die Mitte des Ziels und klicke einmal links.', location:'Die Spitze des Mauszeigers bestimmt den Treffpunkt.', render:()=>precisionTask(3,false) },
    { skill:'GENAU KLICKEN', icon:'⊙', level:'PROFI', title:'Kleine Ziele treffen', text:'Triff fünf sehr kleine Navigationspunkte.', how:'Bremse die Maus kurz vor dem Ziel ab und klicke erst, wenn die Zeigerspitze sicher darin liegt.', location:'Mit kleinen Mausbewegungen lässt sich genauer zielen.', render:()=>precisionTask(5,true) },
    { skill:'DRAG & DROP', icon:'↔', level:'BASIS', title:'Ziehen und ablegen', text:'Ziehe zwei Frachtkisten in die gleichfarbigen Landezonen.', how:'Linke Maustaste auf der Kiste gedrückt halten, Maus bewegen und erst im Ziel loslassen.', location:'Linke Maustaste während der gesamten Bewegung halten.', render:()=>dragTask(false) },
    { skill:'DRAG & DROP', icon:'↔', level:'PROFI', title:'Fracht präzise sortieren', text:'Sortiere drei kleinere Kisten in die passenden Landezonen.', how:'Greife eine Kiste, halte die linke Taste und lege sie vollständig innerhalb der passenden Zone ab.', location:'Drücken – halten – bewegen – loslassen.', render:()=>dragTask(true) },
    { skill:'SCROLLRAD', icon:'↕', level:'BASIS', title:'Nach unten scrollen', text:'Scrolle im Bordlogbuch bis zur grünen Abschlussmeldung.', how:'Bewege das Rad zwischen den Maustasten nach unten. Der Inhalt wandert, ohne dass du klicken musst.', location:'Das Scrollrad liegt zwischen linker und rechter Maustaste.', render:()=>scrollTask(false) },
    { skill:'SCROLLRAD', icon:'↕', level:'PROFI', title:'Gezielt scrollen', text:'Finde im langen Sternenregister „Station VEGA“ und wähle sie aus.', how:'Scrolle mit dem Mausrad nach unten oder oben. Halte an, sobald die gesuchte Station sichtbar ist.', location:'Rad nach unten: Inhalt nach unten. Rad nach oben: zurück nach oben.', render:()=>scrollTask(true) },
    { skill:'HEISSER DRAHT', icon:'⌁', level:'BASIS', title:'Ruhig durch den Korridor', text:'Klicke START, halte die Maustaste und führe den Impuls zum ZIEL.', how:'Im Startkreis drücken, die linke Taste halten und den Zeiger im leuchtenden Weg bewegen.', location:'Linke Maustaste erst im Ziel loslassen.', render:()=>wireTask(false) },
    { skill:'HEISSER DRAHT', icon:'⌁', level:'PROFI', title:'Der schmale Korridor', text:'Führe den Impuls durch den schmaleren Energiekorridor.', how:'Halte die linke Taste gedrückt und bewege dich langsam durch die engeren Kurven.', location:'Kleine, ruhige Mausbewegungen helfen.', render:()=>wireTask(true) },
    { skill:'ABSCHLUSSMISSION', icon:'★', level:'FINALE', title:'Alles in einer Mission', text:'Schließe den gemischten Maus-Parcours ab.', how:'Hover, Linksklick, Doppelklick, Rechtsklick, Präzision, Drag & Drop, Scrollrad und heißer Draht kommen nacheinander.', location:'Lies jeweils den kurzen Auftrag links oben im Spielfeld.', render:mixedMouseTask }
  ],
  keyboard: [
    { skill:'KLEINBUCHSTABEN', icon:'a', level:'BASIS', title:'Kleinbuchstaben', text:'Tippe die Kleinbuchstaben, um das Sternentor zu laden.', how:'Drücke die angezeigten Buchstabentasten ohne Shift. Der jeweils nächste Buchstabe leuchtet blau.', location:'Buchstaben liegen im großen mittleren Bereich der Tastatur.', render:()=>sequenceTask(['n','e','b','e','l','s','t','e','r','n'],'Nur Kleinbuchstaben') },
    { skill:'GROSSBUCHSTABEN', icon:'⇧', level:'BASIS', title:'Shift ⇧ für Großbuchstaben', text:'Halte Shift und tippe die Großbuchstaben. Caps Lock zählt nicht.', how:'Halte Shift ⇧ mit einer Hand gedrückt und tippe gleichzeitig den Buchstaben mit der anderen.', location:'Shift ⇧ liegt links über Strg und rechts unter Enter.', render:()=>sequenceTask(['R','A','K','E','T','E'],'Shift ⇧ + Buchstabe',true) },
    { skill:'ZAHLEN', icon:'7', level:'BASIS', title:'Zahlentasten', text:'Gib den Navigationscode ein.', how:'Tippe die angezeigten Ziffern der Reihe nach.', location:'Die Zahlenreihe liegt ganz oben über den Buchstaben.', render:()=>sequenceTask(['4','7','2','9','0','3'],'Zahlenreihe oben') },
    { skill:'SONDERZEICHEN', icon:'#', level:'BASIS', title:'Sonderzeichen', text:'Repariere die Antenne mit den angezeigten Sonderzeichen.', how:'Einige Zeichen brauchen Shift ⇧, andere AltGr. Entscheidend ist das richtige Zeichen auf dem Bildschirm.', location:'Sonderzeichen stehen meist auf Zahlen- und Randtasten.', render:()=>sequenceTask(['!','?','-','_','+','#'],'Bei Bedarf Shift ⇧ oder AltGr verwenden') },
    { skill:'BACKSPACE · SHIFT · ENTER', icon:'⌫', level:'BASIS', title:'Korrigieren und bestätigen', text:'Entferne das falsche x, ergänze ein ! und bestätige mit Enter.', how:'Backspace ⌫ löscht links vom Cursor. Shift ⇧ erzeugt das !. Enter ↵ bestätigt die fertige Eingabe.', location:'Backspace ⌫: oben rechts. Enter ↵: rechts mittig. Shift ⇧: unten links und rechts.', render:correctionTask },
    { skill:'DAS @-ZEICHEN', icon:'@', level:'BASIS', title:'Das @-Zeichen', text:'Tippe die Funkadresse vollständig ein.', how:'Auf einer deutschen Tastatur entsteht @ meistens mit AltGr und Q gleichzeitig.', location:'AltGr liegt rechts neben der Leertaste; Q links oben im Buchstabenfeld.', render:addressTask },
    { skill:'PFEILTASTEN', icon:'←', level:'BASIS', title:'Pfeiltasten', text:'Steuere dein Schiff mit den Pfeiltasten zum grünen Ziel.', how:'Jede Pfeiltaste bewegt das Schiff in die Richtung ihres Symbols: ← ↑ ↓ →.', location:'Die vier Pfeiltasten liegen als eigener Block unten rechts.', render:arrowTask },
    { skill:'ABSCHLUSSMISSION', icon:'★', level:'FINALE', title:'Alles in einer Mission', text:'Löse den gemischten Tastatur-Funkauftrag.', how:'Klein- und Großbuchstaben, Zahlen, Sonderzeichen, Backspace, Enter, @ und Pfeiltasten werden kombiniert.', location:'Achte auf die eingeblendeten Symbole und den nächsten Auftrag.', render:mixedKeyboardTask }
  ]
};

function updateSoundButton() {
  $('#soundButton').setAttribute('aria-pressed', String(soundOn));
  $('#soundIcon').textContent = soundOn ? '♪' : '×';
  $('#soundLabel').textContent = soundOn ? 'Ton an' : 'Stumm';
}

function tone(kind = 'good') {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = kind === 'bad' ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(kind === 'bad' ? 150 : 440, audioContext.currentTime);
    if (kind === 'finish') osc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + .22);
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.12, audioContext.currentTime + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .25);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + .27);
  } catch (_) { /* Audio remains optional. */ }
}

function showScreen(name) {
  app.home.classList.toggle('hidden', name !== 'home');
  app.game.classList.toggle('hidden', name !== 'game');
  app.result.classList.toggle('hidden', name !== 'result');
  $('#app').focus({ preventScroll: true });
}

function startMission(nextMode) {
  mode = nextMode;
  taskIndex = 0; attempts = 0; correct = 0; score = 0;
  startedAt = Date.now(); pausedTotal = 0; pauseStarted = 0;
  app.missionName.textContent = mode === 'mouse' ? 'MAUSMISSION' : 'TASTATURMISSION';
  showScreen('game');
  clearInterval(timerId);
  timerId = setInterval(updateTimer, 250);
  updateTimer();
  renderTask();
}

function updateTimer() {
  const pausedNow = pauseStarted ? Date.now() - pauseStarted : 0;
  const seconds = Math.floor((Date.now() - startedAt - pausedTotal - pausedNow) / 1000);
  app.timer.textContent = formatTime(seconds);
  if (seconds >= 300) finishMission(true);
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function resetField() {
  cleanups.forEach(fn => fn()); cleanups = [];
  app.field.replaceChildren();
  app.field.oncontextmenu = null;
  app.feedback.textContent = '';
  app.feedback.className = 'feedback';
  app.field.classList.remove('success-pulse');
  taskMisses = 0; taskFinished = false;
}

function renderTask() {
  resetField();
  const tasks = taskSets[mode];
  const task = tasks[taskIndex];
  currentTask = task;
  taskRendered = false;
  app.skill.textContent = task.skill;
  app.instructionIcon.textContent = task.icon;
  app.instruction.textContent = task.text;
  app.howToSymbol.textContent = task.icon;
  app.howToText.textContent = task.how;
  app.stepLabel.textContent = `${taskIndex + 1} / ${tasks.length}`;
  app.progress.style.width = `${(taskIndex / tasks.length) * 100}%`;
  showBriefing(task, true);
}

function showBriefing(task, launchTask = false) {
  app.field.querySelector('.briefing')?.remove();
  if (!pauseStarted) pauseStarted = Date.now();
  const overlay = document.createElement('div');
  overlay.className = 'briefing';
  const keyDetails = mode === 'keyboard'
    ? `<div class="briefing-keys"><span class="keycap">${task.icon}</span><span>${task.location}</span></div>`
    : `<div class="briefing-keys"><span class="mouse-mini">${task.icon}</span><span>${task.location}</span></div>`;
  overlay.innerHTML = `
    <div class="briefing-card" role="dialog" aria-modal="true" aria-labelledby="briefingTitle">
      <div class="briefing-top"><span class="eyebrow">${task.level} · ${task.skill}</span><span class="briefing-step">${taskIndex + 1}/${taskSets[mode].length}</span></div>
      <h3 id="briefingTitle">${task.title}</h3>
      <p>${task.how}</p>
      ${keyDetails}
      <button class="primary-button briefing-start">${launchTask ? 'Verstanden – los' : 'Weiterüben'}</button>
    </div>`;
  app.field.append(overlay);
  const start = overlay.querySelector('.briefing-start');
  start.addEventListener('click', () => {
    overlay.remove();
    if (pauseStarted) { pausedTotal += Date.now() - pauseStarted; pauseStarted = 0; }
    if (launchTask && !taskRendered) { taskRendered = true; task.render(); }
  });
  start.focus();
}

function note(success, message = '') {
  attempts++;
  if (success) { correct++; tone('good'); }
  else { taskMisses++; tone('bad'); }
  app.feedback.textContent = message;
  app.feedback.className = `feedback ${success ? 'good' : 'bad'}`;
}

function completeTask(message) {
  if (taskFinished) return;
  taskFinished = true;
  score += Math.max(60, 150 - taskMisses * 10);
  tone('finish');
  app.field.classList.add('success-pulse');
  app.feedback.textContent = message;
  app.feedback.className = 'feedback good';
  const button = $('#continueTemplate').content.firstElementChild.cloneNode(true);
  button.textContent = taskIndex === taskSets[mode].length - 1 ? 'Auswertung →' : 'Weiter →';
  button.addEventListener('click', () => {
    taskIndex++;
    taskIndex >= taskSets[mode].length ? finishMission(false) : renderTask();
  });
  app.field.append(button);
  button.focus();
}

function finishMission(timedOut) {
  if (!mode || app.game.classList.contains('hidden')) return;
  clearInterval(timerId); resetField();
  const pausedNow = pauseStarted ? Date.now() - pauseStarted : 0;
  const elapsed = Math.min(300, Math.floor((Date.now() - startedAt - pausedTotal - pausedNow) / 1000));
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  const completed = taskIndex >= taskSets[mode].length || (!timedOut && taskIndex === taskSets[mode].length - 1);
  if (elapsed < 240 && completed) score += 100;
  const result = { score, accuracy, elapsed, date: Date.now() };
  const key = `space-input-best-${mode}`;
  const old = JSON.parse(localStorage.getItem(key) || 'null');
  if (!old || score > old.score) localStorage.setItem(key, JSON.stringify(result));
  $('#resultTitle').textContent = timedOut ? 'Trainingszeit erreicht' : accuracy >= 90 ? 'Sternenstark!' : 'Mission geschafft!';
  $('#resultText').textContent = timedOut ? 'Dein Fortschritt ist gespeichert. Beim nächsten Flug geht es weiter.' : `${mode === 'mouse' ? 'Maus' : 'Tastatur'}-Mission abgeschlossen.`;
  $('#resultScore').textContent = score;
  $('#resultAccuracy').textContent = `${accuracy} %`;
  $('#resultTime').textContent = formatTime(elapsed);
  $('#resultBadge').textContent = accuracy >= 90 ? '★' : '✓';
  showScreen('result'); renderBest();
}

function goHome() {
  clearInterval(timerId); resetField(); pauseStarted = 0; mode = null; showScreen('home'); renderBest();
}

function renderBest() {
  const labels = { mouse: 'Maus', keyboard: 'Tastatur' };
  $('#bestRow').replaceChildren();
  Object.keys(labels).forEach(key => {
    const data = JSON.parse(localStorage.getItem(`space-input-best-${key}`) || 'null');
    if (!data) return;
    const pill = document.createElement('span');
    pill.className = 'best-pill';
    pill.textContent = `★ ${labels[key]}: ${data.score} Punkte`;
    $('#bestRow').append(pill);
  });
}

function randomPosition(size = 90, topPad = 20) {
  const width = Math.max(320, app.field.clientWidth);
  const height = Math.max(430, app.field.clientHeight);
  return { left: 20 + Math.random() * Math.max(0, width - size - 40), top: topPad + Math.random() * Math.max(0, height - size - topPad - 30) };
}

function hoverTask(hard = false) {
  const planets = hard
    ? [['Luna','🌕'], ['Io','🪐'], ['Titan','🌐'], ['Phobos','🌑'], ['Europa','🌗']]
    : [['Astra','🪐'], ['Nebula','🌐'], ['Komet','🌕']];
  const targets = hard ? ['Luna', 'Titan'] : ['Nebula'];
  const positions = hard ? [[9,58],[27,22],[47,57],[68,24],[84,58]] : [[14,55],[44,25],[74,58]];
  let found = 0;
  app.feedback.textContent = hard ? 'Gesucht: Luna und Titan' : 'Gesucht: Nebula';
  planets.forEach(([name, symbol], i) => {
    const planet = document.createElement('button');
    planet.className = `space-object planet ${hard ? 'compact' : ''}`;
    planet.style.left = `calc(${positions[i][0]}% - 50px)`;
    planet.style.top = `calc(${positions[i][1]}% - 50px)`;
    planet.innerHTML = `<span aria-hidden="true">${symbol}</span><span class="tooltip">Planet ${name}</span><span class="dwell-ring"></span>`;
    planet.setAttribute('aria-label', 'Unbekannter Planet');
    let dwellTimer;
    const enter = () => {
      planet.classList.add('dwelling');
      dwellTimer = setTimeout(() => { planet.classList.remove('dwelling'); planet.classList.add('revealed'); planet.setAttribute('aria-label', `Planet ${name}`); tone(); }, 800);
    };
    const leave = () => { clearTimeout(dwellTimer); planet.classList.remove('dwelling', 'revealed'); };
    planet.addEventListener('mouseenter', enter); planet.addEventListener('mouseleave', leave);
    planet.addEventListener('click', () => {
      if (!planet.classList.contains('revealed')) return note(false, 'Noch etwas länger auf dem Planeten verweilen.');
      if (targets.includes(name) && !planet.disabled) {
        planet.disabled = true; planet.style.opacity = '.22'; note(true);
        found++;
        if (found === targets.length) completeTask(hard ? 'Beide Monde sicher über ihre Tooltips erkannt.' : 'Nebula gefunden – ruhiges Hovern aktiviert Tooltips.');
      }
      else note(false, `Das ist ${name}. Suche weiter.`);
    });
    app.field.append(planet);
    cleanups.push(() => clearTimeout(dwellTimer));
  });
}

function clickTask(total = 5, hard = false) {
  let hits = 0;
  for (let i = 0; i < total; i++) {
    const orb = document.createElement('button'); orb.className = 'space-object orb';
    if (hard) orb.classList.add('drifting');
    const p = randomPosition(80); orb.style.left = `${p.left}px`; orb.style.top = `${p.top}px`;
    orb.setAttribute('aria-label', 'Energiekugel aktivieren');
    orb.style.setProperty('--drift', `${18 + Math.random() * 28}px`);
    orb.addEventListener('click', () => { if (orb.disabled) return; orb.disabled = true; orb.classList.remove('drifting'); orb.style.opacity = '.18'; note(true, `${++hits} von ${total} aktiviert`); if (hits === total) completeTask('Alle Energiekugeln sind online.'); });
    app.field.append(orb);
  }
  const miss = e => { if (e.target === app.field) note(false, 'Knapp daneben – direkt auf die Kugel klicken.'); };
  app.field.addEventListener('click', miss); cleanups.push(() => app.field.removeEventListener('click', miss));
}

function doubleClickTask(total = 3, hard = false) {
  let hits = 0;
  const spots = total === 2 ? [[28,48],[68,48]] : [[18,55],[47,24],[75,57]];
  spots.forEach(([x,y]) => {
    const crystal = document.createElement('button'); crystal.className = `space-object crystal ${hard ? 'small' : ''}`; crystal.textContent = '✦';
    crystal.style.left = `calc(${x}% - 42px)`; crystal.style.top = `calc(${y}% - 42px)`;
    crystal.setAttribute('aria-label', 'Kristall doppelklicken');
    crystal.addEventListener('click', () => { if (!crystal.disabled) app.feedback.textContent = 'Das war ein einzelner Klick – zweimal schnell klicken.'; });
    crystal.addEventListener('dblclick', e => { e.preventDefault(); if (crystal.disabled) return; crystal.disabled = true; crystal.style.opacity = '.2'; note(true, `${++hits} von ${total} geöffnet`); if (hits === total) completeTask('Perfekt – saubere Doppelklicks.'); });
    app.field.append(crystal);
  });
}

function rightClickTask(hard = false) {
  app.field.oncontextmenu = e => e.preventDefault();
  const missions = hard ? [{action:'Scannen',left:'28%'},{action:'Füttern',left:'66%'}] : [{action:'Begrüßen',left:'50%'}];
  let finished = 0;
  missions.forEach((mission,i) => {
    const alien = document.createElement('button'); alien.className = `space-object alien ${hard ? 'compact' : ''}`; alien.textContent = i ? '🤖' : '👾';
    alien.style.left = `calc(${mission.left} - 56px)`; alien.style.top = i ? '47%' : '34%'; alien.setAttribute('aria-label', `Figur – wünscht ${mission.action}`);
    const tag = document.createElement('span'); tag.className='wish-tag'; tag.textContent=mission.action; alien.append(tag);
    alien.addEventListener('click', () => note(false, 'Nutze zuerst die rechte Maustaste.'));
    alien.addEventListener('contextmenu', e => {
      e.preventDefault(); document.querySelector('.context-menu')?.remove();
      const menu = document.createElement('div'); menu.className = 'context-menu';
      const rect = app.field.getBoundingClientRect(); menu.style.left = `${Math.min(e.clientX - rect.left, rect.width - 190)}px`; menu.style.top = `${Math.min(e.clientY - rect.top, rect.height - 155)}px`;
      ['Begrüßen','Füttern','Scannen'].forEach(label => {
        const b = document.createElement('button'); b.textContent = label;
        b.addEventListener('click', () => {
          if (label === mission.action) { alien.disabled=true;alien.style.opacity='.25';note(true);finished++;if(finished===missions.length)completeTask('Alle passenden Aktionen ausgewählt.'); }
          else note(false, `Wähle „${mission.action}“.`);
          menu.remove();
        }); menu.append(b);
      });
      app.field.append(menu);
    });
    app.field.append(alien);
  });
}

function precisionTask(total = 5, hard = false) {
  let hits = 0;
  const target = document.createElement('button'); target.className = `space-object tiny-target ${hard ? 'micro' : ''}`; target.setAttribute('aria-label', 'Navigationspunkt');
  const move = () => { const p = randomPosition(45, 35); target.style.left = `${p.left}px`; target.style.top = `${p.top}px`; };
  target.addEventListener('click', e => { e.stopPropagation(); note(true, `${++hits} von ${total} getroffen`); if (hits === total) { target.remove(); completeTask('Navigation kalibriert – sehr präzise!'); } else move(); });
  const miss = () => note(false, 'Daneben – nimm dir einen Moment zum Zielen.');
  app.field.addEventListener('click', miss); cleanups.push(() => app.field.removeEventListener('click', miss));
  move(); app.field.append(target);
}

function dragTask(hard = false) {
  const docks = hard
    ? [{ type:'cyan', left:'7%' }, { type:'purple', left:'43%' }, { type:'pink', right:'7%' }]
    : [{ type:'cyan', left:'13%' }, { type:'purple', right:'13%' }];
  docks.forEach(d => { const el = document.createElement('div'); el.className = `dock ${d.type}`; el.textContent = 'LANDUNG'; Object.assign(el.style, d); el.dataset.type = d.type; app.field.append(el); });
  let placed = 0;
  const cargo = hard
    ? [{type:'cyan',x:22,y:22,label:'C1'},{type:'purple',x:48,y:40,label:'P2'},{type:'pink',x:72,y:18,label:'R3'}]
    : [{type:'cyan',x:35,y:45,label:'C1'},{type:'purple',x:58,y:30,label:'P2'}];
  cargo.forEach(item => {
    const box = document.createElement('div'); box.className = `cargo ${item.type} ${hard ? 'small' : ''}`; box.textContent = item.label; box.style.left = `${item.x}%`; box.style.top = `${item.y}%`; box.tabIndex = 0;
    let dragging = false, dx = 0, dy = 0;
    const down = e => { dragging = true; box.setPointerCapture(e.pointerId); const r = box.getBoundingClientRect(); dx = e.clientX-r.left; dy=e.clientY-r.top; };
    const move = e => { if (!dragging) return; const r=app.field.getBoundingClientRect(); box.style.left=`${Math.max(0,Math.min(r.width-box.offsetWidth,e.clientX-r.left-dx))}px`; box.style.top=`${Math.max(0,Math.min(r.height-box.offsetHeight,e.clientY-r.top-dy))}px`; };
    const up = () => { if (!dragging) return; dragging=false; const dock=app.field.querySelector(`.dock.${item.type}`); const a=box.getBoundingClientRect(), b=dock.getBoundingClientRect(); const inside=a.left>b.left-5&&a.right<b.right+5&&a.top>b.top-5&&a.bottom<b.bottom+5; if(inside){ box.style.left=`${dock.offsetLeft+(dock.offsetWidth-box.offsetWidth)/2}px`; box.style.top=`${dock.offsetTop+(dock.offsetHeight-box.offsetHeight)/2}px`; box.style.pointerEvents='none'; note(true,`${++placed} von ${cargo.length} gelandet`); if(placed===cargo.length) completeTask('Die Fracht ist sicher verstaut.'); } else note(false,'Diese Kiste gehört in die gleichfarbige Landezone.'); };
    box.addEventListener('pointerdown',down); box.addEventListener('pointermove',move); box.addEventListener('pointerup',up); app.field.append(box);
  });
}

function scrollTask(hard = false) {
  const shell=document.createElement('div');shell.className='scroll-shell';
  const header=document.createElement('div');header.className='scroll-header';header.innerHTML='<span>◉ BORDCOMPUTER</span><span>SCROLLRAD ↕</span>';
  const panel=document.createElement('div');panel.className='scroll-console';panel.tabIndex=0;panel.setAttribute('aria-label',hard?'Sternenregister':'Bordlogbuch');
  let wheelSeen=false,done=false;
  panel.addEventListener('wheel',()=>{wheelSeen=true;app.feedback.textContent='Scrollrad erkannt …';},{passive:true});
  if(!hard){
    const entries=['Startsystem geprüft','Antrieb bereit','Funkkanal geöffnet','Sternkarte geladen','Kurs berechnet','Meteoritenfeld passiert','Zielsystem erreicht'];
    entries.forEach((text,i)=>{const row=document.createElement('div');row.className='log-entry';row.innerHTML=`<b>0${i+1}</b><span>${text}</span>`;panel.append(row)});
    const finish=document.createElement('div');finish.className='scroll-finish';finish.innerHTML='<strong>✓ LOGBUCH VOLLSTÄNDIG</strong><span>Du hast das Ende erreicht.</span>';panel.append(finish);
    panel.addEventListener('scroll',()=>{if(!done&&wheelSeen&&panel.scrollTop+panel.clientHeight>=panel.scrollHeight-16){done=true;note(true);completeTask('Bis zum Ende gescrollt – Scrollrad gemeistert.')}});
  }else{
    const stations=['ALTAIR','SIRIUS','POLARIS','MIRA','DENEB','VEGA','RIGEL','ANTARES','CAPELLA'];
    stations.forEach((name,i)=>{const row=document.createElement('button');row.className=`station-row ${name==='VEGA'?'target-station':''}`;row.innerHTML=`<span>ST-${String(31+i).padStart(3,'0')}</span><strong>Station ${name}</strong><small>${(4.2+i*.7).toFixed(1)} LJ</small>`;row.addEventListener('click',()=>{if(!wheelSeen)return note(false,'Benutze zuerst das Scrollrad.');if(name==='VEGA'){note(true);completeTask('Station VEGA gefunden und ausgewählt.')}else note(false,`Das ist ${name}, gesucht ist VEGA.`)});panel.append(row)});
  }
  shell.append(header,panel);app.field.append(shell);setTimeout(()=>panel.focus(),60);
}

function wireTask(hard = false) {
  const wrap=document.createElement('div'); wrap.className='wire-wrap'; const canvas=document.createElement('canvas'); canvas.id='wireCanvas'; canvas.width=820; canvas.height=390; wrap.append(canvas); app.field.append(wrap);
  const ctx=canvas.getContext('2d');
  const path=hard ? [[55,320],[135,260],[205,305],[270,190],[355,245],[430,120],[510,205],[585,95],[665,155],[770,70]] : [[55,310],[190,260],[320,285],[450,180],[585,210],[770,90]];
  const corridor=hard ? 26 : 42;
  let active=false, probe=null;
  function draw(){ctx.clearRect(0,0,820,390);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(54,216,255,.15)';ctx.lineWidth=corridor*2;ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();ctx.strokeStyle='#36d8ff';ctx.lineWidth=4;ctx.setLineDash([7,11]);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#b9f34b';ctx.beginPath();ctx.arc(...path[0],26,0,Math.PI*2);ctx.fill();ctx.fillStyle='#071229';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('START',path[0][0],path[0][1]+4);ctx.fillStyle='#ff6ec7';ctx.beginPath();ctx.arc(...path.at(-1),27,0,Math.PI*2);ctx.fill();ctx.fillStyle='#071229';ctx.fillText('ZIEL',path.at(-1)[0],path.at(-1)[1]+4);if(active&&probe){ctx.fillStyle='#fff';ctx.shadowColor='#b9f34b';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(probe[0],probe[1],10,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
  const point=e=>{const r=canvas.getBoundingClientRect();return[(e.clientX-r.left)*820/r.width,(e.clientY-r.top)*390/r.height]};
  const segDist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1];const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy));};
  const distance=p=>Math.min(...path.slice(0,-1).map((a,i)=>segDist(p,a,path[i+1])));
  const deactivate=()=>{active=false;probe=null;canvas.classList.remove('wire-active');draw();};
  canvas.addEventListener('pointerdown',e=>{const p=point(e); if(Math.hypot(p[0]-path[0][0],p[1]-path[0][1])<35){active=true;probe=p;canvas.classList.add('wire-active');canvas.setPointerCapture(e.pointerId);draw();app.feedback.textContent='Impuls aktiv – der leuchtende Punkt ist jetzt dein Mauszeiger.';}else note(false,'Beginne im grünen START-Kreis.');});
  canvas.addEventListener('pointermove',e=>{if(!active)return;const p=point(e);probe=p;draw();if(distance(p)>corridor){deactivate();note(false,'Kontakt! Zurück zu START.');}else if(Math.hypot(p[0]-path.at(-1)[0],p[1]-path.at(-1)[1])<34){deactivate();note(true);completeTask('Impuls angekommen – der Kurs war sauber!');}});
  canvas.addEventListener('pointerup',()=>{if(active){deactivate();note(false,'Zu früh losgelassen – halte bis zum Ziel.');}}); draw();
}

function mixedMouseTask() {
  let stage = 0;
  const labels = ['Tooltip öffnen','Linksklick','Doppelklick','Rechtsklick','Genau klicken','Drag & Drop','Scrollrad','Heißer Draht'];
  const base = () => {
    app.field.replaceChildren();
    app.field.oncontextmenu = null;
    const status=document.createElement('div');status.className='mixed-status';status.textContent=`${stage+1}/8 · ${labels[stage]}`;app.field.append(status);
  };
  const next = () => { stage++; if(stage<8) renderStage(); };
  function renderStage() {
    base();
    if(stage===0){
      const p=document.createElement('button');p.className='space-object planet';p.style.left='calc(50% - 56px)';p.style.top='calc(48% - 56px)';p.innerHTML='<span>🪐</span><span class="tooltip">Code: NOVA</span><span class="dwell-ring"></span>';
      let t;p.addEventListener('mouseenter',()=>{p.classList.add('dwelling');t=setTimeout(()=>{p.classList.add('revealed');p.classList.remove('dwelling');note(true,'Tooltip gelesen: NOVA');setTimeout(next,450);},800)});p.addEventListener('mouseleave',()=>{clearTimeout(t);p.classList.remove('dwelling')});app.field.append(p);cleanups.push(()=>clearTimeout(t));
    } else if(stage===1){
      const o=document.createElement('button');o.className='space-object orb drifting';o.style.left='calc(50% - 35px)';o.style.top='44%';o.addEventListener('click',()=>{note(true);next()});app.field.append(o);
    } else if(stage===2){
      const c=document.createElement('button');c.className='space-object crystal small';c.textContent='✦';c.style.left='calc(50% - 42px)';c.style.top='40%';c.addEventListener('click',()=>{app.feedback.textContent='Zweimal schnell klicken.'});c.addEventListener('dblclick',()=>{note(true);next()});app.field.append(c);
    } else if(stage===3){
      app.field.oncontextmenu=e=>e.preventDefault();const a=document.createElement('button');a.className='space-object alien compact';a.textContent='👾';a.style.left='calc(50% - 56px)';a.style.top='36%';
      a.addEventListener('contextmenu',e=>{e.preventDefault();const menu=document.createElement('div');menu.className='context-menu';menu.style.left='calc(50% + 25px)';menu.style.top='43%';['Begrüßen','Scannen'].forEach(x=>{const b=document.createElement('button');b.textContent=x;b.addEventListener('click',()=>{if(x==='Scannen'){note(true);next()}else note(false,'Wähle „Scannen“.')});menu.append(b)});app.field.append(menu)});app.field.append(a);
    } else if(stage===4){
      const t=document.createElement('button');t.className='space-object tiny-target micro';t.style.left='calc(50% - 13px)';t.style.top='45%';t.addEventListener('click',()=>{note(true);next()});app.field.append(t);
    } else if(stage===5){
      const dock=document.createElement('div');dock.className='dock cyan';dock.style.right='17%';dock.textContent='ZIEL';const box=document.createElement('div');box.className='cargo cyan';box.textContent='C1';box.style.left='20%';box.style.top='40%';let drag=false,dx=0,dy=0;
      box.addEventListener('pointerdown',e=>{drag=true;box.setPointerCapture(e.pointerId);const r=box.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top});
      box.addEventListener('pointermove',e=>{if(!drag)return;const r=app.field.getBoundingClientRect();box.style.left=`${e.clientX-r.left-dx}px`;box.style.top=`${e.clientY-r.top-dy}px`});
      box.addEventListener('pointerup',()=>{drag=false;const a=box.getBoundingClientRect(),b=dock.getBoundingClientRect();if(a.left>b.left-5&&a.right<b.right+5&&a.top>b.top-5&&a.bottom<b.bottom+5){note(true);next()}else note(false,'Lege die Kiste vollständig im Ziel ab.')});app.field.append(dock,box);
    } else if(stage===6){
      const scroller=document.createElement('div');scroller.className='mini-scroller';scroller.tabIndex=0;let wheel=false;
      scroller.innerHTML='<div>START</div><div>↓ weiter scrollen ↓</div><div>Satellit 01</div><div>Satellit 02</div><div>Satellit 03</div><div class="mini-scroll-goal">✓ SCROLL-ZIEL</div>';
      scroller.addEventListener('wheel',()=>wheel=true,{passive:true});scroller.addEventListener('scroll',()=>{if(wheel&&scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-8){note(true);next()}});app.field.append(scroller);scroller.focus();
    } else {
      app.feedback.textContent='Letzter Schritt: sicher durch den Energiekorridor.';wireTask(true);
    }
  }
  renderStage();
}

function mixedKeyboardTask() {
  const target='orbitStern7@nova!';
  const wrap=document.createElement('div');wrap.className='key-display';const label=document.createElement('div');label.className='target-keys final-code';label.textContent=target;
  const input=document.createElement('input');input.className='type-input';input.value='orbitx';input.setAttribute('aria-label','Gemischten Code korrigieren und eingeben');
  const help=document.createElement('div');help.className='keyboard-hint';help.innerHTML='1. <span class="keycap">⌫</span> x löschen · 2. Code ergänzen · 3. <span class="keycap">Enter ↵</span>';
  wrap.append(label,input,help);app.field.append(wrap);input.focus();let backspace=false,shiftS=false,shiftBang=false;
  input.addEventListener('keydown',e=>{
    if(e.key==='Backspace'&&input.value==='orbitx')backspace=true;
    if(e.key==='S'&&e.shiftKey)shiftS=true;
    if(e.key==='!'&&e.shiftKey)shiftBang=true;
    if(e.key==='Enter'){
      e.preventDefault();
      if(input.value===target&&backspace&&shiftS&&shiftBang){note(true,'Code bestätigt. Jetzt folgt die Radar-Navigation.');app.field.replaceChildren();setTimeout(()=>finalArrowTask(),250)}
      else note(false,'Prüfe Code, Shift, Backspace und Enter.');
    }
  });
}

function sequenceTask(sequence, hint, requireShift=false) {
  const wrap=document.createElement('div');wrap.className='key-display';const display=document.createElement('div');display.className='target-keys';const help=document.createElement('div');help.className='keyboard-hint';help.textContent=hint;wrap.append(display,help);app.field.append(wrap);let index=0;
  const paint=()=>{display.innerHTML=sequence.map((c,i)=>`<span class="${i<index?'done':i===index?'current':''}">${c}</span>`).join('');};paint();
  const key=e=>{if(taskFinished)return;if(['Shift','AltGraph','Control','Alt'].includes(e.key))return;e.preventDefault();const expected=sequence[index];const valid=e.key===expected&&(!requireShift||e.shiftKey)&&!(requireShift&&e.getModifierState?.('CapsLock'));if(valid){note(true);index++;paint();if(index===sequence.length)completeTask('Code vollständig – alle Zeichen erkannt.');}else note(false,requireShift?'Halte Shift und tippe den markierten Buchstaben.':`Gesucht ist „${expected}“.`);};
  window.addEventListener('keydown',key);cleanups.push(()=>window.removeEventListener('keydown',key));
}

function correctionTask(){
  const wrap=document.createElement('div');wrap.className='key-display';const label=document.createElement('div');label.className='target-keys';label.textContent='Stern!';const input=document.createElement('input');input.className='type-input';input.value='Sternx';input.setAttribute('aria-label','Korrigiere Sternx zu Stern! und bestätige mit Enter');const help=document.createElement('div');help.className='keyboard-hint';help.innerHTML='<span class="keycap">Backspace</span> dann <span class="keycap">Shift</span> + <span class="keycap">1</span> und <span class="keycap">Enter</span>';wrap.append(label,input,help);app.field.append(wrap);input.focus();let backspaceUsed=false,shiftUsed=false;
  input.addEventListener('keydown',e=>{if(e.key==='Backspace'&&input.value==='Sternx'){backspaceUsed=true;note(true,'Fehler entfernt – jetzt das Ausrufezeichen.');}else if(e.key==='!'&&e.shiftKey){shiftUsed=true;}else if(e.key==='Enter'){e.preventDefault();if(input.value==='Stern!'&&backspaceUsed&&shiftUsed){note(true);completeTask('Korrigiert und bestätigt – perfekte Tastenkombination.');}else note(false,'Der fertige Code muss „Stern!“ lauten.');}});
}

function addressTask(){
  const target='nova@orbit.de';const wrap=document.createElement('div');wrap.className='key-display';const label=document.createElement('div');label.className='target-keys';label.textContent=target;const input=document.createElement('input');input.className='type-input';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','Funkadresse eingeben');const help=document.createElement('div');help.className='keyboard-hint';help.innerHTML='Deutsche Tastatur: meist <span class="keycap">AltGr</span> + <span class="keycap">Q</span>';wrap.append(label,input,help);app.field.append(wrap);input.focus();let previous='';
  input.addEventListener('input',()=>{if(input.value===target){note(true);completeTask('Funkadresse verbunden – das @ wurde erkannt.');return;}if(target.startsWith(input.value)){if(input.value.length>previous.length)note(true,'Weiter so …');}else{note(false,'Das Zeichen passt noch nicht. Mit Backspace kannst du korrigieren.');}previous=input.value;});
}

function arrowTask(){
  const wrap=document.createElement('div');wrap.className='key-display';const grid=document.createElement('div');grid.className='arrow-grid';const help=document.createElement('div');help.className='keyboard-hint';help.innerHTML='<span class="keycap">←</span><span class="keycap">↑</span><span class="keycap">↓</span><span class="keycap">→</span>';wrap.append(grid,help);app.field.append(wrap);let ship={x:0,y:3};const goal={x:4,y:0};const blocks=new Set(['2,1','2,2','2,3']);
  const paint=()=>{grid.replaceChildren();for(let y=0;y<4;y++)for(let x=0;x<5;x++){const cell=document.createElement('div');cell.className='grid-cell';if(blocks.has(`${x},${y}`))cell.textContent='◆';if(x===goal.x&&y===goal.y){cell.classList.add('goal');cell.textContent='★';}if(x===ship.x&&y===ship.y){cell.classList.add('ship');cell.textContent='▲';}grid.append(cell);}};paint();
  const key=e=>{const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!moves[e.key]||taskFinished)return;e.preventDefault();const [dx,dy]=moves[e.key],nx=ship.x+dx,ny=ship.y+dy;if(nx<0||nx>4||ny<0||ny>3||blocks.has(`${nx},${ny}`)){note(false,'Dort ist der Weg versperrt.');return;}ship={x:nx,y:ny};note(true);paint();if(nx===goal.x&&ny===goal.y)completeTask('Sicher gelandet – Pfeiltasten gemeistert!');};window.addEventListener('keydown',key);cleanups.push(()=>window.removeEventListener('keydown',key));
}

function finalArrowTask(){
  const directions=[
    {key:'ArrowUp',symbol:'↑',name:'oben',className:'north'},
    {key:'ArrowRight',symbol:'→',name:'rechts',className:'east'},
    {key:'ArrowDown',symbol:'↓',name:'unten',className:'south'},
    {key:'ArrowLeft',symbol:'←',name:'links',className:'west'},
    {key:'ArrowRight',symbol:'→',name:'rechts',className:'east'},
    {key:'ArrowUp',symbol:'↑',name:'oben',className:'north'}
  ];
  let index=0;
  const wrap=document.createElement('div');wrap.className='radar-wrap';
  const counter=document.createElement('div');counter.className='radar-counter';
  const radar=document.createElement('div');radar.className='radar';
  radar.innerHTML='<span class="radar-ring ring-one"></span><span class="radar-ring ring-two"></span><span class="radar-axis axis-x"></span><span class="radar-axis axis-y"></span><span class="radar-ship">▲</span><span class="radar-beacon">★</span>';
  const prompt=document.createElement('div');prompt.className='radar-prompt';wrap.append(counter,radar,prompt);app.field.append(wrap);
  const beacon=radar.querySelector('.radar-beacon');
  const paint=()=>{const d=directions[index];counter.textContent=`RADAR-PUNKT ${index+1} / ${directions.length}`;beacon.className=`radar-beacon ${d.className}`;prompt.innerHTML=`Fliege zum Signal <span class="keycap">${d.symbol}</span> ${d.name}`;};
  const key=e=>{if(taskFinished)return;const d=directions[index];if(!e.key.startsWith('Arrow'))return;e.preventDefault();if(e.key===d.key){note(true);index++;if(index===directions.length){completeTask('Radarroute abgeschlossen – alle Pfeilrichtungen sicher erkannt.')}else paint()}else note(false,`Das Signal liegt ${d.name}: ${d.symbol}`);};
  window.addEventListener('keydown',key);cleanups.push(()=>window.removeEventListener('keydown',key));paint();
}

document.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', () => startMission(button.dataset.start)));
$('#soundButton').addEventListener('click', () => { soundOn=!soundOn;localStorage.setItem('space-input-sound',soundOn?'on':'off');updateSoundButton();tone(); });
$('#helpButton').addEventListener('click', () => { if (currentTask) showBriefing(currentTask, false); });
$('#homeButton').addEventListener('click', goHome);$('#exitButton').addEventListener('click', goHome);$('#resultHomeButton').addEventListener('click', goHome);$('#replayButton').addEventListener('click',()=>startMission(mode));
updateSoundButton();renderBest();
