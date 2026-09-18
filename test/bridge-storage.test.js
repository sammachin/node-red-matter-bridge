const assert = require('node:assert/strict');
const test = require('node:test');
const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const matter = require('@matter/main');

test('bridge reuses legacy file storage at its configured path', async t => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'matter-storage-test-'));
    const id = 'legacy-test-bridge';
    const directory = path.join(root, id);
    await fs.mkdir(directory);
    // Pre-0.17 stores have JSON values in flat files, without driver.json.
    await fs.writeFile(path.join(directory, 'migration.marker'), JSON.stringify('original-data'));
    const vars = matter.Environment.default.vars;
    const originalPath = vars.get('storage.path');
    const originalInterface = vars.get('mdns.networkInterface');
    let node;
    let creation;
    t.after(async () => {
        try {
            if (creation) await creation.catch(() => {});
            if (node) await new Promise(resolve => node.emit('close', false, resolve));
        } finally {
            vars.set('storage.path', originalPath);
            vars.set('mdns.networkInterface', originalInterface);
            await fs.rm(root, { recursive: true, force: true });
        }
    });

    const bridgePath = require.resolve('../bridge');
    const bridgeRequire = createRequire(bridgePath);
    const sandbox = {
        module: { exports: {} }, console, global: {}, process: { on() {} },
        require(name) {
            if (name !== '@matter/main') return bridgeRequire(name);
            return { ...matter, ServerNode: { create(options) {
                creation = matter.ServerNode.create(options);
                return creation;
            } } };
        }
    };
    vm.runInNewContext(await fs.readFile(bridgePath, 'utf8'), sandbox, { filename: bridgePath });
    let Constructor;
    const errors = [];
    const events = new EventEmitter();
    sandbox.module.exports({
        events,
        nodes: {
            registerType(type, constructor) { Constructor = constructor; },
            createNode(instance) {
                Object.setPrototypeOf(instance, EventEmitter.prototype);
                EventEmitter.call(instance);
                instance.id = id;
                instance.log = instance.status = () => {};
                instance.warn = instance.error = error => errors.push(error);
            }
        },
        httpAdmin: { get() {} },
        auth: { needsPermission() { return () => {}; } }
    });
    // An unregistered child keeps this test offline: never start or advertise.
    node = new Constructor({
        _users: ['offline-child'], name: 'Storage test', vendorId: 0xfff1,
        productId: 0x8000, networkInterface: 'lo', storageLocation: root, logLevel: 'ERROR'
    });
    await creation;
    await node.aggregator.construction;
    assert.equal(errors.length, 0);
    assert.equal(node.matterServer.lifecycle.isOnline, false);
    const storage = matter.Environment.default.get(matter.StorageService);
    assert.equal(storage.location, root);
    const manager = await storage.open(id);
    try {
        assert.equal(manager.driverId, 'file');
        const context = manager.createContext('migration');
        assert.equal(await context.get('marker'), 'original-data');
        await context.set('written', 'same-directory');
    } finally {
        await manager.close();
    }
    assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'migration.written'), 'utf8')), 'same-directory');
    assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'migration.marker'), 'utf8')), 'original-data');
});
