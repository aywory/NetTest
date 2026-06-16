let routingTaskV2 = null;

const ROUTING_V2_DATA = {
  routers: ['R1', 'R2', 'R3', 'R4'],
  rootRouter: 'R1',
  externalNextHop: '213.130.10.225',
  segments: [
    {
      id: 'wan',
      title: 'Глобальная сеть',
      kind: 'wan',
      routers: ['R1'],
      endpointIps: { R1: '213.130.10.226' },
      given: 'Стрелка в глобальную сеть: 213.130.10.225, интерфейс R1: 213.130.10.226',
      fixedPrefix: 30
    },
    {
      id: 'r1-r2',
      title: 'R1-R2',
      kind: 'link',
      routers: ['R1', 'R2'],
      endpointIps: { R1: '10.0.3.18', R2: '10.0.3.17' },
      given: 'R1: 10.0.3.18, R2: 10.0.3.17',
      fixedPrefix: 30
    },
    {
      id: 'r1-r3',
      title: 'R1-R3',
      kind: 'link',
      routers: ['R1', 'R3'],
      endpointIps: { R1: '10.0.3.22', R3: '10.0.3.21' },
      given: 'R1: 10.0.3.22, R3: 10.0.3.21',
      fixedPrefix: 30
    },
    {
      id: 'r2-r3',
      title: 'R2-R3',
      kind: 'link',
      routers: ['R2', 'R3'],
      endpointIps: { R2: '10.0.3.25', R3: '10.0.3.26' },
      given: 'R2: 10.0.3.25, R3: 10.0.3.26',
      fixedPrefix: 30
    },
    {
      id: 'r3-r4',
      title: 'R3-R4',
      kind: 'link',
      routers: ['R3', 'R4'],
      endpointIps: { R3: '10.0.3.30', R4: '10.0.3.29' },
      given: 'R3: 10.0.3.30, R4: 10.0.3.29',
      fixedPrefix: 30
    },
    {
      id: 'lan1',
      title: 'LAN1',
      kind: 'lan',
      routers: ['R2'],
      endpointIps: { R2: '10.4.4.37' },
      hostRange: ['10.4.4.38', '10.4.4.60'],
      given: 'R2: 10.4.4.37, узлы LAN1: 10.4.4.38-10.4.4.60'
    },
    {
      id: 'lan2',
      title: 'LAN2',
      kind: 'lan',
      routers: ['R4'],
      endpointIps: { R4: '10.4.4.137' },
      hostRange: ['10.4.4.138', '10.4.4.180'],
      given: 'R4: 10.4.4.137, узлы LAN2: 10.4.4.138-10.4.4.180'
    },
    {
      id: 'lan3',
      title: 'LAN3',
      kind: 'lan',
      routers: ['R4'],
      endpointIps: { R4: '10.4.4.197' },
      hostRange: ['10.4.4.198', '10.4.4.248'],
      given: 'R4: 10.4.4.197, узлы LAN3: 10.4.4.198-10.4.4.248'
    }
  ],
  connectedOrder: {
    R1: ['wan', 'r1-r2', 'r1-r3'],
    R2: ['r1-r2', 'lan1', 'r2-r3'],
    R3: ['r1-r3', 'r2-r3', 'r3-r4'],
    R4: ['r3-r4', 'lan2', 'lan3']
  },
  staticOrder: ['r1-r2', 'r1-r3', 'r2-r3', 'r3-r4', 'lan1', 'lan2', 'lan3', 'wan']
};

function startRoutingTaskV2() {
  if (routingTaskV2?.dirty && !routingTaskV2.saved) {
    const ok = confirm('Начать заново? Введённые ответы в v2 будут потеряны.');
    if (!ok) return;
  }

  routingTaskV2 = buildRoutingTaskV2();
  renderRoutingTaskV2();
  showScreen('routing-task-v2-screen');
}

function resetRoutingTaskV2() {
  if (routingTaskV2?.dirty && !routingTaskV2.saved) {
    const ok = confirm('Очистить все ответы в тренажёре v2?');
    if (!ok) return;
  }
  routingTaskV2 = buildRoutingTaskV2();
  renderRoutingTaskV2();
}

