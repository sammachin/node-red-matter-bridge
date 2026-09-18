const { Environment, StorageService, MemoryStorageDriver, Filesystem, ServerNode, Endpoint, Logger } = require('@matter/main');
const { AggregatorEndpoint } = require('@matter/main/endpoints');

async function createMatterBridge(t) {
    Logger.defaultLogLevel = 4;
    const environment = new Environment('bridge-regression-test', Environment.default);
    const storage = new StorageService(environment);
    storage.registerDriver(MemoryStorageDriver);
    storage.defaultDriver = 'memory';
    environment.delete(Filesystem);
    const server = await ServerNode.create({
        id: 'bridge-regression-test',
        environment,
        network: { port: 0 },
        basicInformation: {
            vendorId: 0xfff1, productId: 0x8000,
            nodeLabel: 'Local test', productName: 'Test', vendorName: 'Test'
        }
    });
    t.after(() => server.close());
    // Never start the server: no commissioning or network advertising.
    const aggregator = new Endpoint(AggregatorEndpoint, { id: 'aggregator' });
    await server.add(aggregator);
    return aggregator;
}

module.exports = { createMatterBridge };
