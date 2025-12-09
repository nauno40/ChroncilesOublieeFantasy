import { useState, useMemo } from 'react';

export function useSearch<T>(
    items: T[],
    searchFn: (item: T, term: string) => boolean,
    initialTerm: string = ''
) {
    const [searchTerm, setSearchTerm] = useState(initialTerm);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item => searchFn(item, searchTerm));
    }, [items, searchTerm, searchFn]);

    return {
        searchTerm,
        setSearchTerm,
        filteredItems
    };
}
