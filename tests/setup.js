// jsdom has no matchMedia; the apps read it at setup for the compact / touch layouts
if (!window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
    })
}
