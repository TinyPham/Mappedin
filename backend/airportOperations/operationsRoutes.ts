import type { Express } from 'express';
import { getAirportOperations, OperationsRequestError } from './operationsRepository';

export function registerAirportOperationsRoutes(app: Express) {
    app.get('/api/airport-operations', (req, res) => {
        try {
            res.json(getAirportOperations({ profile: req.query.profile, version: req.query.version }));
        } catch (error) {
            if (error instanceof OperationsRequestError) {
                res.status(error.status).json({ code: error.code, error: error.message });
                return;
            }
            console.error('Airport operations configuration unavailable:', error);
            res.status(503).json({ code: 'OPERATIONS_CONFIG_UNAVAILABLE', error: 'Airport operations configuration is currently unavailable' });
        }
    });
}
