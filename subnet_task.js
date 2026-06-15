let subnetTask = null;

function startSubnetTask(options = {}) {
  const isTaskScreenActive = document.getElementById('subnet-task-screen')?.classList.contains('active');
  if (isTaskScreenActive && subnetTask?.dirty && !subnetTask.saved) {
    const ok = confirm('Создать новую задачу? Текущие введённые ответы будут потеряны.');
    if (!ok) return;
  }
  subnetTask = generateSubnetTask();
  subnetTask.examMode = Boolean(options.examMode);
  renderSubnetTask();
  showScreen('subnet-task-screen');
}

function exitSubnetTask() {
  if (subnetTask?.examMode) {
    const ok = confirm('Прервать экзамен и сохранить его как незавершённый?');
    if (!ok) return;
    if (typeof abortExamFromTask === 'function') abortExamFromTask();
    else showScreen('start-screen');
    return;
  }

  if (subnetTask?.dirty && !subnetTask.saved) {
    const ok = confirm('Выйти в меню? Текущая задача не будет сохранена.');
    if (!ok) return;
  }
  showScreen('start-screen');
}

function generateSubnetTask() {
  const thirdOctet = randomInt(10, 220);
  const poolNetwork = ipToInt(`192.168.${thirdOctet}.0`);
  const pool = makeSubnet(poolNetwork, 24);

  const segments = [
    {
      id: 'lanA',
      title: 'LAN-A',
      description: 'PC-A и интерфейс R1 LAN-A',
      hosts: randomFrom([42, 46, 50, 54, 58, 60])
    },
    {
      id: 'lanB',
      title: 'LAN-B',
      description: 'PC-B и интерфейс R2 LAN-B',
      hosts: randomFrom([18, 20, 22, 24, 26, 28, 30])
    },
    {
      id: 'link',
      title: 'R1-R2',
      description: 'Point-to-point линк между маршрутизаторами',
      hosts: 2
    }
  ].map(seg => {
    const prefix = requiredPrefix(seg.hosts);
    return {
      ...seg,
      prefix,
      mask: prefixToMask(prefix),
      capacity: usableHosts(prefix)
    };
  });

  const recommended = allocateRecommended(pool.network, segments);
  const byId = Object.fromEntries(recommended.map(item => [item.id, item]));
  const ips = {
    r1Lan: byId.lanA.network + 1,
    pcA: byId.lanA.network + 2,
    r1Link: byId.link.network + 1,
    r2Link: byId.link.network + 2,
    r2Lan: byId.lanB.network + 1,
    pcB: byId.lanB.network + 2
  };

  return {
    pool,
    segments,
    recommended,
    ips,
    startTime: Date.now(),
    saved: false,
    dirty: false
  };
}

function renderSubnetTask() {
  const el = document.getElementById('subnet-task-container');

  el.innerHTML = `
    ${renderProblemStatement()}
    ${renderMaskStage()}
    ${renderSubnetStage()}
    ${renderIpStage()}
    ${renderGatewayStage()}
    ${renderRouteStage()}
    ${renderFinalStage()}
  `;
}

