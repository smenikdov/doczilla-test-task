import { MAX_FILE_SIZE } from '../constants/index.js';

export function parseMultipartFormData(req) {
    return new Promise((resolve, reject) => {
        const result = { fields: {}, files: [] };
        let totalSize = 0;
        let body = [];

        // Extract boundary from content-type header
        const contentType = req.headers['content-type'];
        const boundaryMatch = contentType && contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
            return reject(new Error('Invalid multipart/form-data: missing boundary'));
        }
        const boundary = '--' + boundaryMatch[1];
        const boundaryBuffer = Buffer.from(`\r\n${boundary}`);

        // Collect request body with size limit
        req.on('data', chunk => {
            totalSize += chunk.length;
            if (totalSize > MAX_FILE_SIZE) {
                req.destroy(); // Terminate the request
                return reject(new Error(`Data exceeds maximum size of ${MAX_FILE_SIZE} bytes`));
            }
            body.push(chunk);
        });

        req.on('end', () => {
            try {
                const buffer = Buffer.concat(body);

                // Split buffer into parts based on boundary
                const parts = [];
                let start = 0;
                let end = buffer.indexOf(boundaryBuffer, start);

                while (end !== -1) {
                    if (start < end) {
                        parts.push(buffer.slice(start, end));
                    }
                    start = end + boundaryBuffer.length;
                    end = buffer.indexOf(boundaryBuffer, start);
                }
                // Add last part if exists
                if (start < buffer.length && !buffer.slice(start).equals(Buffer.from(boundary + '--'))) {
                    parts.push(buffer.slice(start));
                }

                for (let part of parts) {
                    // Extract headers and content
                    const headerEnd = part.indexOf('\r\n\r\n');
                    if (headerEnd === -1) continue;

                    const headersRaw = part.slice(0, headerEnd).toString().trim();
                    const content = part.slice(headerEnd + 4);

                    // Parse headers
                    const headers = {};
                    headersRaw.split('\r\n').forEach(header => {
                        const [key, value] = header.split(': ').map(str => str.trim());
                        headers[key.toLowerCase()] = value;
                    });

                    // Extract content-disposition details
                    const disposition = headers['content-disposition'];
                    if (!disposition) continue;

                    const dispositionParams = {};
                    disposition.split(';').forEach(param => {
                        const [key, value] = param.split('=').map(str => str.trim().replace(/^"|"$/g, ''));
                        if (key) dispositionParams[key] = value;
                    });

                    const name = dispositionParams.name;
                    if (!name) continue;

                    if (dispositionParams.filename) {
                        // Handle file
                        result.files.push({
                            name: name,
                            filename: dispositionParams.filename,
                            contentType: headers['content-type'] || 'application/octet-stream',
                            data: content
                        });
                    } else {
                        // Handle field
                        result.fields[name] = content.toString();
                    }
                }

                resolve(result);
            } catch (error) {
                reject(error);
            }
        });

        req.on('error', error => {
            reject(error);
        });
    });
}
