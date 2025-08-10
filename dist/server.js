"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUsers = void 0;
const colors_1 = __importDefault(require("colors"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./shared/logger");
const socketHelper_1 = require("./helpers/socketHelper");
const user_service_1 = require("./app/modules/user/user.service");
const redis_client_1 = require("./helpers/redis.client");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const bull_mq_worker_1 = require("./helpers/bull-mq-worker");
//uncaught exception
process.on('uncaughtException', error => {
    logger_1.errorLogger.error('UnhandledException Detected', error);
    process.exit(1);
});
exports.onlineUsers = new Map();
let server;
async function main() {
    try {
        mongoose_1.default.connect(config_1.default.database_url);
        logger_1.logger.info(colors_1.default.green('🚀 Database connected successfully'));
        const port = Number(config_1.default.port);
        server = app_1.default.listen(port, config_1.default.ip_address, () => {
            logger_1.logger.info(colors_1.default.yellow(`♻️  Application listening on port:${config_1.default.port}`));
        });
        //create admin user
        await user_service_1.UserServices.createAdmin();
        //bull mq notification worker!!!!!
        bull_mq_worker_1.notificationWorker;
        bull_mq_worker_1.emailWorker;
        const pubClient = redis_client_1.redisClient;
        const subClient = pubClient.duplicate();
        logger_1.logger.info(colors_1.default.green('🎃 Redis connected successfully'));
        //socket
        const io = new socket_io_1.Server(server, {
            pingTimeout: 60000,
            cors: {
                origin: '*',
            },
        });
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        socketHelper_1.socketHelper.socket(io);
        //@ts-ignore
        global.io = io;
    }
    catch (error) {
        logger_1.errorLogger.error(colors_1.default.red('🤢 Failed to connect Database'));
    }
    //handle unhandleRejection
    process.on('unhandledRejection', error => {
        if (server) {
            server.close(() => {
                logger_1.errorLogger.error('UnhandledRejection Detected', error);
                process.exit(1);
            });
        }
        else {
            process.exit(1);
        }
    });
}
main();
//SIGTERM
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM IS RECEIVE');
    if (server) {
        server.close();
    }
});
