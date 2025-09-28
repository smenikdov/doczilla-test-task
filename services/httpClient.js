import http from 'http';

class HttpClient {
    constructor({ baseUrl = '' } = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    #request(method, endpoint, options = {}) {
        return new Promise((resolve, reject) => {
            const { headers = {}, data } = options;

            const url = `${this.baseUrl}${endpoint}`;

            const requestOptions = {
                method,
                headers: { ...this.defaultHeaders, ...headers },
            };

            const req = http.request(url, requestOptions, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    try {
                        if (res.headers['content-type']?.includes('application/json')) {
                            responseData = JSON.parse(responseData);
                        }
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: responseData,
                        });
                    }
                    catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            if (data) {
                const body = typeof data === 'string' ? data : JSON.stringify(data);
                req.write(body);
            }

            req.end();
        });
    }

    async get(endpoint, options = {}) {
        return this.#request('GET', endpoint, options);
    }

    async post(endpoint, options = {}) {
        return this.#request('POST', endpoint, options);
    }

    async put(endpoint, options = {}) {
        return this.#request('PUT', endpoint, options);
    }

    async delete(endpoint, options = {}) {
        return this.#request('DELETE', endpoint, options);
    }

    async patch(endpoint, options = {}) {
        return this.#request('PATCH', endpoint, options);
    }

    async head(endpoint, options = {}) {
        return this.#request('HEAD', endpoint, options);
    }

    async options(endpoint, options = {}) {
        return this.#request('OPTIONS', endpoint, options);
    }
}

export default HttpClient;
