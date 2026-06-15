let subnetTask = null;

const LAN_HOST_PROFILES = {
  tiny: { prefix: 29, min: 3, max: 6 },
  small: { prefix: 28, min: 7, max: 14 },
  medium: { prefix: 27, min: 15, max: 30 },
  large: { prefix: 26, min: 31, max: 62 },
  xlarge: { prefix: 25, min: 63, max: 120 }
};

const SUBNET_TASK_TEMPLATES = [
  {
    id: 'two-router-two-lan',
    title: '2 LAN + 1 линк',
    routers: ['R1', 'R2'],
    topologyLines: [
      [
        { type: 'node', label: 'PC-A' },
        { type: 'link', label: 'LAN-A' },
        { type: 'node', label: 'R1' },
        { type: 'link', label: 'R1-R2' },
        { type: 'node', label: 'R2' },
        { type: 'link', label: 'LAN-B' },
        { type: 'node', label: 'PC-B' }
      ]
    ],
    segmentDefs: [
      { id: 'lan-a', type: 'lan', title: 'LAN-A', router: 'R1', host: 'PC-A', profiles: ['small', 'medium', 'large', 'xlarge'] },
      { id: 'lan-b', type: 'lan', title: 'LAN-B', router: 'R2', host: 'PC-B', profiles: ['tiny', 'small', 'medium', 'large', 'xlarge'] },
      { id: 'link-r1-r2', type: 'link', title: 'R1-R2', routers: ['R1', 'R2'] }
    ],
    routeDefs: [
      { router: 'R1', destinationSegmentId: 'lan-b', viaRouter: 'R2', viaSegmentId: 'link-r1-r2' },
      { router: 'R2', destinationSegmentId: 'lan-a', viaRouter: 'R1', viaSegmentId: 'link-r1-r2' }
    ]
  },
  {
    id: 'two-router-three-lan-r2',
    title: '3 LAN + 1 линк',
    routers: ['R1', 'R2'],
    topologyLines: [
      [
        { type: 'node', label: 'PC-A' },
        { type: 'link', label: 'LAN-A' },
        { type: 'node', label: 'R1' },
        { type: 'link', label: 'R1-R2' },
        { type: 'node', label: 'R2' },
        { type: 'link', label: 'LAN-B' },
        { type: 'node', label: 'PC-B' }
      ],
      [
        { type: 'node', label: 'R2' },
        { type: 'link', label: 'LAN-C' },
        { type: 'node', label: 'PC-C' }
      ]
    ],
    segmentDefs: [
      { id: 'lan-a', type: 'lan', title: 'LAN-A', router: 'R1', host: 'PC-A', profiles: ['small', 'medium', 'large', 'xlarge'] },
      { id: 'lan-b', type: 'lan', title: 'LAN-B', router: 'R2', host: 'PC-B', profiles: ['tiny', 'small', 'medium', 'large'] },
      { id: 'lan-c', type: 'lan', title: 'LAN-C', router: 'R2', host: 'PC-C', profiles: ['tiny', 'small', 'medium', 'large'] },
      { id: 'link-r1-r2', type: 'link', title: 'R1-R2', routers: ['R1', 'R2'] }
    ],
    routeDefs: [
      { router: 'R1', destinationSegmentId: 'lan-b', viaRouter: 'R2', viaSegmentId: 'link-r1-r2' },
      { router: 'R1', destinationSegmentId: 'lan-c', viaRouter: 'R2', viaSegmentId: 'link-r1-r2' },
      { router: 'R2', destinationSegmentId: 'lan-a', viaRouter: 'R1', viaSegmentId: 'link-r1-r2' }
    ]
  },
  {
    id: 'two-router-three-lan-r1',
    title: '3 LAN + 1 линк',
    routers: ['R1', 'R2'],
    topologyLines: [
      [
        { type: 'node', label: 'PC-A' },
        { type: 'link', label: 'LAN-A' },
        { type: 'node', label: 'R1' },
        { type: 'link', label: 'R1-R2' },
        { type: 'node', label: 'R2' },
        { type: 'link', label: 'LAN-B' },
        { type: 'node', label: 'PC-B' }
      ],
      [
        { type: 'node', label: 'R1' },
        { type: 'link', label: 'LAN-C' },
        { type: 'node', label: 'PC-C' }
      ]
    ],
    segmentDefs: [
      { id: 'lan-a', type: 'lan', title: 'LAN-A', router: 'R1', host: 'PC-A', profiles: ['tiny', 'small', 'medium', 'large'] },
      { id: 'lan-b', type: 'lan', title: 'LAN-B', router: 'R2', host: 'PC-B', profiles: ['small', 'medium', 'large', 'xlarge'] },
      { id: 'lan-c', type: 'lan', title: 'LAN-C', router: 'R1', host: 'PC-C', profiles: ['tiny', 'small', 'medium', 'large'] },
      { id: 'link-r1-r2', type: 'link', title: 'R1-R2', routers: ['R1', 'R2'] }
    ],
    routeDefs: [
      { router: 'R1', destinationSegmentId: 'lan-b', viaRouter: 'R2', viaSegmentId: 'link-r1-r2' },
      { router: 'R2', destinationSegmentId: 'lan-a', viaRouter: 'R1', viaSegmentId: 'link-r1-r2' },
      { router: 'R2', destinationSegmentId: 'lan-c', viaRouter: 'R1', viaSegmentId: 'link-r1-r2' }
    ]
  },
  {
    id: 'three-router-transit',
    title: '2 LAN + 2 router-link',
    routers: ['R1', 'R2', 'R3'],
    topologyLines: [
      [
        { type: 'node', label: 'PC-A' },
        { type: 'link', label: 'LAN-A' },
        { type: 'node', label: 'R1' },
        { type: 'link', label: 'R1-R2' },
        { type: 'node', label: 'R2' },
        { type: 'link', label: 'R2-R3' },
        { type: 'node', label: 'R3' },
        { type: 'link', label: 'LAN-B' },
        { type: 'node', label: 'PC-B' }
      ]
    ],
    segmentDefs: [
      { id: 'lan-a', type: 'lan', title: 'LAN-A', router: 'R1', host: 'PC-A', profiles: ['small', 'medium', 'large', 'xlarge'] },
      { id: 'lan-b', type: 'lan', title: 'LAN-B', router: 'R3', host: 'PC-B', profiles: ['tiny', 'small', 'medium', 'large', 'xlarge'] },
      { id: 'link-r1-r2', type: 'link', title: 'R1-R2', routers: ['R1', 'R2'] },
      { id: 'link-r2-r3', type: 'link', title: 'R2-R3', routers: ['R2', 'R3'] }
    ],
    routeDefs: [
      { router: 'R1', destinationSegmentId: 'lan-b', viaRouter: 'R2', viaSegmentId: 'link-r1-r2' },
      { router: 'R2', destinationSegmentId: 'lan-a', viaRouter: 'R1', viaSegmentId: 'link-r1-r2' },
      { router: 'R2', destinationSegmentId: 'lan-b', viaRouter: 'R3', viaSegmentId: 'link-r2-r3' },
      { router: 'R3', destinationSegmentId: 'lan-a', viaRouter: 'R2', viaSegmentId: 'link-r2-r3' }
    ]
  }
];

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
  for (let attempt = 0; attempt < 80; attempt++) {
    const template = randomFrom(SUBNET_TASK_TEMPLATES);
    const segments = buildSegments(template);
    const poolPrefix = choosePoolPrefix(segments);
    if (!poolPrefix) continue;

    const pool = generatePrivatePool(poolPrefix);
    const recommended = allocateRecommended(pool.network, segments);
    if (recommended[recommended.length - 1].broadcast > pool.broadcast) continue;

    const byId = Object.fromEntries(recommended.map(item => [item.id, item]));
    const ipRows = buildIpRows(template);
    const gatewayRows = buildGatewayRows(template);
    const routeRows = buildRouteRows(template);
    const ips = buildExpectedIps(ipRows, byId);

    const task = {
      pool,
      templateId: template.id,
      templateTitle: template.title,
      topologyLines: template.topologyLines,
      routers: template.routers,
      segments,
      recommended,
      ipRows,
      gatewayRows,
      routeRows,
      ips,
      startTime: Date.now(),
      saved: false,
      dirty: false
    };

    if (isGeneratedTaskValid(task)) return task;
  }

  throw new Error('Не удалось сгенерировать корректную задачу адресации');
}

