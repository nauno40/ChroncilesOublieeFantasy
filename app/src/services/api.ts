const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const TOKEN_KEY = 'co_auth_token';
const USER_KEY = 'co_auth_user';

// Build request headers, only attaching the Authorization header when a token is
// actually stored. Sending a stale/empty token to the public compendium routes
// makes the JWT authenticator reject the request with 401 (see handleUnauthorized).
const buildHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
        'Accept': 'application/ld+json',
        ...extra,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
};

// A 401 means the stored JWT is missing/expired/invalid (e.g. the backend JWT
// keypair was regenerated). Because ApiService attaches the token to every
// request — including the otherwise-public compendium endpoints — a stale token
// would silently break the whole app. So we purge it and bounce to /login, which
// lets a stale token self-heal. We touch localStorage directly rather than
// importing AuthService to avoid a circular dependency.
const handleUnauthorized = () => {
    const hadToken = !!localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (hadToken && typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

const ensureOk = (response: Response) => {
    if (response.status === 401) {
        handleUnauthorized();
    }
    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }
};

export const ApiService = {
    async get<T>(resource: string): Promise<T> {
        let url = resource;
        // If resource is not a full URL, construct it using API_BASE_URL
        if (!resource.startsWith('http://') && !resource.startsWith('https://')) {
            // Clean up double slashes, but be careful with protocols
            const base = API_BASE_URL;
            // Remove trailing slash from base and leading slash from resource to avoid doubles, or let URL handle it
            // Simple string concatenation handling:
            const cleanBase = base.replace(/\/$/, '');
            const cleanResource = resource.startsWith('/') ? resource : `/${resource}`;
            // However, if resource is intentionally absolute path like /api/foo, and base is .../api, we might duplicate.
            // But usually resource passed to get() is 'foo', 'bar'.
            // If we blindly join, we get .../api/foo.
            // If resource is /api/foo, we get .../api/api/foo.
            // To be safe, we rely on the caller to handle paths, OR we use the URL class.

            // Existing logic fallback with improvement:
            url = `${cleanBase}${cleanResource}`.replace(/([^:]\/)\/+/g, "$1");
        }

        const response = await fetch(url, {
            headers: buildHeaders()
        });
        ensureOk(response);
        return response.json();
    },

    async getAll<T>(resource: string): Promise<T[]> {
        let allItems: T[] = [];
        // Determine initial URL
        let nextUrl = resource;

        while (true) {
            const data = await this.get<any>(nextUrl);

            let items: T[] = [];
            if (data && Array.isArray(data.member)) {
                items = data.member;
            } else if (data && Array.isArray(data['hydra:member'])) {
                items = data['hydra:member'];
            } else if (Array.isArray(data)) {
                items = data;
            }

            allItems = [...allItems, ...items];

            const view = data['hydra:view'] || data['view'];
            if (view && (view['hydra:next'] || view['next'])) {
                const nextPath = view['hydra:next'] || view['next'];
                // Resolve nextPath to absolute URL to avoid prefix issues
                // If nextPath is absolute, usage is clear.
                // If relative (e.g. /api/voies...), resolve against API_BASE_URL origin?
                // API_BASE_URL includes path.

                try {
                    if (nextPath.startsWith('http')) {
                        nextUrl = nextPath;
                    } else {
                        // Assemble absolute URL based on API_BASE_URL
                        // We need the origin of API_BASE_URL.
                        const baseUrlObj = new URL(API_BASE_URL);
                        // If nextPath starts with /, it is relative to origin.
                        // e.g. /api/voies... -> http://localhost:8000/api/voies...
                        // This effectively ignores the path part of API_BASE_URL, which is correct for root-relative paths.
                        nextUrl = new URL(nextPath, baseUrlObj.origin).href;
                    }
                } catch (e) {
                    console.error("Error resolving next url", e);
                    break;
                }
            } else {
                break;
            }
        }

        return allItems;
    },

    async getOne<T>(resource: string, id: string | number): Promise<T> {
        return this.get<T>(`${resource}/${id}`);
    },

    async post<T>(resource: string, data: any): Promise<T> {
        const url = `${API_BASE_URL}/${resource}`.replace(/([^:]\/)\/+/g, "$1");
        const response = await fetch(url, {
            method: 'POST',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        ensureOk(response);
        return response.json();
    },

    async put<T>(resource: string, id: string | number, data: any): Promise<T> {
        const url = `${API_BASE_URL}/${resource}/${id}`.replace(/([^:]\/)\/+/g, "$1");
        const response = await fetch(url, {
            method: 'PUT',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(data)
        });
        ensureOk(response);
        return response.json();
    },

    async delete(resource: string, id: string | number): Promise<void> {
        const url = `${API_BASE_URL}/${resource}/${id}`.replace(/([^:]\/)\/+/g, "$1");
        const response = await fetch(url, {
            method: 'DELETE',
            headers: buildHeaders()
        });
        ensureOk(response);
    }
};
