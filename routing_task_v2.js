let routingTaskV2 = null;
let routingTaskV2LastTemplateId = null;

const ROUTING_V2_TEMPLATES = [
  {
    id: 'exam-guide-example',
    title: 'Экзаменационный пример: R1 с двумя ветками',
    routers: ['R1', 'R2', 'R3', 'R4'],
    rootRouter: 'R1',
    externalNextHop: '213.130.10.225',
    positions: {
      width: 1040,
      height: 390,
      routers: {
        R1: { x: 490, y: 150 },
        R2: { x: 245, y: 295 },
        R3: { x: 655, y: 295 },
        R4: { x: 870, y: 295 }
      },
      lans: {
        lan1: { x: 18, y: 260 },
        lan2: { x: 840, y: 110 },
        lan3: { x: 905, y: 278 }
      }
    },
    segments: [
      { id: 'wan', title: 'Глобальная сеть', kind: 'wan', routers: ['R1'], endpointIps: { R1: '213.130.10.226' }, fixedPrefix: 30 },
      { id: 'r1-r2', title: 'R1-R2', kind: 'link', routers: ['R1', 'R2'], endpointIps: { R1: '10.0.3.18', R2: '10.0.3.17' }, fixedPrefix: 30 },
      { id: 'r1-r3', title: 'R1-R3', kind: 'link', routers: ['R1', 'R3'], endpointIps: { R1: '10.0.3.22', R3: '10.0.3.21' }, fixedPrefix: 30 },
      { id: 'r2-r3', title: 'R2-R3', kind: 'link', routers: ['R2', 'R3'], endpointIps: { R2: '10.0.3.25', R3: '10.0.3.26' }, fixedPrefix: 30 },
      { id: 'r3-r4', title: 'R3-R4', kind: 'link', routers: ['R3', 'R4'], endpointIps: { R3: '10.0.3.30', R4: '10.0.3.29' }, fixedPrefix: 30 },
      { id: 'lan1', title: 'LAN1', kind: 'lan', routers: ['R2'], endpointIps: { R2: '10.4.4.37' }, hostRange: ['10.4.4.38', '10.4.4.60'] },
      { id: 'lan2', title: 'LAN2', kind: 'lan', routers: ['R4'], endpointIps: { R4: '10.4.4.137' }, hostRange: ['10.4.4.138', '10.4.4.180'] },
      { id: 'lan3', title: 'LAN3', kind: 'lan', routers: ['R4'], endpointIps: { R4: '10.4.4.197' }, hostRange: ['10.4.4.198', '10.4.4.248'] }
    ]
  },
  {
    id: 'no-r2-r3-through-r1',
    title: 'Без R2-R3: связь левой ветки через R1',
    routers: ['R1', 'R2', 'R3', 'R4'],
    rootRouter: 'R1',
    externalNextHop: '213.130.20.1',
    positions: {
      width: 1040,
      height: 390,
      routers: {
        R1: { x: 500, y: 145 },
        R2: { x: 240, y: 295 },
        R3: { x: 650, y: 295 },
        R4: { x: 870, y: 295 }
      },
      lans: {
        lan1: { x: 18, y: 260 },
        lan2: { x: 575, y: 95 },
        lan3: { x: 905, y: 278 }
      }
    },
    segments: [
      { id: 'wan', title: 'Глобальная сеть', kind: 'wan', routers: ['R1'], endpointIps: { R1: '213.130.20.2' }, fixedPrefix: 30 },
      { id: 'r1-r2', title: 'R1-R2', kind: 'link', routers: ['R1', 'R2'], endpointIps: { R1: '10.0.8.2', R2: '10.0.8.1' }, fixedPrefix: 30 },
      { id: 'r1-r3', title: 'R1-R3', kind: 'link', routers: ['R1', 'R3'], endpointIps: { R1: '10.0.8.5', R3: '10.0.8.6' }, fixedPrefix: 30 },
      { id: 'r3-r4', title: 'R3-R4', kind: 'link', routers: ['R3', 'R4'], endpointIps: { R3: '10.0.8.9', R4: '10.0.8.10' }, fixedPrefix: 30 },
      { id: 'lan1', title: 'LAN1', kind: 'lan', routers: ['R2'], endpointIps: { R2: '10.5.5.33' }, hostRange: ['10.5.5.34', '10.5.5.58'] },
      { id: 'lan2', title: 'LAN2', kind: 'lan', routers: ['R3'], endpointIps: { R3: '10.5.5.97' }, hostRange: ['10.5.5.98', '10.5.5.122'] },
      { id: 'lan3', title: 'LAN3', kind: 'lan', routers: ['R4'], endpointIps: { R4: '10.5.5.193' }, hostRange: ['10.5.5.194', '10.5.5.240'] }
    ]
  },
  {
    id: 'line-no-r1-r3',
    title: 'Линейная топология: R1-R2-R3-R4',
    routers: ['R1', 'R2', 'R3', 'R4'],
    rootRouter: 'R1',
    externalNextHop: '213.130.30.5',
    positions: {
      width: 1040,
      height: 390,
      routers: {
        R1: { x: 190, y: 190 },
        R2: { x: 410, y: 190 },
        R3: { x: 630, y: 190 },
        R4: { x: 850, y: 190 }
      },
      lans: {
        lan1: { x: 315, y: 286 },
        lan2: { x: 555, y: 286 },
        lan3: { x: 790, y: 286 },
        lan4: { x: 905, y: 72 }
      }
    },
    segments: [
      { id: 'wan', title: 'Глобальная сеть', kind: 'wan', routers: ['R1'], endpointIps: { R1: '213.130.30.6' }, fixedPrefix: 30 },
      { id: 'r1-r2', title: 'R1-R2', kind: 'link', routers: ['R1', 'R2'], endpointIps: { R1: '10.0.9.1', R2: '10.0.9.2' }, fixedPrefix: 30 },
      { id: 'r2-r3', title: 'R2-R3', kind: 'link', routers: ['R2', 'R3'], endpointIps: { R2: '10.0.9.5', R3: '10.0.9.6' }, fixedPrefix: 30 },
      { id: 'r3-r4', title: 'R3-R4', kind: 'link', routers: ['R3', 'R4'], endpointIps: { R3: '10.0.9.9', R4: '10.0.9.10' }, fixedPrefix: 30 },
      { id: 'lan1', title: 'LAN1', kind: 'lan', routers: ['R2'], endpointIps: { R2: '10.6.6.17' }, hostRange: ['10.6.6.18', '10.6.6.28'] },
      { id: 'lan2', title: 'LAN2', kind: 'lan', routers: ['R3'], endpointIps: { R3: '10.6.6.65' }, hostRange: ['10.6.6.66', '10.6.6.90'] },
      { id: 'lan3', title: 'LAN3', kind: 'lan', routers: ['R4'], endpointIps: { R4: '10.6.6.129' }, hostRange: ['10.6.6.130', '10.6.6.180'] },
      { id: 'lan4', title: 'LAN4', kind: 'lan', routers: ['R4'], endpointIps: { R4: '10.6.6.193' }, hostRange: ['10.6.6.194', '10.6.6.230'] }
    ]
  },
  {
    id: 'three-router-chain',
    title: 'Три маршрутизатора цепочкой',
    routers: ['R1', 'R2', 'R3'],
    rootRouter: 'R1',
    externalNextHop: '213.130.40.9',
    positions: {
      width: 900,
      height: 390,
      routers: {
        R1: { x: 210, y: 185 },
        R2: { x: 450, y: 185 },
        R3: { x: 690, y: 185 }
      },
      lans: {
        lan1: { x: 95, y: 280 },
        lan2: { x: 385, y: 280 },
        lan3: { x: 680, y: 280 }
      }
    },
    segments: [
      { id: 'wan', title: 'Глобальная сеть', kind: 'wan', routers: ['R1'], endpointIps: { R1: '213.130.40.10' }, fixedPrefix: 30 },
      { id: 'r1-r2', title: 'R1-R2', kind: 'link', routers: ['R1', 'R2'], endpointIps: { R1: '10.0.10.1', R2: '10.0.10.2' }, fixedPrefix: 30 },
      { id: 'r2-r3', title: 'R2-R3', kind: 'link', routers: ['R2', 'R3'], endpointIps: { R2: '10.0.10.5', R3: '10.0.10.6' }, fixedPrefix: 30 },
      { id: 'lan1', title: 'LAN1', kind: 'lan', routers: ['R1'], endpointIps: { R1: '10.7.7.17' }, hostRange: ['10.7.7.18', '10.7.7.29'] },
      { id: 'lan2', title: 'LAN2', kind: 'lan', routers: ['R2'], endpointIps: { R2: '10.7.7.65' }, hostRange: ['10.7.7.66', '10.7.7.88'] },
      { id: 'lan3', title: 'LAN3', kind: 'lan', routers: ['R3'], endpointIps: { R3: '10.7.7.129' }, hostRange: ['10.7.7.130', '10.7.7.178'] }
    ]
  },
  {
    id: 'star-through-r1',
    title: 'Звезда: все ветки идут через R1',
    routers: ['R1', 'R2', 'R3', 'R4'],
    rootRouter: 'R1',
    externalNextHop: '213.130.50.13',
    positions: {
      width: 1040,
      height: 460,
      routers: {
        R1: { x: 510, y: 145 },
        R2: { x: 245, y: 280 },
        R3: { x: 510, y: 280 },
        R4: { x: 775, y: 280 }
      },
      lans: {
        lan1: { x: 28, y: 245 },
        lan2: { x: 425, y: 350 },
        lan3: { x: 835, y: 245 }
      }
    },
    segments: [
      { id: 'wan', title: 'Глобальная сеть', kind: 'wan', routers: ['R1'], endpointIps: { R1: '213.130.50.14' }, fixedPrefix: 30 },
      { id: 'r1-r2', title: 'R1-R2', kind: 'link', routers: ['R1', 'R2'], endpointIps: { R1: '10.0.11.1', R2: '10.0.11.2' }, fixedPrefix: 30 },
      { id: 'r1-r3', title: 'R1-R3', kind: 'link', routers: ['R1', 'R3'], endpointIps: { R1: '10.0.11.5', R3: '10.0.11.6' }, fixedPrefix: 30 },
      { id: 'r1-r4', title: 'R1-R4', kind: 'link', routers: ['R1', 'R4'], endpointIps: { R1: '10.0.11.9', R4: '10.0.11.10' }, fixedPrefix: 30 },
      { id: 'lan1', title: 'LAN1', kind: 'lan', routers: ['R2'], endpointIps: { R2: '10.8.8.33' }, hostRange: ['10.8.8.34', '10.8.8.55'] },
      { id: 'lan2', title: 'LAN2', kind: 'lan', routers: ['R3'], endpointIps: { R3: '10.8.8.97' }, hostRange: ['10.8.8.98', '10.8.8.125'] },
      { id: 'lan3', title: 'LAN3', kind: 'lan', routers: ['R4'], endpointIps: { R4: '10.8.8.193' }, hostRange: ['10.8.8.194', '10.8.8.238'] }
    ]
  }
];

