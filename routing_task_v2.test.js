const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('subnet_task.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('routing_task_v2.js', 'utf8'), ctx);

const templates = ctx.getRoutingV2Templates();
assert(templates.length >= 4, 'Expected several routing v2 templates');

let checkedRoutes = 0;

for (const template of templates) {
  const task = ctx.buildRoutingTaskV2(template);
  validateTaskShape(task);
  validateDiagramGeometry(task);
  validateSegments(task);
  validateTables(task);
  validateUserTableScoring(task);
}

console.log(`routing_task_v2: ${templates.length} templates ok, ${checkedRoutes} route rows checked`);

function validateTaskShape(task) {
  assert(task.routers.length === 3 || task.routers.length === 4, `${task.templateId}: router count`);
  const lanCount = task.segments.filter(seg => seg.kind === 'lan').length;
  assert(lanCount === 3 || lanCount === 4, `${task.templateId}: LAN count`);
  assert(task.routers.includes(task.rootRouter), `${task.templateId}: root router is missing`);

  for (const router of task.routers) {
    const path = ctx.findRoutingV2Path(router, task.rootRouter, task.graph, task.routers);
    assert(path.length >= 1, `${task.templateId}: ${router} has no path to root`);
  }
}

function validateSegments(task) {
  const sorted = [...task.segments].sort((a, b) => a.network - b.network);
  for (let i = 1; i < sorted.length; i++) {
    assert(sorted[i].network > sorted[i - 1].broadcast, `${task.templateId}: overlapping segments`);
  }

  for (const seg of task.segments) {
    if (seg.kind === 'link' || seg.kind === 'wan') {
      assert.strictEqual(seg.prefix, 30, `${task.templateId}: ${seg.id} must be /30`);
    }

    for (const [router, ipText] of Object.entries(seg.endpointIps || {})) {
      const ip = ctx.ipToInt(ipText);
      assert(seg.routers.includes(router), `${task.templateId}: endpoint router ${router} not in segment ${seg.id}`);
      assert(ip > seg.network && ip < seg.broadcast, `${task.templateId}: endpoint IP outside usable range ${seg.id}`);
    }

    if (seg.kind === 'lan') {
      const [firstText, lastText] = seg.hostRange;
      const first = ctx.ipToInt(firstText);
      const last = ctx.ipToInt(lastText);
      assert(first <= last, `${task.templateId}: invalid LAN range ${seg.id}`);
      assert(first > seg.network && last < seg.broadcast, `${task.templateId}: LAN host range outside subnet ${seg.id}`);
      assert.strictEqual(ctx.computeRoutingV2LanPrefix(seg), seg.prefix, `${task.templateId}: LAN prefix mismatch ${seg.id}`);
    }
  }
}

function validateDiagramGeometry(task) {
  const positions = task.template.positions;
  assert(positions?.routers, `${task.templateId}: missing router positions`);
  assert(positions?.lans, `${task.templateId}: missing LAN positions`);

  for (const seg of task.segments.filter(item => item.kind === 'lan')) {
    const lan = positions.lans[seg.id];
    assert(lan, `${task.templateId}: missing LAN position for ${seg.id}`);
    const cloudCenter = { x: lan.x + 74, y: lan.y + 42 };
    for (const [router, pos] of Object.entries(positions.routers)) {
      const distance = Math.hypot(cloudCenter.x - pos.x, cloudCenter.y - pos.y);
      assert(distance >= 82, `${task.templateId}: ${seg.id} visually overlaps ${router}`);
    }
  }
}


function validateTables(task) {
  for (const router of task.routers) {
    const rows = task.tables[router];
    assert.strictEqual(rows.length, task.segments.length + 1, `${task.templateId}: ${router} row count`);
    assert.strictEqual(rows.filter(row => row.type === 'S*').length, 1, `${task.templateId}: ${router} default route count`);

    const keys = new Set(rows.map(row => `${row.type}|${row.network}|${row.prefix}|${row.nextHop || row.nextKind}`));
    assert.strictEqual(keys.size, rows.length, `${task.templateId}: ${router} duplicate route rows`);

    const connectedIds = new Set(task.segments.filter(seg => seg.routers.includes(router)).map(seg => seg.id));
    const connectedRows = rows.filter(row => row.type === 'C');
    assert.strictEqual(connectedRows.length, connectedIds.size, `${task.templateId}: ${router} connected row count`);
    for (const row of connectedRows) {
      assert(connectedIds.has(row.segmentId), `${task.templateId}: ${router} false connected route ${row.segmentId}`);
      assert.strictEqual(row.nextKind, 'direct', `${task.templateId}: ${router} connected next kind`);
    }

    for (const row of rows.filter(item => item.type === 'S')) {
      checkedRoutes++;
      const target = task.byId[row.segmentId];
      assert(target, `${task.templateId}: ${router} missing static target ${row.segmentId}`);
      assert(!target.routers.includes(router), `${task.templateId}: ${router} static route to connected segment ${row.segmentId}`);
      validateNextHop(task, router, row);
    }

    const defaultRoute = rows.find(row => row.type === 'S*');
    checkedRoutes++;
    assert.strictEqual(defaultRoute.network, 0, `${task.templateId}: ${router} default network`);
    assert.strictEqual(defaultRoute.prefix, 0, `${task.templateId}: ${router} default prefix`);
    if (router === task.rootRouter) {
      assert.strictEqual(defaultRoute.nextHop, ctx.ipToInt(task.externalNextHop), `${task.templateId}: root default next-hop`);
    } else {
      validateNextHop(task, router, defaultRoute);
      const nextRouter = defaultRoute.nextRouter;
      const path = ctx.findRoutingV2Path(router, task.rootRouter, task.graph, task.routers);
      assert.strictEqual(path[1], nextRouter, `${task.templateId}: ${router} default must point toward root`);
    }
  }
}

function validateNextHop(task, router, row) {
  const shared = task.segments.find(seg =>
    seg.kind === 'link' &&
    seg.routers.includes(router) &&
    seg.routers.includes(row.nextRouter)
  );
  assert(shared, `${task.templateId}: ${router} next-hop is not on a connected link`);
  assert.strictEqual(row.nextHop, ctx.ipToInt(shared.endpointIps[row.nextRouter]), `${task.templateId}: ${router} wrong next-hop IP`);
  assert.notStrictEqual(row.nextHop, ctx.ipToInt(shared.endpointIps[router]), `${task.templateId}: ${router} uses own IP as next-hop`);
}

function validateUserTableScoring(task) {
  const values = {};
  const domRows = {};

  for (const router of task.routers) {
    domRows[router] = task.tables[router].map((route, index) => {
      values[`routing-v2-route-${router}-${index}-type`] = route.type;
      values[`routing-v2-route-${router}-${index}-network`] = ctx.intToIp(route.network);
      values[`routing-v2-route-${router}-${index}-mask`] = `/${route.prefix}`;
      values[`routing-v2-route-${router}-${index}-next`] = route.nextKind === 'direct'
        ? 'directly connected'
        : ctx.intToIp(route.nextHop);
      return { dataset: { routingV2Index: String(index) } };
    });
  }

  ctx.__task = task;
  ctx.document = {
    getElementById(id) {
      return { value: values[id] || '' };
    },
    querySelectorAll(selector) {
      const match = selector.match(/data-routing-v2-router="([^"]+)"/);
      return match ? domRows[match[1]] || [] : [];
    }
  };

  const result = vm.runInContext('routingTaskV2 = __task; evaluateRoutingV2Tables()', ctx);
  assert.strictEqual(result.ok, true, `${task.templateId}: expected user table answer to be accepted`);
  assert.strictEqual(result.score, 12, `${task.templateId}: expected full table score`);
}