function buildSegments(template) {
  return template.segmentDefs.map(def => {
    const base = def.type === 'lan'
      ? buildLanSegment(def)
      : buildLinkSegment(def);
    const prefix = requiredPrefix(base.hosts);
    return {
      ...base,
      prefix,
      mask: prefixToMask(prefix),
      capacity: usableHosts(prefix)
    };
  });
}

function buildLanSegment(def) {
  const profile = LAN_HOST_PROFILES[randomFrom(def.profiles)];
  const hosts = randomInt(profile.min, profile.max);
  return {
    id: def.id,
    type: 'lan',
    title: def.title,
    router: def.router,
    host: def.host,
    hosts,
    description: `${def.host} и интерфейс ${def.router} ${def.title}`,
    meaning: `Пользовательская LAN: нужен usable-диапазон для ${def.host}, интерфейса ${def.router} и указанного запаса адресов.`
  };
}

function buildLinkSegment(def) {
  return {
    id: def.id,
    type: 'link',
    title: def.title,
    routers: [...def.routers],
    hosts: 2,
    description: `Point-to-point линк между ${def.routers.join(' и ')}`,
    meaning: `Транзитная сеть только для двух интерфейсов: ${def.routers.join(' и ')}. Обычно достаточно /30.`
  };
}

function choosePoolPrefix(segments) {
  const totalSize = segments.reduce((sum, seg) => sum + blockSize(seg.prefix), 0);
  if (totalSize <= 240) return Math.random() < 0.85 ? 24 : 23;
  if (totalSize <= 256) return 24;
  if (totalSize <= 512) return 23;
  return null;
}