function getRoutingV2Templates() {
  return ROUTING_V2_TEMPLATES;
}

function startRoutingTaskV2(options = {}) {
  if (routingTaskV2?.dirty && !routingTaskV2.saved) {
    const ok = confirm('Начать новую задачу v2? Введённые ответы будут потеряны.');
    if (!ok) return;
  }

  routingTaskV2 = buildRoutingTaskV2(pickRoutingV2Template());
  routingTaskV2.examMode = Boolean(options.examMode);
  routingTaskV2LastTemplateId = routingTaskV2.templateId;
  renderRoutingTaskV2();
  updateRoutingV2ScreenChrome();
  showScreen('routing-task-v2-screen');
}

function resetRoutingTaskV2() {
  if (routingTaskV2?.dirty && !routingTaskV2.saved) {
    const ok = confirm('Создать новую задачу v2? Введённые ответы будут потеряны.');
    if (!ok) return;
  }
  routingTaskV2 = buildRoutingTaskV2(pickRoutingV2Template(routingTaskV2?.templateId));
  routingTaskV2LastTemplateId = routingTaskV2.templateId;
  renderRoutingTaskV2();
  updateRoutingV2ScreenChrome();
}

function exitRoutingTaskV2() {
  if (routingTaskV2?.examMode) {
    const ok = confirm('Прервать экзамен и сохранить его как незавершённый?');
    if (!ok) return;
    if (typeof abortExamFromTask === 'function') abortExamFromTask();
    else showScreen('start-screen');
    return;
  }

  if (routingTaskV2?.dirty && !routingTaskV2.saved) {
    const ok = confirm('Выйти в меню? Введённые ответы в v2 не сохранятся.');
    if (!ok) return;
  }
  showScreen('start-screen');
}