function renderProblemStatement() {
  const { pool, segments } = subnetTask;
  const lanA = segments.find(seg => seg.id === 'lanA');
  const lanB = segments.find(seg => seg.id === 'lanB');
  const link = segments.find(seg => seg.id === 'link');

  return `
    <div class="task-card task-statement">
      <div class="task-kicker">Условие задачи</div>
      <h3>Дан пул ${subnetLabel(pool)}. Нужно построить адресный план для сети PC-A — R1 — R2 — PC-B</h3>

      <div class="task-topology" aria-label="Топология задачи">
        <span>PC-A</span>
        <i>LAN-A</i>
        <span>R1</span>
        <i>R1-R2</i>
        <span>R2</span>
        <i>LAN-B</i>
        <span>PC-B</span>
      </div>

      <div class="task-brief-grid">
        <div class="task-brief-block">
          <h4>Что дано</h4>
          <ul>
            <li>Один общий пул адресов: <strong>${subnetLabel(pool)}</strong>.</li>
            <li>Две пользовательские LAN-сети и один линк между роутерами.</li>
            <li>Для каждой сети известно минимальное число хостов.</li>
          </ul>
        </div>
        <div class="task-brief-block">
          <h4>Что нужно сделать</h4>
          <ul>
            <li>Разбить пул на подсети через VLSM, без пересечений.</li>
            <li>Назначить IP-адреса ПК и интерфейсам R1/R2.</li>
            <li>Указать default gateway на ПК и статические маршруты на роутерах.</li>
          </ul>
        </div>
      </div>

      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Сегмент</th><th>Что подключено</th><th>Минимум хостов</th><th>Что это значит</th></tr></thead>
          <tbody>
            <tr>
              <td>${lanA.title}</td>
              <td>${lanA.description}</td>
              <td>${lanA.hosts}</td>
              <td>Нужна подсеть для PC-A и интерфейса R1, плюс запас под указанное число хостов.</td>
            </tr>
            <tr>
              <td>${lanB.title}</td>
              <td>${lanB.description}</td>
              <td>${lanB.hosts}</td>
              <td>Отдельная LAN за R2. Она не должна пересекаться с LAN-A.</td>
            </tr>
            <tr>
              <td>${link.title}</td>
              <td>${link.description}</td>
              <td>${link.hosts}</td>
              <td>Point-to-point сеть только для двух интерфейсов: R1 link и R2 link.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="task-explain">
        <strong>Идея задачи:</strong> преподаватель проверяет не одну команду, а весь адресный план.
        Сначала выбирается размер подсетей, потом сами диапазоны, потом IP устройств, потом шлюзы и маршруты.
        Если перепутать порядок, легко назначить адрес из чужой подсети или прописать next-hop, до которого роутер физически не может добраться.
      </div>

      <div class="task-scoreline">
        <span>Маски: 4</span>
        <span>Подсети: 4</span>
        <span>IP: 4</span>
        <span>Шлюзы: 3</span>
        <span>Маршруты: 4</span>
        <span>Аккуратность: 1</span>
      </div>
    </div>
  `;
}