function exitRoutingTaskV2() {
  if (routingTaskV2?.dirty && !routingTaskV2.saved) {
    const ok = confirm('Выйти в меню? Введённые ответы в v2 не сохранятся.');
    if (!ok) return;
  }
  showScreen('start-screen');
}

function buildRoutingTaskV2() {
  const segments = ROUTING_V2_DATA.segments.map(seg => {
    const prefix = seg.fixedPrefix ?? computeRoutingV2LanPrefix(seg);
    const anchorIp = routingV2SegmentAnchorIp(seg);
    const network = networkOf(anchorIp, prefix);
    const broadcast = broadcastOf(network, prefix);
    return {
      ...seg,
      prefix,
      network,
      broadcast,
      mask: prefixToMask(prefix),
      size: blockSize(prefix),
      usable: usableHosts(prefix)
    };
  });
  const byId = Object.fromEntries(segments.map(seg => [seg.id, seg]));
  const graph = buildRoutingV2Graph(segments);
  const tables = Object.fromEntries(ROUTING_V2_DATA.routers.map(router => [
    router,
    buildRoutingV2Table(router, segments, byId, graph)
  ]));

  return {
    segments,
    byId,
    graph,
    tables,
    startTime: Date.now(),
    dirty: false,
    saved: false
  };
}

function computeRoutingV2LanPrefix(seg) {
  const ips = [
    ...Object.values(seg.endpointIps || {}).map(ipToInt),
    ...((seg.hostRange || []).map(ipToInt))
  ];
  const minIp = Math.min(...ips);
  const maxIp = Math.max(...ips);

  for (let prefix = 30; prefix >= 1; prefix--) {
    const network = networkOf(minIp, prefix);
    const broadcast = broadcastOf(network, prefix);
    if (network <= minIp && broadcast >= maxIp) return prefix;
  }

  return 0;
}

function routingV2SegmentAnchorIp(seg) {
  const firstIp = Object.values(seg.endpointIps || {})[0] || seg.hostRange?.[0];
  return ipToInt(firstIp);
}

function buildRoutingV2Graph(segments) {
  const graph = Object.fromEntries(ROUTING_V2_DATA.routers.map(router => [router, []]));
  segments
    .filter(seg => seg.kind === 'link' && seg.routers.length === 2)
    .forEach(seg => {
      const [a, b] = seg.routers;
      graph[a].push({ router: b, segmentId: seg.id });
      graph[b].push({ router: a, segmentId: seg.id });
    });
  return graph;
}

function buildRoutingV2Table(router, segments, byId, graph) {
  const connectedIds = ROUTING_V2_DATA.connectedOrder[router] || [];
  const connectedRows = connectedIds.map(id => {
    const seg = byId[id];
    return {
      type: 'C',
      segmentId: seg.id,
      network: seg.network,
      prefix: seg.prefix,
      nextKind: 'direct',
      nextLabel: routingV2DirectLabel(router, seg)
    };
  });

  const staticRows = ROUTING_V2_DATA.staticOrder
    .map(id => byId[id])
    .filter(seg => seg && !seg.routers.includes(router))
    .map(seg => {
      const nextRouter = findRoutingV2NextRouter(router, seg, graph);
      const shared = findRoutingV2SharedLink(router, nextRouter, segments);
      return {
        type: 'S',
        segmentId: seg.id,
        network: seg.network,
        prefix: seg.prefix,
        nextKind: 'ip',
        nextHop: ipToInt(shared.endpointIps[nextRouter]),
        nextRouter,
        viaSegmentId: shared.id
      };
    });

  return [
    ...connectedRows,
    ...staticRows,
    buildRoutingV2DefaultRoute(router, graph, segments)
  ];
}