function generatePrivatePool(prefix) {
  const family = randomFrom(['192', '10', '172']);
  const third = prefix === 23 ? randomEven(10, 220) : randomInt(10, 220);

  if (family === '10') {
    return makeSubnet(ipToInt(`10.${randomInt(1, 240)}.${third}.0`), prefix);
  }

  if (family === '172') {
    return makeSubnet(ipToInt(`172.${randomInt(16, 31)}.${third}.0`), prefix);
  }

  return makeSubnet(ipToInt(`192.168.${third}.0`), prefix);
}

function buildIpRows(template) {
  const rows = [];
  template.segmentDefs.forEach(def => {
    if (def.type === 'lan') {
      rows.push({
        key: ipKey(def.router, def.id),
        label: `${def.router} ${def.title}`,
        segmentId: def.id,
        segmentLabel: def.title,
        owner: def.router,
        kind: 'router'
      });
      rows.push({
        key: ipKey(def.host, def.id),
        label: def.host,
        segmentId: def.id,
        segmentLabel: def.title,
        owner: def.host,
        kind: 'host'
      });
    } else {
      def.routers.forEach(router => {
        rows.push({
          key: ipKey(router, def.id),
          label: `${router} ${def.title}`,
          segmentId: def.id,
          segmentLabel: def.title,
          owner: router,
          kind: 'router'
        });
      });
    }
  });
  return rows;
}

function buildGatewayRows(template) {
  return template.segmentDefs
    .filter(def => def.type === 'lan')
    .map(def => ({
      key: `gw-${def.host.toLowerCase()}`,
      host: def.host,
      hostIpKey: ipKey(def.host, def.id),
      router: def.router,
      routerIpKey: ipKey(def.router, def.id),
      segmentId: def.id,
      segmentLabel: def.title
    }));
}

function buildRouteRows(template) {
  return template.routeDefs.map(def => ({
    id: `${def.router.toLowerCase()}-to-${def.destinationSegmentId}`,
    router: def.router,
    destinationSegmentId: def.destinationSegmentId,
    viaRouter: def.viaRouter,
    viaSegmentId: def.viaSegmentId,
    viaIpKey: ipKey(def.viaRouter, def.viaSegmentId)
  }));
}

function buildExpectedIps(ipRows, subnetsById) {
  const nextOffset = {};
  const ips = {};

  ipRows.forEach(row => {
    const subnet = subnetsById[row.segmentId];
    nextOffset[row.segmentId] = nextOffset[row.segmentId] || 1;
    ips[row.key] = subnet.network + nextOffset[row.segmentId];
    nextOffset[row.segmentId]++;
  });

  return ips;
}