function updateRoutingV2ScreenChrome() {
  const title = document.getElementById('routing-task-v2-title');
  const newButton = document.getElementById('routing-task-v2-new-btn');
  if (title) {
    title.textContent = routingTaskV2?.examMode
      ? 'Экзамен v2: составь таблицы маршрутизации'
      : 'Составь таблицы маршрутизации по готовой схеме';
  }
  if (newButton) {
    newButton.style.display = routingTaskV2?.examMode ? 'none' : 'inline-flex';
  }
}

function pickRoutingV2Template(previousId = routingTaskV2LastTemplateId) {
  const pool = ROUTING_V2_TEMPLATES.filter(template => template.id !== previousId);
  const source = pool.length ? pool : ROUTING_V2_TEMPLATES;
  return source[Math.floor(Math.random() * source.length)];
}

function buildRoutingTaskV2(template = ROUTING_V2_TEMPLATES[0]) {
  const segments = template.segments.map((seg, index) => {
    const prefix = seg.fixedPrefix ?? computeRoutingV2LanPrefix(seg);
    const anchorIp = routingV2SegmentAnchorIp(seg);
    const network = networkOf(anchorIp, prefix);
    const broadcast = broadcastOf(network, prefix);
    return {
      ...seg,
      sourceIndex: index,
      prefix,
      network,
      broadcast,
      mask: prefixToMask(prefix),
      size: blockSize(prefix),
      usable: usableHosts(prefix),
      given: routingV2SegmentGiven(seg, template)
    };
  });
  const byId = Object.fromEntries(segments.map(seg => [seg.id, seg]));
  const graph = buildRoutingV2Graph(template.routers, segments);
  const tables = Object.fromEntries(template.routers.map(router => [
    router,
    buildRoutingV2Table(router, template, segments, byId, graph)
  ]));

  return {
    template,
    templateId: template.id,
    templateTitle: template.title,
    routers: [...template.routers],
    rootRouter: template.rootRouter,
    externalNextHop: template.externalNextHop,
    segments,
    byId,
    graph,
    tables,
    routeRowCounts: Object.fromEntries(template.routers.map(router => [router, 0])),
    startTime: Date.now(),
    dirty: false,
    saved: false
  };
}

