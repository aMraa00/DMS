export function notFound(req, res) {
    res.status(404).json({ error: 'Not Found', path: req.path });
}
export function errorHandler(err, _req, res, _next) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const status = res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;
    res.status(status).json({ error: message });
}
//# sourceMappingURL=error.middleware.js.map