function buildRoutingV2DefaultRoute(router, graph, segments) {
  if (router === ROUTING_V2_DATA.rootRouter) {
    return {
      type: 'S*',
      segmentId: 'default',
      network: 0,
      prefix: 0,
      nextKind: 'ip',
      nextHop: ipToInt(ROUTING_V2_DATA.externalNextHop),
      nextRouter: 'global'
    };
  }

  const nextRouter = findRoutingV2NextRouterToRouter(router, ROUTING_V2_DATA.rootRouter, graph);
  const shared = findRoutingV2SharedLink(router, nextRouter, segments);
  return {
    type: 'S*',
    segmentId: 'default',
    network: 0,
    prefix: 0,
    nextKind: 'ip',
    nextHop: ipToInt(shared.endpointIps[nextRouter]),
    nextRouter,
    viaSegmentId: shared.id
  };
}

function findRoutingV2NextRouter(fromRouter, targetSegment, graph) {
  const targets = [...targetSegment.routers].sort(routingV2RouterSort);
  const routes = targets
    .map(target => ({
      target,
      path: findRoutingV2Path(fromRouter, target, graph)
    }))
    .filter(item => item.path.length > 1)
    .sort((a, b) => a.path.length - b.path.length || routingV2RouterSort(a.target, b.target));
  return routes[0]?.path[1] || null;
}

function findRoutingV2NextRouterToRouter(fromRouter, targetRouter, graph) {
  const path = findRoutingV2Path(fromRouter, targetRouter, graph);
  return path[1] || null;
}

function findRoutingV2Path(fromRouter, targetRouter, graph) {
  if (fromRouter === targetRouter) return [fromRouter];

  const queue = [[fromRouter]];
  const visited = new Set([fromRouter]);
  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const nextItems = [...(graph[current] || [])].sort((a, b) => routingV2RouterSort(a.router, b.router));
    for (const item of nextItems) {
      if (visited.has(item.router)) continue;
      const nextPath = [...path, item.router];
      if (item.router === targetRouter) return nextPath;
      visited.add(item.router);
      queue.push(nextPath);
    }
  }

  return [];
}

function findRoutingV2SharedLink(routerA, routerB, segments = routingTaskV2?.segments || []) {
  return segments.find(seg =>
    seg.kind === 'link' && seg.routers.includes(routerA) && seg.routers.includes(routerB)
  );
}

function routingV2RouterSort(a, b) {
  return ROUTING_V2_DATA.routers.indexOf(a) - ROUTING_V2_DATA.routers.indexOf(b);
}

function routingV2DirectLabel(router, seg) {
  if (seg.kind === 'wan') return 'directly connected, global';
  if (seg.kind === 'lan') return `directly connected, ${seg.title}`;
  return `directly connected, к ${seg.routers.find(r => r !== router)}`;
}

function renderRoutingTaskV2() {
  const el = document.getElementById('routing-task-v2-container');
  el.innerHTML = `
    ${renderRoutingV2Statement()}
    ${renderRoutingV2NetworkStage()}
    ${renderRoutingV2TablesStage()}
    ${renderRoutingV2EquipmentStage()}
    ${renderRoutingV2FinalStage()}
  `;
}

function renderRoutingV2Statement() {
  return `
    <div class="task-card task-statement routing-v2-statement">
      <div class="task-kicker">Условие задачи</div>
      <h3>На рисунке показана структура локальной сети Intranet. Стрелкой показан маршрут, ведущий в глобальную сеть, подписаны адреса узлов.</h3>
      <p>Приведите содержимое таблиц маршрутизации всех показанных на схеме маршрутизаторов и опишите активное и пассивное оборудование, если каждое облако - это сегмент коммутируемой сети 1000Base-T.</p>
      ${renderRoutingV2Diagram()}
      <div class="routing-v2-note">
        <strong>Что дано:</strong> только схема и подписи адресов. Сети, маски, типы маршрутов и next-hop нужно вывести самостоятельно.
      </div>
    </div>
  `;
}