function routingV2SegmentGiven(seg, template) {
  if (seg.kind === 'wan') {
    const router = seg.routers[0];
    return `Стрелка в глобальную сеть: ${template.externalNextHop}, интерфейс ${router}: ${seg.endpointIps[router]}`;
  }
  if (seg.kind === 'link') {
    return seg.routers.map(router => `${router}: ${seg.endpointIps[router]}`).join(', ');
  }
  const router = seg.routers[0];
  return `${router}: ${seg.endpointIps[router]}, узлы ${seg.title}: ${seg.hostRange[0]}-${seg.hostRange[1]}`;
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

function buildRoutingV2Graph(routers, segments) {
  const graph = Object.fromEntries(routers.map(router => [router, []]));
  segments
    .filter(seg => seg.kind === 'link' && seg.routers.length === 2)
    .forEach(seg => {
      const [a, b] = seg.routers;
      graph[a].push({ router: b, segmentId: seg.id });
      graph[b].push({ router: a, segmentId: seg.id });
    });
  return graph;
}

function buildRoutingV2Table(router, template, segments, byId, graph) {
  const connectedRows = sortRoutingV2ConnectedSegments(
    segments.filter(seg => seg.routers.includes(router))
  ).map(seg => ({
    type: 'C',
    segmentId: seg.id,
    network: seg.network,
    prefix: seg.prefix,
    nextKind: 'direct',
    nextLabel: routingV2DirectLabel(router, seg)
  }));

  const staticRows = sortRoutingV2StaticSegments(
    segments.filter(seg => !seg.routers.includes(router))
  ).map(seg => {
    const nextRouter = findRoutingV2NextRouter(router, seg, graph, template.routers);
    const shared = findRoutingV2SharedLink(router, nextRouter, segments);
    if (!shared) throw new Error(`No shared link from ${router} to ${nextRouter}`);
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
    buildRoutingV2DefaultRoute(router, template, graph, segments)
  ];
}

function sortRoutingV2ConnectedSegments(segments) {
  const kindOrder = { wan: 0, link: 1, lan: 2 };
  return [...segments].sort((a, b) =>
    kindOrder[a.kind] - kindOrder[b.kind] || a.sourceIndex - b.sourceIndex
  );
}

function sortRoutingV2StaticSegments(segments) {
  const kindOrder = { link: 0, lan: 1, wan: 2 };
  return [...segments].sort((a, b) =>
    kindOrder[a.kind] - kindOrder[b.kind] || a.sourceIndex - b.sourceIndex
  );
}

function buildRoutingV2DefaultRoute(router, template, graph, segments) {
  if (router === template.rootRouter) {
    return {
      type: 'S*',
      segmentId: 'default',
      network: 0,
      prefix: 0,
      nextKind: 'ip',
      nextHop: ipToInt(template.externalNextHop),
      nextRouter: 'global'
    };
  }

  const nextRouter = findRoutingV2NextRouterToRouter(router, template.rootRouter, graph, template.routers);
  const shared = findRoutingV2SharedLink(router, nextRouter, segments);
  if (!shared) throw new Error(`No default next-hop from ${router} to ${template.rootRouter}`);
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

function findRoutingV2NextRouter(fromRouter, targetSegment, graph, routers = routingTaskV2?.routers || []) {
  const targets = [...targetSegment.routers].sort((a, b) => routingV2RouterSort(a, b, routers));
  const routes = targets
    .map(target => ({
      target,
      path: findRoutingV2Path(fromRouter, target, graph, routers)
    }))
    .filter(item => item.path.length > 1)
    .sort((a, b) => a.path.length - b.path.length || routingV2RouterSort(a.target, b.target, routers));
  return routes[0]?.path[1] || null;
}

function findRoutingV2NextRouterToRouter(fromRouter, targetRouter, graph, routers = routingTaskV2?.routers || []) {
  const path = findRoutingV2Path(fromRouter, targetRouter, graph, routers);
  return path[1] || null;
}

function findRoutingV2Path(fromRouter, targetRouter, graph, routers = routingTaskV2?.routers || []) {
  if (fromRouter === targetRouter) return [fromRouter];

  const queue = [[fromRouter]];
  const visited = new Set([fromRouter]);
  while (queue.length) {
    const path = queue.shift();
    const current = path[path.length - 1];
    const nextItems = [...(graph[current] || [])].sort((a, b) => routingV2RouterSort(a.router, b.router, routers));
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

function routingV2RouterSort(a, b, routers = routingTaskV2?.routers || []) {
  return routers.indexOf(a) - routers.indexOf(b);
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
  const lanCount = routingTaskV2.segments.filter(seg => seg.kind === 'lan').length;
  const linkCount = routingTaskV2.segments.filter(seg => seg.kind === 'link').length;
  const note = routingTaskV2.examMode ? '' : `
      <div class="routing-v2-note">
        <strong>Что дано:</strong> ${routingTaskV2.routers.length} маршрутизатора, ${lanCount} LAN, ${linkCount} router-to-router линка, выход в глобальную сеть через ${routingTaskV2.rootRouter}. Сети, маски, типы маршрутов и next-hop нужно вывести самостоятельно.
      </div>
    `;
  return `
    <div class="task-card task-statement routing-v2-statement">
      <div class="task-kicker">Условие задачи // ${routingTaskV2.templateTitle}</div>
      <h3>На рисунке показана структура локальной сети Intranet. Стрелкой показан маршрут, ведущий в глобальную сеть, подписаны адреса узлов.</h3>
      <p>Приведите содержимое таблиц маршрутизации всех показанных на схеме маршрутизаторов и опишите активное и пассивное оборудование, если каждое облако - это сегмент коммутируемой сети 1000Base-T.</p>
      ${renderRoutingV2Diagram()}
      ${note}
    </div>
  `;
}

function renderRoutingV2Diagram() {
  const positions = routingTaskV2.template.positions;
  const lines = [];
  const nodes = [];
  const labels = [];

  routingTaskV2.segments.forEach(seg => {
    if (seg.kind === 'wan') {
      const router = seg.routers[0];
      const pos = positions.routers[router];
      lines.push(renderRoutingV2Line(pos.x, pos.y - 92, pos.x, pos.y - 29, true));
      labels.push(renderRoutingV2TextLabel(routingTaskV2.externalNextHop, pos.x - 72, pos.y - 104, 'middle'));
      labels.push(renderRoutingV2TextLabel(seg.endpointIps[router], pos.x + 72, pos.y - 43, 'middle'));
    }

    if (seg.kind === 'link') {
      const [a, b] = seg.routers;
      const aPos = positions.routers[a];
      const bPos = positions.routers[b];
      lines.push(renderRoutingV2Line(aPos.x, aPos.y, bPos.x, bPos.y));
      labels.push(renderRoutingV2EndpointLabel(seg.endpointIps[a], aPos, bPos, 0.24, -18));
      labels.push(renderRoutingV2EndpointLabel(seg.endpointIps[b], aPos, bPos, 0.76, -18));
    }

    if (seg.kind === 'lan') {
      const router = seg.routers[0];
      const routerPos = positions.routers[router];
      const lanPos = positions.lans[seg.id];
      const cloudCenter = routingV2CloudCenter(lanPos);
      lines.push(renderRoutingV2Line(routerPos.x, routerPos.y, cloudCenter.x, cloudCenter.y));
      nodes.push(renderRoutingV2Cloud(seg, lanPos));
      labels.push(renderRoutingV2TextLabel(`${seg.hostRange[0]}-${seg.hostRange[1]}`, cloudCenter.x, lanPos.y - 15, 'middle'));
      labels.push(renderRoutingV2EndpointLabel(seg.endpointIps[router], routerPos, cloudCenter, 0.34, 18));
    }
  });

  routingTaskV2.routers.forEach(router => {
    nodes.push(renderRoutingV2Router(router, positions.routers[router]));
  });

  return `
    <div class="routing-v2-diagram" aria-label="Схема сети Intranet">
      <svg viewBox="0 0 ${positions.width} ${positions.height}" role="img" aria-label="Схема задачи ${escapeRoutingV2Html(routingTaskV2.templateTitle)}">
        <defs>
          <marker id="routing-v2-arrow-${routingTaskV2.templateId}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z"></path>
          </marker>
        </defs>
        ${lines.join('')}
        ${nodes.join('')}
        <g class="routing-v2-labels">${labels.join('')}</g>
      </svg>
    </div>
  `;
}

function renderRoutingV2Line(x1, y1, x2, y2, arrowStart = false) {
  const marker = arrowStart ? ` marker-start="url(#routing-v2-arrow-${routingTaskV2.templateId})"` : '';
  return `<line class="routing-v2-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${marker}></line>`;
}

function renderRoutingV2Router(router, pos) {
  return `
    <g class="routing-v2-router" transform="translate(${pos.x} ${pos.y})">
      <circle r="27"></circle>
      <text y="5">${router}</text>
    </g>
  `;
}

function renderRoutingV2Cloud(seg, pos) {
  return `
    <g class="routing-v2-cloud" transform="translate(${pos.x} ${pos.y})">
      <path d="M17 32 C8 10 42 2 58 17 C74 -5 118 2 124 28 C151 27 164 58 143 75 L39 75 C13 74 -2 49 17 32 Z"></path>
      <text x="52" y="49">${seg.title}</text>
    </g>
  `;
}

function routingV2CloudCenter(pos) {
  return { x: pos.x + 74, y: pos.y + 42 };
}

function renderRoutingV2EndpointLabel(text, start, end, t, offset) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const nx = -dy / len;
  const ny = dx / len;
  return renderRoutingV2TextLabel(
    text,
    start.x + dx * t + nx * offset,
    start.y + dy * t + ny * offset,
    'middle'
  );
}

function renderRoutingV2TextLabel(text, x, y, anchor = 'middle') {
  return `<text class="routing-v2-ip" x="${round1(x)}" y="${round1(y)}" text-anchor="${anchor}">${escapeRoutingV2Html(text)}</text>`;
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
      ${routingV2StageActions('networks', 'Проверить сети')}
    </div>
  `;
}

function renderRoutingV2TablesStage() {
  return `
    <div class="task-card">
      <h3>2. Заполни таблицы маршрутизации всех маршрутизаторов</h3>
      ${routingTaskV2.examMode ? '' : '<p class="routing-v2-muted">Порядок строк не важен. В каждой таблице должны быть все сети: LAN, router-to-router, глобальная сеть и маршрут по умолчанию.</p>'}
      <div class="routing-v2-router-grid">
        ${routingTaskV2.routers.map(router => renderRoutingV2RouterTable(router)).join('')}
      </div>
      ${routingV2StageActions('tables', 'Проверить таблицы')}
    </div>
  `;
}

function renderRoutingV2RouterTable(router) {
  return `
    <section class="routing-v2-router-card">
      <div class="routing-v2-router-head">
        <strong>${router}</strong>
        <span>количество строк определи сам</span>
      </div>
      <div class="task-table-wrap">
        <table class="task-table routing-v2-route-table">
          <thead><tr><th>Тип</th><th>Сеть</th><th>Маска или префикс</th><th>Next-hop / интерфейс</th></tr></thead>
          <tbody id="routing-v2-routes-${router}">
            <tr class="routing-v2-empty-row" id="routing-v2-empty-${router}">
              <td colspan="4">Добавь строки таблицы маршрутизации для ${router}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="routing-v2-row-actions">
        <button class="btn-ghost" type="button" onclick="addRoutingV2RouteRow('${router}')">Добавить строку</button>
      </div>
    </section>
  `;
}

function addRoutingV2RouteRow(router) {
  if (!routingTaskV2?.routeRowCounts || !routingTaskV2.routers.includes(router)) return;

  const index = routingTaskV2.routeRowCounts[router]++;
  const tbody = document.getElementById(`routing-v2-routes-${router}`);
  const empty = document.getElementById(`routing-v2-empty-${router}`);
  if (!tbody) return;

  empty?.remove();
  tbody.insertAdjacentHTML('beforeend', renderRoutingV2RouteInputRow(router, index));
  markRoutingTaskV2Dirty();
}

function removeRoutingV2RouteRow(router, index) {
  document.getElementById(`routing-v2-route-row-${router}-${index}`)?.remove();
  const tbody = document.getElementById(`routing-v2-routes-${router}`);
  if (tbody && !tbody.querySelector('tr')) {
    tbody.innerHTML = `
      <tr class="routing-v2-empty-row" id="routing-v2-empty-${router}">
        <td colspan="4">Добавь строки таблицы маршрутизации для ${router}</td>
      </tr>
    `;
  }
  markRoutingTaskV2Dirty();
}

function renderRoutingV2RouteInputRow(router, index) {
  return `
    <tr id="routing-v2-route-row-${router}-${index}" data-routing-v2-router="${router}" data-routing-v2-index="${index}">
      <td>${routingV2Input(`route-${router}-${index}-type`)}</td>
      <td>${routingV2Input(`route-${router}-${index}-network`)}</td>
      <td>${routingV2Input(`route-${router}-${index}-mask`)}</td>
      <td>
        <div class="routing-v2-next-cell">
          ${routingV2Input(`route-${router}-${index}-next`)}
          <button class="routing-v2-remove-row" type="button" aria-label="Удалить строку" onclick="removeRoutingV2RouteRow('${router}', ${index})">×</button>
        </div>
      </td>
    </tr>
  `;
}

function renderRoutingV2EquipmentStage() {
  return `
    <div class="task-card">
      <h3>3. Опиши оборудование для сегментов 1000Base-T</h3>
      ${routingTaskV2.examMode ? '' : `<p class="routing-v2-muted">Без лишней детализации: активное - то, что реально работает с трафиком; пассивное - кабельная часть. Если преподаватель относит ПК к пассивным/оконечным узлам, такой ответ тоже принимается.</p>`}
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
      ${routingV2StageActions('equipment', 'Проверить оборудование')}
    </div>
  `;
}

function renderRoutingV2FinalStage() {
  const buttonText = routingTaskV2.examMode ? 'Завершить экзамен' : 'Проверить всю задачу';
  return `
    <div class="task-card">
      <h3>4. Итоговая проверка</h3>
      <div class="task-actions">
        <button class="btn-primary" type="button" onclick="checkRoutingTaskV2Final()">${buttonText}</button>
      </div>
      <div class="task-feedback" id="routing-v2-feedback-final"></div>
    </div>
  `;
}

function routingV2StageActions(stage, label) {
  if (routingTaskV2.examMode) return '';
  const fn = {
    networks: 'checkRoutingV2Networks',
    tables: 'checkRoutingV2Tables',
    equipment: 'checkRoutingV2Equipment'
  }[stage];
  return `
    <div class="task-actions">
      <button class="btn-submit" type="button" onclick="${fn}()">${label}</button>
    </div>
    <div class="task-feedback" id="routing-v2-feedback-${stage}"></div>
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

  const review = {
    total,
    max: 20,
    breakdown: [
      { label: 'Сети', score: networks.score, max: networks.max },
      { label: 'Таблицы', score: tables.score, max: tables.max },
      { label: 'Оборудование', score: equipment.score, max: equipment.max }
    ],
    messages,
    solutionHtml: renderRoutingV2Solution()
  };

  if (routingTaskV2.examMode && typeof finishExamFromTask === 'function') {
    if (routingTaskV2.saved) {
      if (typeof showExamResultScreen === 'function') showExamResultScreen();
      return;
    }

    finishExamFromTask(total, review);
    routingTaskV2.saved = true;
    routingTaskV2.dirty = false;
    if (typeof showExamResultScreen === 'function') showExamResultScreen();
    return;
  }

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
      ${review.solutionHtml}
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

    const alignedNetwork = networkOf(user.network, user.prefix);
    if (alignedNetwork !== user.network) {
      messages.push(`${seg.title}: ${intToIp(user.network)} не является адресом сети для ${prefixLabel(user.prefix)}. Для этой маски блок начинается с ${intToIp(alignedNetwork)}.`);
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
  const routerResults = routingTaskV2.routers.map(router => evaluateRoutingV2Router(router));
  const matched = routerResults.reduce((sum, item) => sum + item.matched, 0);
  const expected = routerResults.reduce((sum, item) => sum + item.expected, 0);
  const extra = routerResults.reduce((sum, item) => sum + item.extra.length, 0);
  const messages = [];

  routerResults.forEach(item => {
    if (item.matched !== item.expected) {
      messages.push(`${item.router}: совпало ${item.matched}/${item.expected}.`);
      item.missing.slice(0, 6).forEach(route => {
        messages.push(`${item.router}: не хватает ${formatRoutingV2Route(route)}.`);
      });
      if (item.missing.length > 6) {
        messages.push(`${item.router}: ещё ${item.missing.length - 6} строк не совпало.`);
      }
    }
    if (item.extra.length) {
      messages.push(`${item.router}: лишних или неверных строк: ${item.extra.length}.`);
    }
  });

  const score = Math.max(0, round1(matched * 12 / expected - Math.min(extra, 6) * 0.5));

  return {
    ok: matched === expected && extra === 0,
    score,
    max: 12,
    messages: messages.length ? messages : ['Все таблицы маршрутизации заполнены верно.']
  };
}

function evaluateRoutingV2Router(router) {
  const expectedRows = routingTaskV2.tables[router];
  const userRows = readRoutingV2RouteRows(router);
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

  const extra = userRows.filter((row, index) => !used.has(index));

  return {
    router,
    matched,
    expected: expectedRows.length,
    missing,
    extra
  };
}

function readRoutingV2RouteRows(router) {
  return [...document.querySelectorAll(`tr[data-routing-v2-router="${router}"]`)]
    .map(row => readRoutingV2RouteRow(router, row.dataset.routingV2Index))
    .filter(row => !row.empty);
}

function evaluateRoutingV2Equipment() {
  const active = routingV2NormalizeText(document.getElementById('routing-v2-equipment-active')?.value || '');
  const passive = routingV2NormalizeText(document.getElementById('routing-v2-equipment-passive')?.value || '');
  const passiveHasCable = /(витая\s+пара|кабель|cat\s?5e|cat\s?6|1000base-t|rj-?45|розет|коннектор|разъем|разъём|патч|patch|панел|кросс|стоек|стоик|шкаф|канал)/.test(passive);
  const passiveHasHosts = /(пк|компьютер|хост|узл|сервер|рабоч.*станц|сетев.*адаптер|nic)/.test(passive);
  const groups = [
    { label: 'активное: маршрутизаторы схемы', ok: /(маршрутиз|роутер|router|r1|r2|r3|r4)/.test(active) },
    { label: 'активное: коммутаторы в LAN-сегментах', ok: /(коммутат|switch|свитч)/.test(active) },
    { label: 'пассивное: кабельная часть 1000Base-T или ПК/хосты по трактовке преподавателя', ok: passiveHasCable || passiveHasHosts }
  ];
  const missing = groups.filter(group => !group.ok);
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
      ${routingTaskV2.routers.map(router => renderRoutingV2SolutionTable(router)).join('')}
      <div class="task-explain">
        <strong>Оборудование:</strong> активное - маршрутизаторы ${routingTaskV2.routers.join(', ')} и коммутаторы в LAN-сегментах. Пассивное по строгой сетевой терминологии - кабельная система 1000Base-T: витая пара Cat5e/Cat6, RJ-45, патч-корды, розетки, патч-панели. Если преподаватель называет ПК пассивными, допиши их как ПК/хосты LAN или оконечные узлы, но не вместо маршрутизаторов и коммутаторов.
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
    modeName: `Тренажёр v2: ${routingTaskV2.templateTitle}`,
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
