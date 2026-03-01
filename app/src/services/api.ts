const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

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
            headers: {
                'Accept': 'application/ld+json',
                'Authorization': localStorage.getItem('co_auth_token') ? `Bearer ${localStorage.getItem('co_auth_token')}` : ''
            }
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
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
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/ld+json',
                'Authorization': localStorage.getItem('co_auth_token') ? `Bearer ${localStorage.getItem('co_auth_token')}` : ''
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async put<T>(resource: string, id: string | number, data: any): Promise<T> {
        const url = `${API_BASE_URL}/${resource}/${id}`.replace(/([^:]\/)\/+/g, "$1");
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/ld+json',
                'Authorization': localStorage.getItem('co_auth_token') ? `Bearer ${localStorage.getItem('co_auth_token')}` : ''
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        return response.json();
    },

    async delete(resource: string, id: string | number): Promise<void> {
        const url = `${API_BASE_URL}/${resource}/${id}`.replace(/([^:]\/)\/+/g, "$1");
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/ld+json',
                'Authorization': localStorage.getItem('co_auth_token') ? `Bearer ${localStorage.getItem('co_auth_token')}` : ''
            }
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
    }
};