function isGeneratedTaskValid(task) {
  const subnets = task.recommended;
  if (!subnets.every(seg => seg.network >= task.pool.network && seg.broadcast <= task.pool.broadcast)) return false;
  if (hasOverlap(subnets)) return false;

  const byId = Object.fromEntries(subnets.map(seg => [seg.id, seg]));
  const ipValues = Object.values(task.ips);
  if (new Set(ipValues).size !== ipValues.length) return false;
  if (!task.ipRows.every(row => isUsableInSubnet(task.ips[row.key], byId[row.segmentId]))) return false;
  if (!task.gatewayRows.every(row => isUsableInSubnet(task.ips[row.routerIpKey], byId[row.segmentId]))) return false;
  return task.routeRows.every(row =>
    byId[row.destinationSegmentId] &&
    isUsableInSubnet(task.ips[row.viaIpKey], byId[row.viaSegmentId])
  );
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

function taskHelp(html) {
  return subnetTask.examMode ? '' : html;
}

function renderProblemStatement() {
  const { pool, segments } = subnetTask;
  const lanCount = segments.filter(seg => seg.type === 'lan').length;
  const linkCount = segments.filter(seg => seg.type === 'link').length;

  return `
    <div class="task-card task-statement">
      <div class="task-kicker">Условие задачи</div>
      <h3>Дан пул ${subnetLabel(pool)}. Нужно построить адресный план для схемы: ${subnetTask.templateTitle}</h3>

      <div class="task-topology" aria-label="Топология задачи">
        ${subnetTask.topologyLines.map(line => `
          <div class="task-topology-line">
            ${line.map(item => item.type === 'node'
              ? `<span>${item.label}</span>`
              : `<i>${item.label}</i>`).join('')}
          </div>
        `).join('')}
      </div>

      <div class="task-brief-grid">
        <div class="task-brief-block">
          <h4>Что дано</h4>
          <ul>
            <li>Один общий пул адресов: <strong>${subnetLabel(pool)}</strong>.</li>
            <li>Пользовательских LAN-сетей: <strong>${lanCount}</strong>.</li>
            <li>Router-to-router линков: <strong>${linkCount}</strong>.</li>
            <li>Для каждого сегмента известно минимальное число usable-адресов.</li>
          </ul>
        </div>
        <div class="task-brief-block">
          <h4>Что нужно сделать</h4>
          <ul>
            <li>Разбить пул на подсети через VLSM, без пересечений.</li>
            <li>Назначить IP-адреса ПК и интерфейсам ${subnetTask.routers.join('/')}.</li>
            <li>Указать default gateway на ПК и статические маршруты на роутерах.</li>
          </ul>
        </div>
      </div>

      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Сегмент</th><th>Что подключено</th><th>Минимум usable-адресов</th><th>Что это значит</th></tr></thead>
          <tbody>
            ${segments.map(seg => `
              <tr>
                <td>${seg.title}</td>
                <td>${seg.description}</td>
                <td>${seg.hosts}</td>
                <td>${seg.meaning}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${taskHelp(`<div class="task-explain">
        <strong>Идея задачи:</strong> преподаватель проверяет весь адресный план.
        Сначала выбирается размер подсетей, потом сами диапазоны, потом IP устройств, потом шлюзы и маршруты.
        Если перепутать порядок, легко назначить адрес из чужой подсети или прописать next-hop, до которого роутер физически не может добраться.
      </div>`)}

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
      ${taskHelp(`<div class="task-explain">
        На этом этапе ты ещё не выбираешь конкретные адреса вида 192.168.x.x.
        Нужно только понять, какой размер подсети нужен каждому сегменту.
        Например, если в LAN нужно 50 хостов, /27 не подойдёт, потому что даёт только 30 usable-адресов.
      </div>
      <div class="task-hint">Формула usable-адресов: <strong>2^h - 2</strong>, где h — число бит под хосты. Префикс: <strong>32 - h</strong>. Выбирай минимальную подходящую подсеть: не меньше нужного, но и не слишком большую.</div>`)}
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Сегмент</th><th>Нужно usable-адресов</th><th>Префикс</th><th>Маска</th></tr></thead>
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
      ${taskHelp(`<div class="task-explain">
        Теперь нужно взять общий пул и нарезать его на непересекающиеся диапазоны.
        Адрес сети — это не любой удобный адрес, а начало блока.
        Broadcast — последний адрес этого блока. Обычным устройствам оба этих адреса назначать нельзя.
      </div>
      <div class="task-hint">Практичный порядок для VLSM: сначала самые большие LAN, затем меньшие LAN, затем /30 линк. Шаги блоков в этой задаче: ${blockStepsText()}.</div>`)}
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
  return `
    <div class="task-card">
      <h3>4. Назначь IP-адреса устройствам</h3>
      ${taskHelp(`<div class="task-explain">
        Здесь ты заполняешь адреса конкретных интерфейсов.
        IP устройства должен лежать внутри той подсети, к которой это устройство подключено.
        У маршрутизатора может быть несколько IP-адресов: по одному на каждом подключённом сегменте.
      </div>
      <div class="task-hint">Можно выбрать любые usable-адреса внутри нужной подсети. Нельзя использовать адрес сети, broadcast и одинаковый IP на двух устройствах.</div>`)}
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Устройство/интерфейс</th><th>IP-адрес</th><th>Где должен находиться</th></tr></thead>
          <tbody>
            ${subnetTask.ipRows.map(row => `<tr><td>${row.label}</td><td>${taskInput(`ip-${row.key}`, '192.168.x.x')}</td><td>в ${row.segmentLabel}</td></tr>`).join('')}
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
      ${taskHelp(`<div class="task-explain">
        Шлюз нужен конечным ПК, чтобы отправлять пакеты в чужие сети.
        ПК не указывает адрес дальнего роутера и не указывает сеть целиком.
        Он указывает ближайший интерфейс своего роутера в своей LAN.
      </div>
      <div class="task-hint">Default gateway хоста — это IP интерфейса маршрутизатора в той же LAN.</div>`)}
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Хост</th><th>Default gateway</th><th>Должен совпасть с</th></tr></thead>
          <tbody>
            ${subnetTask.gatewayRows.map(row => `
              <tr>
                <td>${row.host}</td>
                <td>${taskInput(row.key, `IP ${row.router} ${row.segmentLabel}`)}</td>
                <td>${row.router} в ${row.segmentLabel}</td>
              </tr>
            `).join('')}
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
      ${taskHelp(`<div class="task-explain">
        Каждый роутер сам знает только directly connected сети: свои LAN и свои router-to-router линки.
        Для чужих LAN нужны статические маршруты. Next-hop должен быть адресом соседнего роутера на общей сети.
      </div>
      <div class="task-hint">Connected-сети прописывать не нужно. В Cisco статический маршрут выглядит как: <strong>ip route сеть маска next-hop</strong>.</div>`)}
      <div class="task-table-wrap">
        <table class="task-table">
          <thead><tr><th>Роутер</th><th>Куда нужен маршрут</th><th>Сеть назначения</th><th>Маска</th><th>Next-hop</th></tr></thead>
          <tbody>
            ${subnetTask.routeRows.map(row => `
              <tr>
                <td>${row.router}</td>
                <td>${segmentTitle(row.destinationSegmentId)} через ${row.viaRouter}</td>
                <td>${taskInput(`route-${row.id}-network`, `${segmentTitle(row.destinationSegmentId)} network`)}</td>
                <td>${taskInput(`route-${row.id}-mask`, `${segmentTitle(row.destinationSegmentId)} mask`)}</td>
                <td>${taskInput(`route-${row.id}-next`, `${row.viaRouter} ${segmentTitle(row.viaSegmentId)} IP`)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${stageActions('routes')}
    </div>
  `;
}

function renderFinalStage() {
  const buttonText = subnetTask.examMode ? 'Завершить экзамен' : 'Проверить всю задачу';
  return `
    <div class="task-card">
      <h3>7. Итоговая проверка</h3>
      ${taskHelp(`<div class="task-explain">
        Финальная проверка смотрит не только “похожи ли числа на правильные”.
        Она проверяет логику: достаточно ли хостов, нет ли пересечений подсетей,
        не назначены ли network/broadcast адреса устройствам, достижим ли next-hop и есть ли обратный маршрут.
      </div>
      <div class="task-hint">Итог оценивается как экзаменационная задача: маски, подсети, IP-адреса, шлюзы, маршруты и аккуратность адресного плана.</div>`)}
      <div class="task-actions">
        <button class="btn-primary" type="button" onclick="checkSubnetTaskFinal()">${buttonText}</button>
      </div>
      <div class="task-feedback" id="task-feedback-final"></div>
    </div>
  `;
}

function taskInput(id, placeholder = '') {
  const placeholderAttr = subnetTask.examMode ? '' : ` placeholder="${placeholder}"`;
  return `<input class="task-input" id="task-${id}" autocomplete="off"${placeholderAttr} oninput="markSubnetTaskDirty()">`;
}

function markSubnetTaskDirty() {
  if (subnetTask) subnetTask.dirty = true;
}

function stageActions(stage) {
  if (subnetTask.examMode) return '';

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

    const formula = `${seg.hosts} usable-адресов: нужно минимум ${seg.capacity}, значит ${prefixLabel(seg.prefix)} / ${seg.mask}`;
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
  let correctRows = 0;

  subnetTask.ipRows.forEach(row => {
    const ip = values[row.key];
    const subnet = subnets.byId[row.segmentId];

    if (ip == null) {
      messages.push(`${row.label}: IP-адрес не заполнен или записан неверно.`);
      return;
    }
    if (!subnet?.valid) {
      messages.push(`${row.label}: сначала исправь подсеть ${segmentTitle(row.segmentId)}.`);
      return;
    }
    if (!isUsableInSubnet(ip, subnet)) {
      messages.push(`${row.label}: адрес должен быть usable-адресом внутри ${segmentTitle(row.segmentId)}, не адресом сети и не broadcast.`);
      return;
    }
    correctRows++;
  });

  const ipList = Object.values(values).filter(v => v != null);
  const allFilled = ipList.length === subnetTask.ipRows.length;
  const unique = allFilled && new Set(ipList).size === ipList.length;
  if (!unique) messages.push('IP-адреса устройств должны быть заполнены без повторов.');

  const score = (correctRows === subnetTask.ipRows.length && unique)
    ? 4
    : round1(correctRows * 3 / subnetTask.ipRows.length + (unique ? 1 : 0));

  return {
    ok: correctRows === subnetTask.ipRows.length && unique,
    score,
    max: 4,
    messages: messages.length ? messages : ['IP-адреса устройств корректны и не пересекаются.']
  };
}

function evaluateGateways() {
  const subnets = parseUserSubnets();
  const ips = getIpValues();
  const messages = [];
  let correctRows = 0;

  subnetTask.gatewayRows.forEach(row => {
    const gateway = parseIp(readTaskValue(row.key));
    const routerIp = ips[row.routerIpKey];
    const subnet = subnets.byId[row.segmentId];

    if (!subnet?.valid || !isUsableInSubnet(routerIp, subnet)) {
      messages.push(`${row.host}: сначала исправь подсеть ${row.segmentLabel} и IP интерфейса ${row.router}, иначе gateway нельзя проверить надёжно.`);
      return;
    }

    if (gateway === routerIp) {
      correctRows++;
    } else {
      messages.push(`${row.host}: default gateway должен совпадать с IP интерфейса ${row.router} в ${row.segmentLabel}.`);
    }
  });

  const score = correctRows === subnetTask.gatewayRows.length
    ? 3
    : round1(correctRows * 3 / subnetTask.gatewayRows.length);

  return {
    ok: correctRows === subnetTask.gatewayRows.length,
    score,
    max: 3,
    messages: messages.length ? messages : ['Шлюзы указаны верно.']
  };
}

function evaluateRoutes() {
  const subnets = parseUserSubnets();
  const ips = getIpValues();
  const messages = [];
  let correctRows = 0;

  subnetTask.routeRows.forEach(row => {
    const route = readRoute(row.id);
    const targetSubnet = subnets.byId[row.destinationSegmentId];
    const viaSubnet = subnets.byId[row.viaSegmentId];
    const nextHop = ips[row.viaIpKey];

    if (!viaSubnet?.valid || !isUsableInSubnet(nextHop, viaSubnet)) {
      messages.push(`${row.router}: сначала исправь подсеть ${segmentTitle(row.viaSegmentId)} и IP ${row.viaRouter} на этом линке, иначе next-hop нельзя проверить надёжно.`);
      return;
    }

    if (isRouteCorrect(route, targetSubnet, nextHop)) {
      correctRows++;
    } else {
      messages.push(`${row.router}: нужен маршрут к ${segmentTitle(row.destinationSegmentId)} через IP ${row.viaRouter} на линке ${segmentTitle(row.viaSegmentId)}.`);
    }
  });

  const score = correctRows === subnetTask.routeRows.length
    ? 4
    : round1(correctRows * 4 / subnetTask.routeRows.length);

  return {
    ok: correctRows === subnetTask.routeRows.length,
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

  const review = {
    total,
    max: 20,
    breakdown: [
      { label: 'Маски', score: masks.score, max: masks.max },
      { label: 'Подсети', score: subnets.score, max: subnets.max },
      { label: 'IP', score: ips.score, max: ips.max },
      { label: 'Шлюзы', score: gateways.score, max: gateways.max },
      { label: 'Маршруты', score: routes.score, max: routes.max },
      { label: 'Аккуратность', score: clean.score, max: clean.max }
    ],
    messages: allMessages,
    solutionHtml: renderSubnetSolution()
  };

  if (subnetTask.examMode && typeof finishExamFromTask === 'function') {
    if (subnetTask.saved) {
      if (typeof showExamResultScreen === 'function') showExamResultScreen();
      return;
    }

    const examFinal = finishExamFromTask(total, review);
    subnetTask.saved = true;
    subnetTask.dirty = false;
    if (examFinal && typeof showExamResultScreen === 'function') {
      showExamResultScreen();
    }
    return;
  }

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
    saveSubnetTaskResult(total);
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
  const ipRows = subnetTask.ipRows.map(row => `
    <tr>
      <td>${row.label}</td>
      <td>${intToIp(subnetTask.ips[row.key])}</td>
    </tr>
  `).join('');
  const routes = subnetTask.routeRows.map(row => {
    const target = byId[row.destinationSegmentId];
    return `${row.router}(config)# ip route ${intToIp(target.network)} ${target.mask} ${intToIp(subnetTask.ips[row.viaIpKey])}`;
  }).join('\n');

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
          <thead><tr><th>Устройство/интерфейс</th><th>IP</th></tr></thead>
          <tbody>${ipRows}</tbody>
        </table>
      </div>
      <div class="task-cisco">${routes}</div>
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

    if (!prefixOk) messages.push(`${seg.title}: для ${seg.hosts} usable-адресов нужен префикс ${prefixLabel(seg.prefix)}, а не ${prefixLabel(prefix)}.`);
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
  return Object.fromEntries(subnetTask.ipRows.map(row => [
    row.key,
    parseIp(readTaskValue(`ip-${row.key}`))
  ]));
}

