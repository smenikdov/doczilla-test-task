import net from 'net';

class RedisService {
    constructor({ host = 'localhost', port = 6379 } = {}) {
        this.host = host;
        this.port = port;
        this.client = null;
        this.connected = false;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.client = net.createConnection({ host: this.host, port: this.port });
            
            this.client.on('connect', () => {
                this.connected = true;
                resolve();
            });

            this.client.on('error', (err) => {
                this.connected = false;
                reject(err);
            });

            this.client.on('end', () => {
                this.connected = false;
            });
        });
    }

    #formatCommand(...args) {
        let command = `*${args.length}\r\n`;
        for (const arg of args) {
            command += `$${arg.length}\r\n${arg}\r\n`;
        }
        return command;
    }

    async #sendCommand(...args) {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }

        return new Promise((resolve, reject) => {
            const command = this.#formatCommand(...args);
            let response = '';

            const onData = (data) => {
                response += data.toString();
                try {
                    const parsed = this.#parseResponse(response);
                    this.client.removeListener('data', onData);
                    resolve(parsed);
                } catch (err) {
                    console.error(err);
                }
            };

            this.client.on('data', onData);
            this.client.on('error', reject);
            this.client.write(command);
        });
    }

    #parseResponse(response) {
        if (!response) {
            throw new Error('Empty response');
        }

        const type = response[0];
        const lines = response.split('\r\n');

        switch (type) {
            case '+':
                return lines[0].slice(1);
            case '-':
                throw new Error(lines[0].slice(1));
            case '$':
                const length = parseInt(lines[0].slice(1));
                if (length === -1) return null;
                return lines[1];
            default:
                throw new Error('Invalid response format');
        }
    }

    async set(key, value, expirySeconds = null) {
        const args = expirySeconds 
            ? ['SET', key, value, 'EX', expirySeconds.toString()]
            : ['SET', key, value];
        return await this.#sendCommand(...args);
    }

    async get(key) {
        return await this.#sendCommand('GET', key);
    }

    async disconnect() {
        if (this.client) {
            this.client.end();
            this.connected = false;
        }
    }
}

export default RedisService;