function renderRoutingV2Diagram() {
  return `
    <div class="routing-v2-diagram" aria-label="Схема сети Intranet">
      <svg viewBox="0 0 980 390" role="img" aria-label="R1 соединен с глобальной сетью, R2, R3, R4 и LAN1-LAN3">
        <defs>
          <marker id="routing-v2-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z"></path>
          </marker>
        </defs>

        <line class="routing-v2-line" x1="475" y1="80" x2="475" y2="140" marker-start="url(#routing-v2-arrow)"></line>
        <line class="routing-v2-line" x1="475" y1="175" x2="260" y2="260"></line>
        <line class="routing-v2-line" x1="505" y1="175" x2="610" y2="260"></line>
        <line class="routing-v2-line" x1="260" y1="295" x2="610" y2="295"></line>
        <line class="routing-v2-line" x1="650" y1="295" x2="805" y2="295"></line>
        <line class="routing-v2-line" x1="208" y1="295" x2="110" y2="295"></line>
        <line class="routing-v2-line" x1="830" y1="275" x2="850" y2="170"></line>
        <line class="routing-v2-line" x1="850" y1="305" x2="875" y2="315"></line>

        <text class="routing-v2-ip" x="390" y="52">213.130.10.225</text>
        <text class="routing-v2-ip" x="500" y="118">213.130.10.226</text>
        <text class="routing-v2-ip" x="300" y="180">10.0.3.18</text>
        <text class="routing-v2-ip" x="210" y="245">10.0.3.17</text>
        <text class="routing-v2-ip" x="515" y="190">10.0.3.22</text>
        <text class="routing-v2-ip" x="600" y="245">10.0.3.21</text>
        <text class="routing-v2-ip" x="330" y="285">10.0.3.25</text>
        <text class="routing-v2-ip" x="475" y="285">10.0.3.26</text>
        <text class="routing-v2-ip" x="685" y="285">10.0.3.30</text>
        <text class="routing-v2-ip" x="770" y="282">10.0.3.29</text>

        <g class="routing-v2-cloud">
          <path d="M25 278 C18 258 45 249 58 261 C70 241 105 247 108 270 C132 269 142 294 124 310 L42 310 C20 309 10 291 25 278 Z"></path>
          <text x="50" y="294">LAN1</text>
          <text class="routing-v2-cloud-ip" x="9" y="245">10.4.4.38-10.4.4.60</text>
        </g>
        <g class="routing-v2-cloud">
          <path d="M805 143 C798 123 825 114 838 126 C850 106 885 112 888 135 C912 134 922 159 904 175 L822 175 C800 174 790 156 805 143 Z"></path>
          <text x="830" y="159">LAN2</text>
          <text class="routing-v2-cloud-ip" x="775" y="96">10.4.4.138-10.4.4.180</text>
        </g>
        <g class="routing-v2-cloud">
          <path d="M875 298 C868 278 895 269 908 281 C920 261 955 267 958 290 C982 289 992 314 974 330 L892 330 C870 329 860 311 875 298 Z"></path>
          <text x="900" y="314">LAN3</text>
          <text class="routing-v2-cloud-ip" x="835" y="250">10.4.4.198-10.4.4.248</text>
        </g>

        <g class="routing-v2-router" transform="translate(475 160)">
          <circle r="27"></circle>
          <text y="5">R1</text>
        </g>
        <g class="routing-v2-router" transform="translate(240 295)">
          <circle r="27"></circle>
          <text y="5">R2</text>
        </g>
        <g class="routing-v2-router" transform="translate(630 295)">
          <circle r="27"></circle>
          <text y="5">R3</text>
        </g>
        <g class="routing-v2-router" transform="translate(830 295)">
          <circle r="27"></circle>
          <text y="5">R4</text>
        </g>

        <text class="routing-v2-ip" x="137" y="324">10.4.4.37</text>
        <text class="routing-v2-ip" x="845" y="240">10.4.4.137</text>
        <text class="routing-v2-ip" x="790" y="345">10.4.4.197</text>
      </svg>
    </div>
  `;
}

