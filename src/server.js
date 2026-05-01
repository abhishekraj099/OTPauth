const config = require('./config');
const app = require('./app');
const { initFirebase } = require('./database/firestore');
const logger = require('./utils/logger');

const startServer = async () => {
	try {
		await initFirebase();

		const server = app.listen(config.port, () => {
			logger.info(`Server running in ${config.env} mode on port ${config.port}`);
			logger.info(`Health:  http://localhost:${config.port}/health`);
			logger.info(`Swagger: http://localhost:${config.port}/api-docs`);
		});

		const shutdown = (signal) => {
			logger.info(`${signal} received. Shutting down gracefully...`);
			server.close(() => { logger.info('Server closed'); process.exit(0); });
			setTimeout(() => process.exit(1), 10000);
		};

		process.on('SIGTERM', () => shutdown('SIGTERM'));
		process.on('SIGINT', () => shutdown('SIGINT'));
		process.on('unhandledRejection', (err) => { logger.error('Unhandled Rejection:', err); shutdown('unhandledRejection'); });
	} catch (err) {
		logger.error('Startup failed:', err.message || err);
		process.exit(1);
	}
};

startServer();
