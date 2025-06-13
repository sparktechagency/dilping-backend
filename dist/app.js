"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const routes_1 = __importDefault(require("./routes"));
const morgan_1 = require("./shared/morgan");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const globalErrorHandler_1 = __importDefault(require("./app/middleware/globalErrorHandler"));
const passport_1 = __importDefault(require("./app/modules/auth/passport.auth/config/passport"));
const app = (0, express_1.default)();
//morgan
app.use(morgan_1.Morgan.successHandler);
app.use(morgan_1.Morgan.errorHandler);
//body parser
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
//file retrieve
app.use(express_1.default.static('uploads'));
//router
app.use('/api/v1', routes_1.default);
//live response
app.get('/', (req, res) => {
    res.send('<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey, How can I assist you today!</h1>');
});
//global error handle
app.use(globalErrorHandler_1.default);
//handle not found route;
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Not found',
        errorMessages: [
            {
                path: req.originalUrl,
                message: "API DOESN'T EXIST",
            },
        ],
    });
});
exports.default = app;