function renderRoutingV2NetworkStage() {
  return `
    <div class="task-card">
      <h3>1. Вычисли сети по подписям на схеме</h3>
      <div class="task-table-wrap">
        <table class="task-table routing-v2-network-table">
          <thead><tr><th>Сегмент</th><th>Дано на схеме</th><th>Сеть</th><th>Маска или префикс</th></tr></thead>
          <tbody>
            ${routingTaskV2.segments.map(seg => `
              <tr>
                <td><strong>${seg.title}</strong></td>
                <td>${seg.given}</td>
                <td>${routingV2Input(`net-${seg.id}-network`)}</td>
                <td>${routingV2Input(`net-${seg.id}-mask`)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="task-actions">
        <button class="btn-submit" type="button" onclick="checkRoutingV2Networks()">Проверить сети</button>
      </div>
      <div class="task-feedback" id="routing-v2-feedback-networks"></div>
    </div>
  `;
}

function renderRoutingV2TablesStage() {
  return `
    <div class="task-card">
      <h3>2. Заполни таблицы маршрутизации всех маршрутизаторов</h3>
      <p class="routing-v2-muted">Порядок строк не важен. В каждой таблице должны быть все сети: LAN, router-to-router, глобальная сеть и маршрут по умолчанию.</p>
      <div class="routing-v2-router-grid">
        ${ROUTING_V2_DATA.routers.map(router => renderRoutingV2RouterTable(router)).join('')}
      </div>
      <div class="task-actions">
        <button class="btn-submit" type="button" onclick="checkRoutingV2Tables()">Проверить таблицы</button>
      </div>
      <div class="task-feedback" id="routing-v2-feedback-tables"></div>
    </div>
  `;
}

function renderRoutingV2RouterTable(router) {
  const rows = routingTaskV2.tables[router];
  return `
    <section class="routing-v2-router-card">
      <div class="routing-v2-router-head">
        <strong>${router}</strong>
        <span>${rows.length} строк</span>
      </div>
      <div class="task-table-wrap">
        <table class="task-table routing-v2-route-table">
          <thead><tr><th>Тип</th><th>Сеть</th><th>Маска или префикс</th><th>Next-hop / интерфейс</th></tr></thead>
          <tbody>
            ${rows.map((_, index) => `
              <tr>
                <td>${routingV2Input(`route-${router}-${index}-type`)}</td>
                <td>${routingV2Input(`route-${router}-${index}-network`)}</td>
                <td>${routingV2Input(`route-${router}-${index}-mask`)}</td>
                <td>${routingV2Input(`route-${router}-${index}-next`)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRoutingV2EquipmentStage() {
  return `
    <div class="task-card">
      <h3>3. Опиши оборудование для сегментов 1000Base-T</h3>
      <div class="routing-v2-equipment-grid">
        <label>
          <span>Активное оборудование</span>
          <textarea class="textarea-input routing-v2-textarea" id="routing-v2-equipment-active" oninput="markRoutingTaskV2Dirty()"></textarea>
        </label>
        <label>
          <span>Пассивное оборудование</span>
          <textarea class="textarea-input routing-v2-textarea" id="routing-v2-equipment-passive" oninput="markRoutingTaskV2Dirty()"></textarea>
        </label>
      </div>
      <div class="task-actions">
        <button class="btn-submit" type="button" onclick="checkRoutingV2Equipment()">Проверить оборудование</button>
      </div>
      <div class="task-feedback" id="routing-v2-feedback-equipment"></div>
    </div>
  `;
}

function renderRoutingV2FinalStage() {
  return `
    <div class="task-card">
      <h3>4. Итоговая проверка</h3>
      <div class="task-actions">
        <button class="btn-primary" type="button" onclick="checkRoutingTaskV2Final()">Проверить всю задачу</button>
      </div>
      <div class="task-feedback" id="routing-v2-feedback-final"></div>
    </div>
  `;
}

function routingV2Input(id) {
  return `<input class="task-input routing-v2-input" id="routing-v2-${id}" autocomplete="off" oninput="markRoutingTaskV2Dirty()">`;
}

function markRoutingTaskV2Dirty() {
  if (routingTaskV2) routingTaskV2.dirty = true;
}

function checkRoutingV2Networks() {
  renderRoutingV2Feedback('routing-v2-feedback-networks', evaluateRoutingV2Networks());
}

function checkRoutingV2Tables() {
  renderRoutingV2Feedback('routing-v2-feedback-tables', evaluateRoutingV2Tables());
}

function checkRoutingV2Equipment() {
  renderRoutingV2Feedback('routing-v2-feedback-equipment', evaluateRoutingV2Equipment());
}

function checkRoutingTaskV2Final() {
  const networks = evaluateRoutingV2Networks();
  const tables = evaluateRoutingV2Tables();
  const equipment = evaluateRoutingV2Equipment();
  const total = round1(networks.score + tables.score + equipment.score);
  const messages = [
    ...messagesForFinal('Сети', networks),
    ...messagesForFinal('Таблицы', tables),
    ...messagesForFinal('Оборудование', equipment)
  ];

  const final = {
    ok: networks.ok && tables.ok && equipment.ok,
    score: total,
    max: 20,
    messages: messages.length ? messages : ['Задача решена корректно.'],
    html: `
      <div class="task-total-score">${total} / 20</div>
      <div class="task-score routing-v2-score">
        ${scoreTile('Сети', networks.score, networks.max)}
        ${scoreTile('Таблицы', tables.score, tables.max)}
        ${scoreTile('Оборудование', equipment.score, equipment.max)}
      </div>
      ${renderRoutingV2Solution()}
    `
  };

  renderRoutingV2Feedback('routing-v2-feedback-final', final);

  if (!routingTaskV2.saved) {
    saveRoutingTaskV2Result(total);
    routingTaskV2.saved = true;
    routingTaskV2.dirty = false;
  }
}

function evaluateRoutingV2Networks() {
  const messages = [];
  let correct = 0;

  routingTaskV2.segments.forEach(seg => {
    const user = readRoutingV2Network(`net-${seg.id}-network`, `net-${seg.id}-mask`);
    if (!user.hasValue || user.network == null || user.prefix == null) {
      messages.push(`${seg.title}: заполни сеть и маску.`);
      return;
    }

    if (user.network !== seg.network) {
      messages.push(`${seg.title}: нужен адрес сети ${routingV2SubnetLabel(seg)}, а не ${intToIp(user.network)}/${user.prefix}.`);
      return;
    }

    if (user.prefix !== seg.prefix) {
      messages.push(`${seg.title}: маска должна быть ${prefixLabel(seg.prefix)} (${seg.mask}).`);
      return;
    }

    correct++;
  });

  return {
    ok: correct === routingTaskV2.segments.length,
    score: round1(correct * 5 / routingTaskV2.segments.length),
    max: 5,
    messages: messages.length ? messages : ['Все сети рассчитаны верно.']
  };
}

function evaluateRoutingV2Tables() {
  const routerResults = ROUTING_V2_DATA.routers.map(router => evaluateRoutingV2Router(router));
  const matched = routerResults.reduce((sum, item) => sum + item.matched, 0);
  const expected = routerResults.reduce((sum, item) => sum + item.expected, 0);
  const messages = [];

  routerResults.forEach(item => {
    if (item.matched === item.expected) return;
    messages.push(`${item.router}: совпало ${item.matched}/${item.expected}.`);
    item.missing.slice(0, 6).forEach(route => {
      messages.push(`${item.router}: не хватает ${formatRoutingV2Route(route)}.`);
    });
    if (item.missing.length > 6) {
      messages.push(`${item.router}: ещё ${item.missing.length - 6} строк не совпало.`);
    }
  });

  return {
    ok: matched === expected,
    score: round1(matched * 12 / expected),
    max: 12,
    messages: messages.length ? messages : ['Все таблицы маршрутизации заполнены верно.']
  };
}

function evaluateRoutingV2Router(router) {
  const expectedRows = routingTaskV2.tables[router];
  const userRows = expectedRows.map((_, index) => readRoutingV2RouteRow(router, index));
  const used = new Set();
  const missing = [];
  let matched = 0;

  expectedRows.forEach(expected => {
    const foundIndex = userRows.findIndex((row, index) =>
      !used.has(index) && routingV2RouteMatches(row, expected)
    );
    if (foundIndex >= 0) {
      used.add(foundIndex);
      matched++;
    } else {
      missing.push(expected);
    }
  });

  return {
    router,
    matched,
    expected: expectedRows.length,
    missing
  };
}

function evaluateRoutingV2Equipment() {
  const active = routingV2NormalizeText(document.getElementById('routing-v2-equipment-active')?.value || '');
  const passive = routingV2NormalizeText(document.getElementById('routing-v2-equipment-passive')?.value || '');
  const groups = [
    { label: 'активное: маршрутизаторы R1-R4', text: active, pattern: /(маршрутиз|роутер|router|r1|r2|r3|r4)/ },
    { label: 'активное: коммутаторы в LAN-сегментах', text: active, pattern: /(коммутат|switch|свитч)/ },
    { label: 'активное: конечные узлы или сетевые адаптеры', text: active, pattern: /(пк|компьютер|хост|узл|сервер|сетев.*адаптер|nic)/ },
    { label: 'пассивное: витая пара или кабель Cat5e/Cat6', text: passive, pattern: /(витая\s+пара|кабель|cat\s?5e|cat\s?6|1000base-t)/ },
    { label: 'пассивное: RJ-45, розетки или коннекторы', text: passive, pattern: /(rj-?45|розет|коннектор|разъем|разъём)/ },
    { label: 'пассивное: патч-корды, патч-панели, кросс или кабельные каналы', text: passive, pattern: /(патч|patch|панел|кросс|стоек|стоик|шкаф|канал)/ }
  ];
  const missing = groups.filter(group => !group.pattern.test(group.text));
  const correct = groups.length - missing.length;

  return {
    ok: missing.length === 0,
    score: round1(correct * 3 / groups.length),
    max: 3,
    messages: missing.length
      ? missing.map(group => `Не указано: ${group.label}.`)
      : ['Оборудование описано достаточно полно.']
  };
}

function readRoutingV2RouteRow(router, index) {
  const typeRaw = routingV2ReadValue(`route-${router}-${index}-type`);
  const networkRaw = routingV2ReadValue(`route-${router}-${index}-network`);
  const maskRaw = routingV2ReadValue(`route-${router}-${index}-mask`);
  const nextRaw = routingV2ReadValue(`route-${router}-${index}-next`);
  const network = parseRoutingV2NetworkFields(networkRaw, maskRaw);

  return {
    type: normalizeRoutingV2RouteType(typeRaw),
    network: network.network,
    prefix: network.prefix,
    nextRaw,
    nextIp: parseIp(nextRaw),
    direct: isRoutingV2DirectNext(nextRaw),
    empty: !typeRaw && !networkRaw && !maskRaw && !nextRaw
  };
}

function routingV2RouteMatches(row, expected) {
  if (row.type !== expected.type) return false;
  if (row.network !== expected.network || row.prefix !== expected.prefix) return false;
  if (expected.nextKind === 'direct') return row.direct;
  return row.nextIp === expected.nextHop;
}

function readRoutingV2Network(networkId, maskId) {
  return parseRoutingV2NetworkFields(routingV2ReadValue(networkId), routingV2ReadValue(maskId));
}

function parseRoutingV2NetworkFields(networkRaw, maskRaw) {
  let networkText = String(networkRaw || '').trim().replace(/\s+/g, '');
  const maskText = String(maskRaw || '').trim();
  let prefixFromCidr = null;
  const cidrMatch = networkText.match(/^(.+)\/(\d{1,2})$/);

  if (cidrMatch) {
    networkText = cidrMatch[1];
    prefixFromCidr = parsePrefix(cidrMatch[2]);
  }

  const prefix = maskText ? parseMaskPrefix(maskText) : prefixFromCidr;
  const network = parseIp(networkText);
  return {
    network,
    prefix,
    hasValue: Boolean(networkText || maskText)
  };
}

function normalizeRoutingV2RouteType(value) {
  const text = routingV2NormalizeText(value).replace(/\s+/g, '');
  if (!text) return null;
  if (text === 's*' || text.includes('default') || text.includes('умолч')) return 'S*';
  if (text === 'c' || text.includes('connected') || text.includes('подключ')) return 'C';
  if (text === 's' || text.includes('static') || text.includes('статич')) return 'S';
  return text.toUpperCase();
}

function isRoutingV2DirectNext(value) {
  const text = routingV2NormalizeText(value);
  return /(direct|connected|напрям|подключ)/.test(text);
}

function routingV2ReadValue(id) {
  return document.getElementById(`routing-v2-${id}`)?.value.trim() || '';
}

function renderRoutingV2Feedback(id, result) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `task-feedback show ${result.ok ? 'ok' : 'bad'}`;
  el.innerHTML = `
    <strong>${result.score} / ${result.max}</strong>
    <ul>${result.messages.map(msg => `<li>${escapeRoutingV2Html(msg)}</li>`).join('')}</ul>
    ${result.html || ''}
  `;
}

function renderRoutingV2Solution() {
  return `
    <div class="routing-v2-solution">
      <h3>Эталонный разбор</h3>
      ${renderRoutingV2SolutionNetworks()}
      ${ROUTING_V2_DATA.routers.map(router => renderRoutingV2SolutionTable(router)).join('')}
      <div class="task-explain">
        <strong>Оборудование:</strong> активное - маршрутизаторы R1-R4, коммутаторы в LAN1-LAN3, конечные узлы/сетевые адаптеры. Пассивное - витая пара Cat5e/Cat6 для 1000Base-T, RJ-45, розетки, патч-корды, патч-панели, кроссовое и кабельные каналы.
      </div>
    </div>
  `;
}

function renderRoutingV2SolutionNetworks() {
  return `
    <div class="task-table-wrap">
      <table class="task-table">
        <thead><tr><th>Сегмент</th><th>Сеть</th><th>Маска</th><th>Broadcast</th><th>Usable-диапазон</th></tr></thead>
        <tbody>
          ${routingTaskV2.segments.map(seg => `
            <tr>
              <td>${seg.title}</td>
              <td>${routingV2SubnetLabel(seg)}</td>
              <td>${seg.mask}</td>
              <td>${intToIp(seg.broadcast)}</td>
              <td>${intToIp(seg.network + 1)} - ${intToIp(seg.broadcast - 1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoutingV2SolutionTable(router) {
  return `
    <section class="routing-v2-router-card routing-v2-solution-card">
      <div class="routing-v2-router-head">
        <strong>${router}</strong>
        <span>эталон</span>
      </div>
      <div class="task-table-wrap">
        <table class="task-table routing-v2-route-table">
          <thead><tr><th>Тип</th><th>Сеть</th><th>Next-hop / интерфейс</th></tr></thead>
          <tbody>
            ${routingTaskV2.tables[router].map(route => `
              <tr>
                <td>${route.type}</td>
                <td>${routingV2SubnetLabel(route)}</td>
                <td>${route.nextKind === 'direct' ? route.nextLabel : `via ${intToIp(route.nextHop)}`}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function saveRoutingTaskV2Result(points) {
  if (typeof saveSession !== 'function') return;
  const elapsed = Math.round((Date.now() - routingTaskV2.startTime) / 1000);
  saveSession({
    correct: points,
    total: 20,
    score: taskGrade(points),
    elapsed,
    topicMap: {
      'Таблицы маршрутизации v2': { ok: points, total: 20 }
    },
    date: Date.now(),
    modeId: 'routing-task-v2',
    modeName: 'Тренажёр v2: таблицы маршрутизации',
    completed: true
  });
  if (typeof renderHistoryTable === 'function') renderHistoryTable();
}

function formatRoutingV2Route(route) {
  const next = route.nextKind === 'direct'
    ? 'directly connected'
    : `via ${intToIp(route.nextHop)}`;
  return `${route.type} ${routingV2SubnetLabel(route)} ${next}`;
}

function routingV2SubnetLabel(item) {
  return `${intToIp(item.network)}/${item.prefix}`;
}

function routingV2NormalizeText(value) {
  return String(value || '').toLowerCase().replace(/ё/g, 'е');
}

function escapeRoutingV2Html(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