function readRoute(routeId) {
  return {
    network: parseIp(readTaskValue(`route-${routeId}-network`)),
    maskPrefix: parseMaskPrefix(readTaskValue(`route-${routeId}-mask`)),
    next: parseIp(readTaskValue(`route-${routeId}-next`))
  };
}

function isRouteCorrect(route, targetSubnet, expectedNextHop) {
  if (!targetSubnet?.valid) return false;
  return route.network === targetSubnet.network
    && route.maskPrefix === targetSubnet.prefix
    && route.next === expectedNextHop;
}

function isUsableInSubnet(ip, subnet) {
  return ip != null && subnet && ip > subnet.network && ip < subnet.broadcast;
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
    .sort((a, b) => a.prefix - b.prefix || a.title.localeCompare(b.title))
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

function blockStepsText() {
  const prefixes = [...new Set(subnetTask.segments.map(seg => seg.prefix))].sort((a, b) => a - b);
  return prefixes.map(prefix => `${prefixLabel(prefix)} шаг ${blockSize(prefix)}`).join(', ');
}

function ipKey(owner, segmentId) {
  return `${owner.toLowerCase()}-${segmentId}`;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomEven(min, max) {
  const value = randomInt(Math.ceil(min / 2), Math.floor(max / 2)) * 2;
  return Math.min(value, max);
}

function randomFrom(items) {
  return items[randomInt(0, items.length - 1)];
}