function renderMaskStage() {
  return `
    <div class="task-card">
      <h3>2. Выбери маски</h3>
      <div class="task-explain">
        На этом этапе ты ещё не выбираешь конкретные адреса вида 192.168.x.x.
        Нужно только понять, какой размер подсети нужен каждому сегменту.
        Например, если в LAN нужно 50 хостов, /27 не подойдёт, потому что даёт только 30 usable-адресов.
      </div>
      <div class="task-hint">Формула usable-адресов: <strong>2^h - 2</strong>, где h — число бит под хосты. Префикс: <strong>32 - h</strong>. Выбирай минимальную подходящую подсеть: не меньше нужного, но и не слишком большую.</div>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Сегмент</th><th>Нужно хостов</th><th>Префикс</th><th>Маска</th></tr></thead>
          <tbody>
            ${subnetTask.segments.map(seg => `
              <tr>
                <td>${seg.title}</td>
                <td>${seg.hosts}</td>
                <td>${taskInput(`mask-${seg.id}-prefix`, '/26')}</td>
                <td>${taskInput(`mask-${seg.id}-mask`, '255.255.255.192')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${stageActions('masks')}
    </div>
  `;
}

function renderSubnetStage() {
  return `
    <div class="task-card">
      <h3>3. Разложи подсети внутри пула</h3>
      <div class="task-explain">
        Теперь нужно взять общий пул и нарезать его на непересекающиеся диапазоны.
        Важно: адрес сети — это не любой удобный адрес, а начало блока.
        Broadcast — последний адрес этого блока. Обычным устройствам оба этих адреса назначать нельзя.
      </div>
      <div class="task-hint">Практичный порядок для VLSM: сначала самая большая LAN, потом меньшая LAN, потом /30 линк. Следующая подсеть начинается после broadcast предыдущей. Адрес сети должен попадать на границу блока: для /26 шаг 64, для /27 шаг 32, для /30 шаг 4.</div>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Сегмент</th><th>Сеть</th><th>Префикс</th><th>Broadcast</th></tr></thead>
          <tbody>
            ${subnetTask.segments.map(seg => `
              <tr>
                <td>${seg.title}</td>
                <td>${taskInput(`subnet-${seg.id}-network`, '192.168.x.0')}</td>
                <td>${taskInput(`subnet-${seg.id}-prefix`, `/${seg.prefix}`)}</td>
                <td>${taskInput(`subnet-${seg.id}-broadcast`, '192.168.x.63')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${stageActions('subnets')}
    </div>
  `;
}

function renderIpStage() {
  const rows = [
    ['R1 LAN-A', 'ip-r1Lan', 'в LAN-A'],
    ['PC-A', 'ip-pcA', 'в LAN-A'],
    ['R1 link', 'ip-r1Link', 'в R1-R2'],
    ['R2 link', 'ip-r2Link', 'в R1-R2'],
    ['R2 LAN-B', 'ip-r2Lan', 'в LAN-B'],
    ['PC-B', 'ip-pcB', 'в LAN-B']
  ];

  return `
    <div class="task-card">
      <h3>4. Назначь IP-адреса устройствам</h3>
      <div class="task-explain">
        Здесь ты заполняешь адреса конкретных интерфейсов.
        IP устройства должен лежать внутри той подсети, к которой это устройство подключено.
        У роутера R1 будет два адреса: один в LAN-A, второй на линке R1-R2.
        У R2 тоже два адреса: один на линке, второй в LAN-B.
      </div>
      <div class="task-hint">Можно выбрать любые usable-адреса внутри нужной подсети. Нельзя использовать адрес сети, broadcast и одинаковый IP на двух устройствах.</div>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Устройство</th><th>IP-адрес</th><th>Где должен находиться</th></tr></thead>
          <tbody>
            ${rows.map(([label, id, place]) => `<tr><td>${label}</td><td>${taskInput(id, '192.168.x.x')}</td><td>${place}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${stageActions('ips')}
    </div>
  `;
}

function renderGatewayStage() {
  return `
    <div class="task-card">
      <h3>5. Укажи шлюзы на ПК</h3>
      <div class="task-explain">
        Шлюз нужен только конечным ПК, чтобы отправлять пакеты в чужие сети.
        ПК не указывает адрес второго роутера и не указывает сеть целиком.
        Он указывает ближайший интерфейс своего роутера в своей LAN.
      </div>
      <div class="task-hint">Default gateway хоста — это IP интерфейса маршрутизатора в той же LAN. PC-A указывает на R1 LAN-A, PC-B указывает на R2 LAN-B.</div>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Хост</th><th>Default gateway</th></tr></thead>
          <tbody>
            <tr><td>PC-A</td><td>${taskInput('gw-pcA', 'IP R1 LAN-A')}</td></tr>
            <tr><td>PC-B</td><td>${taskInput('gw-pcB', 'IP R2 LAN-B')}</td></tr>
          </tbody>
        </table>
      </div>
      ${stageActions('gateways')}
    </div>
  `;
}

function renderRouteStage() {
  return `
    <div class="task-card">
      <h3>6. Пропиши статические маршруты</h3>
      <div class="task-explain">
        Каждый роутер сам знает только directly connected сети: свои LAN и общий линк.
        R1 не знает, где находится LAN-B, пока ты не укажешь маршрут через R2.
        R2 не знает LAN-A, пока ты не укажешь маршрут через R1.
        Next-hop должен быть адресом соседнего роутера на общей сети R1-R2.
      </div>
      <div class="task-hint">Connected-сети прописывать не нужно. R1 нужен маршрут к LAN-B через IP R2 на линке. R2 нужен маршрут к LAN-A через IP R1 на линке. В Cisco это выглядит как: <strong>ip route сеть маска next-hop</strong>.</div>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Роутер</th><th>Сеть назначения</th><th>Маска</th><th>Next-hop</th></tr></thead>
          <tbody>
            <tr><td>R1</td><td>${taskInput('route-r1-network', 'LAN-B network')}</td><td>${taskInput('route-r1-mask', 'LAN-B mask')}</td><td>${taskInput('route-r1-next', 'R2 link IP')}</td></tr>
            <tr><td>R2</td><td>${taskInput('route-r2-network', 'LAN-A network')}</td><td>${taskInput('route-r2-mask', 'LAN-A mask')}</td><td>${taskInput('route-r2-next', 'R1 link IP')}</td></tr>
          </tbody>
        </table>
      </div>
      ${stageActions('routes')}
    </div>
  `;
}

function renderFinalStage() {
  const buttonText = subnetTask.examMode ? 'Проверить задачу и завершить экзамен' : 'Проверить всю задачу';
  return `
    <div class="task-card">
      <h3>7. Итоговая проверка</h3>
      <div class="task-explain">
        Финальная проверка смотрит не только “похожи ли числа на правильные”.
        Она проверяет логику: достаточно ли хостов, нет ли пересечений подсетей,
        не назначены ли network/broadcast адреса устройствам, достижим ли next-hop и есть ли обратный маршрут.
      </div>
      <div class="task-hint">Итог оценивается как экзаменационная задача: маски, подсети, IP-адреса, шлюзы, маршруты и аккуратность адресного плана.</div>
      <div class="task-actions">
        <button class="btn-primary" type="button" onclick="checkSubnetTaskFinal()">${buttonText}</button>
      </div>
      <div class="task-feedback" id="task-feedback-final"></div>
    </div>
  `;
}

function taskInput(id, placeholder) {
  return `<input class="task-input" id="task-${id}" autocomplete="off" placeholder="${placeholder}" oninput="markSubnetTaskDirty()">`;
}

function markSubnetTaskDirty() {
  if (subnetTask) subnetTask.dirty = true;
}

function stageActions(stage) {
  return `
    <div class="task-actions">
      <button class="btn-submit" type="button" onclick="checkSubnetStage('${stage}')">Проверить этап</button>
    </div>
    <div class="task-feedback" id="task-feedback-${stage}"></div>
  `;
}

function checkSubnetStage(stage) {
  const result = evaluateSubnetStage(stage);
  renderTaskFeedback(`task-feedback-${stage}`, result);
}

function evaluateSubnetStage(stage) {
  if (stage === 'masks') return evaluateMasks();
  if (stage === 'subnets') return evaluateSubnets();
  if (stage === 'ips') return evaluateIps();
  if (stage === 'gateways') return evaluateGateways();
  if (stage === 'routes') return evaluateRoutes();
  return { ok: false, score: 0, max: 0, messages: ['Неизвестный этап проверки.'] };
}

function evaluateMasks() {
  const messages = [];
  let correct = 0;

  subnetTask.segments.forEach(seg => {
    const prefix = parsePrefix(readTaskValue(`mask-${seg.id}-prefix`));
    const maskPrefix = parseMaskPrefix(readTaskValue(`mask-${seg.id}-mask`));

    if (prefix === seg.prefix && maskPrefix === seg.prefix) {
      correct++;
      return;
    }

    const formula = `${seg.hosts} хостов: нужно минимум ${seg.capacity}, значит ${prefixLabel(seg.prefix)} / ${seg.mask}`;
    if (prefix !== seg.prefix) messages.push(`${seg.title}: неверный префикс. ${formula}.`);
    if (maskPrefix !== seg.prefix) messages.push(`${seg.title}: неверная маска. Для ${prefixLabel(seg.prefix)} нужна ${seg.mask}.`);
  });

  return {
    ok: correct === subnetTask.segments.length,
    score: round1(correct * 4 / subnetTask.segments.length),
    max: 4,
    messages: messages.length ? messages : ['Маски выбраны верно.']
  };
}

function evaluateSubnets() {
  const parsed = parseUserSubnets();
  const messages = [...parsed.messages];
  let correctSegments = 0;

  subnetTask.segments.forEach(seg => {
    const user = parsed.byId[seg.id];
    if (user?.valid) correctSegments++;
  });

  if (!parsed.noOverlap) messages.push('Подсети пересекаются. Размести их разными диапазонами внутри исходного пула.');
  if (!parsed.allInsidePool) messages.push(`Все подсети должны полностью помещаться в исходный пул ${subnetLabel(subnetTask.pool)}.`);

  const score = round1(correctSegments * 3 / subnetTask.segments.length + (parsed.noOverlap && parsed.allInsidePool ? 1 : 0));
  return {
    ok: correctSegments === subnetTask.segments.length && parsed.noOverlap && parsed.allInsidePool,
    score,
    max: 4,
    messages: messages.length ? messages : ['Подсети корректны: границы, broadcast, префиксы и пересечения проверены.'],
    parsed
  };
}

function evaluateIps() {
  const subnets = parseUserSubnets();
  const values = getIpValues();
  const messages = [];
  let score = 0;

  const checks = [
    ['r1Lan', 'R1 LAN-A', 'lanA'],
    ['pcA', 'PC-A', 'lanA'],
    ['r1Link', 'R1 link', 'link'],
    ['r2Link', 'R2 link', 'link'],
    ['r2Lan', 'R2 LAN-B', 'lanB'],
    ['pcB', 'PC-B', 'lanB']
  ];

  checks.forEach(([key, label, segId]) => {
    const ip = values[key];
    const subnet = subnets.byId[segId];

    if (ip == null) {
      messages.push(`${label}: IP-адрес не заполнен или записан неверно.`);
      return;
    }
    if (!subnet?.valid) {
      messages.push(`${label}: сначала исправь подсеть ${segmentTitle(segId)}.`);
      return;
    }
    if (!isUsableInSubnet(ip, subnet)) {
      messages.push(`${label}: адрес должен быть usable-адресом внутри ${segmentTitle(segId)}, не адресом сети и не broadcast.`);
      return;
    }
    score += 0.5;
  });

  const ipList = Object.values(values).filter(v => v != null);
  const unique = new Set(ipList).size === ipList.length && ipList.length === 6;
  if (unique) score += 1;
  else messages.push('IP-адреса устройств должны быть заполнены без повторов.');

  return {
    ok: score === 4,
    score: round1(score),
    max: 4,
    messages: messages.length ? messages : ['IP-адреса устройств корректны и не пересекаются.']
  };
}

function evaluateGateways() {
  const subnets = parseUserSubnets();
  const ips = getIpValues();
  const pcAGw = parseIp(readTaskValue('gw-pcA'));
  const pcBGw = parseIp(readTaskValue('gw-pcB'));
  const messages = [];
  let score = 0;

  if (!subnets.byId.lanA?.valid || !isUsableInSubnet(ips.r1Lan, subnets.byId.lanA)) {
    messages.push('PC-A: сначала исправь подсеть LAN-A и IP интерфейса R1 LAN-A, иначе gateway нельзя проверить надёжно.');
  } else if (pcAGw === ips.r1Lan) {
    score += 1.5;
  } else {
    messages.push('PC-A: default gateway должен совпадать с IP интерфейса R1 LAN-A.');
  }

  if (!subnets.byId.lanB?.valid || !isUsableInSubnet(ips.r2Lan, subnets.byId.lanB)) {
    messages.push('PC-B: сначала исправь подсеть LAN-B и IP интерфейса R2 LAN-B, иначе gateway нельзя проверить надёжно.');
  } else if (pcBGw === ips.r2Lan) {
    score += 1.5;
  } else {
    messages.push('PC-B: default gateway должен совпадать с IP интерфейса R2 LAN-B.');
  }

  return {
    ok: score === 3,
    score,
    max: 3,
    messages: messages.length ? messages : ['Шлюзы указаны верно.']
  };
}

function evaluateRoutes() {
  const subnets = parseUserSubnets();
  const ips = getIpValues();
  const r1 = readRoute('r1');
  const r2 = readRoute('r2');
  const messages = [];
  let score = 0;

  if (!subnets.byId.link?.valid || !isUsableInSubnet(ips.r2Link, subnets.byId.link)) {
    messages.push('R1: сначала исправь подсеть R1-R2 и IP R2 на этом линке, иначе next-hop нельзя проверить надёжно.');
  } else if (isRouteCorrect(r1, subnets.byId.lanB, ips.r2Link)) {
    score += 2;
  } else {
    messages.push('R1: нужен маршрут к LAN-B через IP R2 на линке R1-R2.');
  }

  if (!subnets.byId.link?.valid || !isUsableInSubnet(ips.r1Link, subnets.byId.link)) {
    messages.push('R2: сначала исправь подсеть R1-R2 и IP R1 на этом линке, иначе next-hop нельзя проверить надёжно.');
  } else if (isRouteCorrect(r2, subnets.byId.lanA, ips.r1Link)) {
    score += 2;
  } else {
    messages.push('R2: нужен маршрут к LAN-A через IP R1 на линке R1-R2.');
  }

  return {
    ok: score === 4,
    score,
    max: 4,
    messages: messages.length ? messages : ['Статические маршруты указаны верно.']
  };
}

function checkSubnetTaskFinal() {
  const masks = evaluateMasks();
  const subnets = evaluateSubnets();
  const ips = evaluateIps();
  const gateways = evaluateGateways();
  const routes = evaluateRoutes();
  const clean = getCleanScore(subnets, ips);
  const total = round1(masks.score + subnets.score + ips.score + gateways.score + routes.score + clean.score);
  const allMessages = [
    ...messagesForFinal('Маски', masks),
    ...messagesForFinal('Подсети', subnets),
    ...messagesForFinal('IP-адреса', ips),
    ...messagesForFinal('Шлюзы', gateways),
    ...messagesForFinal('Маршруты', routes),
    ...messagesForFinal('Аккуратность', clean)
  ];

  const html = `
    <div class="task-total-score">${total} / 20</div>
    <div class="task-score">
      ${scoreTile('Маски', masks.score, masks.max)}
      ${scoreTile('Подсети', subnets.score, subnets.max)}
      ${scoreTile('IP', ips.score, ips.max)}
      ${scoreTile('Шлюзы', gateways.score, gateways.max)}
      ${scoreTile('Маршруты', routes.score, routes.max)}
      ${scoreTile('Аккуратность', clean.score, clean.max)}
    </div>
    <div>${allMessages.length ? `<ul>${allMessages.map(msg => `<li>${msg}</li>`).join('')}</ul>` : 'Всё сделано корректно.'}</div>
    ${renderSubnetSolution()}
  `;

  const finalEl = document.getElementById('task-feedback-final');
  finalEl.className = `task-feedback show ${total >= 18 ? 'ok' : 'bad'}`;
  finalEl.innerHTML = html;

  if (!subnetTask.saved) {
    if (subnetTask.examMode && typeof finishExamFromTask === 'function') {
      const examFinal = finishExamFromTask(total);
      if (examFinal) {
        finalEl.innerHTML += `
          <div class="task-actions">
            <button class="btn-primary" type="button" onclick="showExamResultScreen()">Показать итог экзамена</button>
            <span class="task-mini-value">${examFinal.totalPoints} / 100 баллов</span>
          </div>
        `;
      }
    } else {
      saveSubnetTaskResult(total);
    }
    subnetTask.saved = true;
    subnetTask.dirty = false;
  }
}

function getCleanScore(subnetsResult, ipsResult) {
  const ok = subnetsResult.parsed?.noOverlap && subnetsResult.parsed?.allInsidePool && ipsResult.score === 4;
  return {
    ok,
    score: ok ? 1 : 0,
    max: 1,
    messages: ok ? ['Адресный план аккуратный: нет пересечений, дублей и адресов сети/broadcast на устройствах.'] : ['Есть пересечения, дубли, неверные IP или адреса вне допустимых диапазонов.']
  };
}

function saveSubnetTaskResult(points) {
  if (typeof saveSession !== 'function') return;
  const elapsed = Math.round((Date.now() - subnetTask.startTime) / 1000);
  saveSession({
    correct: points,
    total: 20,
    score: taskGrade(points),
    elapsed,
    topicMap: {
      'Задача 8 лабы': { ok: points, total: 20 }
    },
    date: Date.now(),
    modeId: 'subnet-task',
    modeName: 'Задача 8 лабы',
    completed: true
  });
  if (typeof renderHistoryTable === 'function') renderHistoryTable();
}

function renderTaskFeedback(id, result) {
  const el = document.getElementById(id);
  el.className = `task-feedback show ${result.ok ? 'ok' : 'bad'}`;
  el.innerHTML = `
    <strong>${result.score} / ${result.max}</strong>
    <ul>${result.messages.map(msg => `<li>${msg}</li>`).join('')}</ul>
  `;
}

function renderSubnetSolution() {
  const subRows = subnetTask.recommended.map(seg => `
    <tr>
      <td>${seg.title}</td>
      <td>${subnetLabel(seg)}</td>
      <td>${seg.mask}</td>
      <td>${intToIp(seg.broadcast)}</td>
      <td>${intToIp(seg.network + 1)} - ${intToIp(seg.broadcast - 1)}</td>
    </tr>
  `).join('');

  const byId = Object.fromEntries(subnetTask.recommended.map(seg => [seg.id, seg]));
  const { ips } = subnetTask;
  const routeR1 = `ip route ${intToIp(byId.lanB.network)} ${byId.lanB.mask} ${intToIp(ips.r2Link)}`;
  const routeR2 = `ip route ${intToIp(byId.lanA.network)} ${byId.lanA.mask} ${intToIp(ips.r1Link)}`;

  return `
    <div class="task-card" style="margin-top:1rem">
      <h3>Эталонный вариант</h3>
      <p style="color:var(--text-dim);font-size:.88rem">IP-адреса устройств могут быть другими, если они usable, не повторяются и шлюзы/маршруты указывают на выбранные тобой адреса роутеров.</p>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Сегмент</th><th>Сеть</th><th>Маска</th><th>Broadcast</th><th>Usable-диапазон</th></tr></thead>
          <tbody>${subRows}</tbody>
        </table>
      </div>
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Устройство</th><th>IP</th></tr></thead>
          <tbody>
            <tr><td>R1 LAN-A</td><td>${intToIp(ips.r1Lan)}</td></tr>
            <tr><td>PC-A</td><td>${intToIp(ips.pcA)}</td></tr>
            <tr><td>R1 link</td><td>${intToIp(ips.r1Link)}</td></tr>
            <tr><td>R2 link</td><td>${intToIp(ips.r2Link)}</td></tr>
            <tr><td>R2 LAN-B</td><td>${intToIp(ips.r2Lan)}</td></tr>
            <tr><td>PC-B</td><td>${intToIp(ips.pcB)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="task-cisco">R1(config)# ${routeR1}
R2(config)# ${routeR2}</div>
    </div>
  `;
}

function parseUserSubnets() {
  const byId = {};
  const messages = [];
  let allInsidePool = true;

  subnetTask.segments.forEach(seg => {
    const network = parseIp(readTaskValue(`subnet-${seg.id}-network`));
    const prefix = parsePrefix(readTaskValue(`subnet-${seg.id}-prefix`));
    const broadcast = parseIp(readTaskValue(`subnet-${seg.id}-broadcast`));
    const item = { id: seg.id, title: seg.title, network, prefix, broadcast, valid: false };

    if (network == null || prefix == null || broadcast == null) {
      messages.push(`${seg.title}: заполни сеть, префикс и broadcast корректными значениями.`);
      byId[seg.id] = item;
      allInsidePool = false;
      return;
    }

    const expectedBroadcast = broadcastOf(network, prefix);
    const isNetworkAddress = networkOf(network, prefix) === network;
    const insidePool = network >= subnetTask.pool.network && expectedBroadcast <= subnetTask.pool.broadcast;
    const prefixOk = prefix === seg.prefix;
    const broadcastOk = expectedBroadcast === broadcast;

    if (!prefixOk) messages.push(`${seg.title}: для ${seg.hosts} хостов нужен префикс ${prefixLabel(seg.prefix)}, а не ${prefixLabel(prefix)}.`);
    if (!isNetworkAddress) messages.push(`${seg.title}: ${intToIp(network)} не является адресом сети для ${prefixLabel(prefix)}.`);
    if (!broadcastOk) messages.push(`${seg.title}: broadcast должен быть ${intToIp(expectedBroadcast)}.`);
    if (!insidePool) {
      messages.push(`${seg.title}: подсеть должна находиться внутри ${subnetLabel(subnetTask.pool)}.`);
      allInsidePool = false;
    }

    item.valid = prefixOk && isNetworkAddress && broadcastOk && insidePool;
    byId[seg.id] = item;
  });

  const validSubnets = Object.values(byId).filter(s => s.network != null && s.broadcast != null);
  const noOverlap = !hasOverlap(validSubnets);
  return { byId, messages, noOverlap, allInsidePool };
}

function getIpValues() {
  return {
    r1Lan: parseIp(readTaskValue('ip-r1Lan')),
    pcA: parseIp(readTaskValue('ip-pcA')),
    r1Link: parseIp(readTaskValue('ip-r1Link')),
    r2Link: parseIp(readTaskValue('ip-r2Link')),
    r2Lan: parseIp(readTaskValue('ip-r2Lan')),
    pcB: parseIp(readTaskValue('ip-pcB'))
  };
}

function readRoute(router) {
  return {
    network: parseIp(readTaskValue(`route-${router}-network`)),
    maskPrefix: parseMaskPrefix(readTaskValue(`route-${router}-mask`)),
    next: parseIp(readTaskValue(`route-${router}-next`))
  };
}

function isRouteCorrect(route, targetSubnet, expectedNextHop) {
  if (!targetSubnet?.valid) return false;
  return route.network === targetSubnet.network
    && route.maskPrefix === targetSubnet.prefix
    && route.next === expectedNextHop;
}

function isUsableInSubnet(ip, subnet) {
  return ip > subnet.network && ip < subnet.broadcast;
}

function readTaskValue(id) {
  return document.getElementById(`task-${id}`)?.value.trim() || '';
}

function scoreTile(label, score, max) {
  return `<div class="task-score-item"><strong>${score}/${max}</strong><span>${label}</span></div>`;
}

function messagesForFinal(label, result) {
  return result.ok ? [] : result.messages.map(msg => `${label}: ${msg}`);
}

function taskGrade(points) {
  const pct = points / 20;
  if (pct >= 0.9) return 5;
  if (pct >= 0.75) return 4;
  if (pct >= 0.6) return 3;
  if (pct >= 0.4) return 2;
  if (pct > 0) return 1;
  return 0;
}

function allocateRecommended(baseNetwork, segments) {
  let cursor = baseNetwork;
  return [...segments]
    .sort((a, b) => a.prefix - b.prefix)
    .map(seg => {
      const size = blockSize(seg.prefix);
      const network = alignUp(cursor, size);
      cursor = network + size;
      return { ...seg, ...makeSubnet(network, seg.prefix) };
    });
}

function makeSubnet(network, prefix) {
  return {
    network,
    prefix,
    mask: prefixToMask(prefix),
    broadcast: broadcastOf(network, prefix)
  };
}

function requiredPrefix(hosts) {
  for (let hostBits = 1; hostBits <= 30; hostBits++) {
    if ((2 ** hostBits) - 2 >= hosts) return 32 - hostBits;
  }
  return 0;
}

function usableHosts(prefix) {
  return (2 ** (32 - prefix)) - 2;
}

function blockSize(prefix) {
  return 2 ** (32 - prefix);
}

function alignUp(value, size) {
  return Math.ceil(value / size) * size;
}

function networkOf(ip, prefix) {
  const size = blockSize(prefix);
  return Math.floor(ip / size) * size;
}

function broadcastOf(network, prefix) {
  return networkOf(network, prefix) + blockSize(prefix) - 1;
}

function prefixToMask(prefix) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return intToIp(mask);
}

function parseMaskPrefix(value) {
  if (!value) return null;
  if (value.trim().startsWith('/')) return parsePrefix(value);
  const mask = parseIp(value);
  if (mask == null) return null;

  let seenZero = false;
  let prefix = 0;
  for (let bit = 31; bit >= 0; bit--) {
    const isOne = Boolean(mask & (1 << bit));
    if (isOne && seenZero) return null;
    if (isOne) prefix++;
    else seenZero = true;
  }
  return prefix;
}

function parsePrefix(value) {
  const normalized = String(value || '').trim().replace(/^\//, '');
  if (!/^\d+$/.test(normalized)) return null;
  const prefix = Number(normalized);
  return prefix >= 0 && prefix <= 32 ? prefix : null;
}

function parseIp(value) {
  const parts = String(value || '').trim().split('.');
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    result = (result << 8) + n;
  }
  return result >>> 0;
}

function ipToInt(ip) {
  const parsed = parseIp(ip);
  if (parsed == null) throw new Error(`Invalid IP: ${ip}`);
  return parsed;
}

function intToIp(value) {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ].join('.');
}

function subnetLabel(subnet) {
  return `${intToIp(subnet.network)}/${subnet.prefix}`;
}

function prefixLabel(prefix) {
  return prefix == null ? 'неверный префикс' : `/${prefix}`;
}

function hasOverlap(subnets) {
  const sorted = [...subnets].sort((a, b) => a.network - b.network);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].network <= sorted[i - 1].broadcast) return true;
  }
  return false;
}

function segmentTitle(id) {
  return subnetTask.segments.find(seg => seg.id === id)?.title || id;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(items) {
  return items[randomInt(0, items.length - 1)];
}
