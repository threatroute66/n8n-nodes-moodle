import {
    IExecuteFunctions,
    IHookFunctions,
    ILoadOptionsFunctions,
    IWebhookFunctions,
} from 'n8n-workflow';

import {
    IDataObject,
    IHttpRequestOptions,
    IHttpRequestMethods,
    NodeApiError,
} from 'n8n-workflow';

const DEFAULT_TIMEOUT = 30000;
const MIN_TIMEOUT = 1000;
const MAX_TIMEOUT = 300000;

/**
 * Coerce a timeout to a sane number of milliseconds, or undefined when it is
 * not usable. The node parameter's `minValue`/`maxValue` are UI-only hints and
 * are bypassed by expressions, so the bounds have to be enforced here too.
 */
function clampTimeout(value: unknown): number | undefined {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return undefined;
    }
    return Math.min(Math.max(parsed, MIN_TIMEOUT), MAX_TIMEOUT);
}

export async function moodleApiRequest(
    this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
    method: IHttpRequestMethods,
    body: IDataObject = {},
    qs: IDataObject = {},
    customTimeout?: number,
    itemIndex = 0,
): Promise<any> {
    const credentials = await this.getCredentials('moodleApi');
    const url = credentials.url as string;
    const token = credentials.token as string;

    // Clean up URL - remove trailing slash if present
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const fullUrl = `${cleanUrl}/webservice/rest/server.php`;

    // Combine all parameters
    const allParams: IDataObject = {
        wstoken: token,
        moodlewsrestformat: 'json',
        ...qs,
        ...body,
    };

    // Build form data
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(allParams)) {
        formData.append(key, String(value));
    }
    
    const bodyString = formData.toString();

    // The caller's hint is the baseline; the node parameter overrides it when set.
    // Read it for the item being processed - not item 0 - so a per-item
    // expression on the timeout field resolves against the right item.
    let timeout = clampTimeout(customTimeout) ?? DEFAULT_TIMEOUT;
    try {
        const nodeTimeout = clampTimeout(this.getNodeParameter?.('timeout', itemIndex));
        if (nodeTimeout !== undefined) {
            timeout = nodeTimeout;
        }
    } catch {}

    const options: IHttpRequestOptions = {
        method,
        url: fullUrl,
        body: bodyString,
        timeout,
        headers: {
            'User-Agent': 'n8n-moodle-node/1.0.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': bodyString.length.toString(),
        },
        json: false, // Important: don't let n8n parse as JSON
    };

    try {
        const response = await this.helpers.httpRequest(options);
        
        // Parse JSON response manually
        let parsedResponse;
        try {
            parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
        } catch (parseError) {
            // Check if the response is an error message string
            if (typeof response === 'string' && response.includes('is already used for another')) {
                throw new NodeApiError(this.getNode(), {
                    message: 'Moodle API Error',
                    description: response,
                });
            }
            
            throw new NodeApiError(this.getNode(), {
                message: 'Failed to parse Moodle API response',
                description: `Response was not valid JSON: ${response}`,
            });
        }
        
        // Check for null response (common for successful delete operations)
        if (parsedResponse === null || parsedResponse === undefined) {
            return parsedResponse;
        }
        
        // Check for Moodle API errors only if response is not null
        if (parsedResponse && typeof parsedResponse === 'object' && parsedResponse.exception) {
            throw new NodeApiError(this.getNode(), {
                message: parsedResponse.message || 'Moodle API Error',
                description: `${parsedResponse.debuginfo || ''}\nErrorcode: ${parsedResponse.errorcode || 'Unknown'}`,
                httpCode: parsedResponse.httpCode,
            });
        }
        
        return parsedResponse;
    } catch (error: any) {
        // If it's already a NodeApiError, just re-throw it
        if (error instanceof NodeApiError) {
            throw error;
        }
        
        // Enhanced error handling
        let errorMessage = 'Unknown error occurred';
        let errorDescription = '';

        if (error.code) {
            switch (error.code) {
                case 'ECONNREFUSED':
                    errorMessage = 'Connection refused - Moodle server may be offline or unreachable';
                    errorDescription = `Unable to connect to ${fullUrl}`;
                    break;
                case 'ENOTFOUND':
                    errorMessage = 'Host not found - Invalid URL or DNS issue';
                    errorDescription = `Cannot resolve hostname: ${fullUrl}`;
                    break;
                case 'ETIMEDOUT':
                    errorMessage = 'Connection timeout - Server is not responding';
                    errorDescription = `Request timed out after ${timeout}ms`;
                    break;
                default:
                    errorMessage = error.message || errorMessage;
                    errorDescription = `Error code: ${error.code}`;
            }
        } else if (error.response) {
            errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
            errorDescription = `Response: ${JSON.stringify(error.response.data, null, 2)}`;
        } else {
            errorMessage = error.message || errorMessage;
        }

        throw new NodeApiError(this.getNode(), {
            message: errorMessage,
            description: errorDescription,
            httpCode: error.response?.status,
        });
    }
}

export async function moodleApiRequestAllItems(
    this: IExecuteFunctions | ILoadOptionsFunctions,
    method: IHttpRequestMethods,
    body: IDataObject = {},
    qs: IDataObject = {},
    customTimeout?: number,
    itemIndex = 0,
): Promise<any> {
    return moodleApiRequest.call(this, method, body, qs, customTimeout, itemIndex);
}
