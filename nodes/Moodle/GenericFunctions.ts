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

export async function moodleApiRequest(
    this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions | IWebhookFunctions,
    method: IHttpRequestMethods,
    body: IDataObject = {},
    qs: IDataObject = {},
    customTimeout: number = 30000,
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

    // Allow override via node parameter when available
    let timeout = customTimeout;
    try {
        const nodeTimeout = this.getNodeParameter?.('timeout', 0) as number;
        if (nodeTimeout && Number.isFinite(nodeTimeout) && nodeTimeout > 0) {
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
                    errorDescription = 'Request timed out after 30 seconds';
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
): Promise<any> {
    return moodleApiRequest.call(this, method, body, qs);
}
