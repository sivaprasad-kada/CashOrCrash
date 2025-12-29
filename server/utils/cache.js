const cache = new Map();

export const getCache = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
        cache.delete(key);
        return null;
    }
    return item.value;
};

export const setCache = (key, value, durationSeconds = 5) => {
    cache.set(key, {
        value,
        expiry: Date.now() + (durationSeconds * 1000)
    });

    // Cleanup old keys periodically if map grows too large (Safety)
    if (cache.size > 1000) {
        for (const [k, v] of cache) {
            if (Date.now() > v.expiry) cache.delete(k);
        }
    }
};

export const clearCache = (keyPattern) => {
    for (const key of cache.keys()) {
        if (key.includes(keyPattern)) cache.delete(key);
    }
};
