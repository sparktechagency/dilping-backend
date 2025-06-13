"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customer_route_1 = require("../app/modules/customer/customer.route");
const user_route_1 = require("../app/modules/user/user.route");
const auth_route_1 = require("../app/modules/auth/auth.route");
const express_1 = __importDefault(require("express"));
const notifications_route_1 = require("../app/modules/notifications/notifications.route");
const public_route_1 = require("../app/modules/public/public.route");
const subcategory_route_1 = require("../app/modules/subcategory/subcategory.route");
const category_route_1 = require("../app/modules/category/category.route");
const offer_route_1 = require("../app/modules/offer/offer.route");
const request_route_1 = require("../app/modules/request/request.route");
const message_route_1 = require("../app/modules/message/message.route");
const chat_route_1 = require("../app/modules/chat/chat.route");
const router = express_1.default.Router();
const apiRoutes = [
    { path: '/user', route: user_route_1.UserRoutes },
    { path: '/auth', route: auth_route_1.AuthRoutes },
    { path: '/customer', route: customer_route_1.CustomerRoutes },
    { path: '/notifications', route: notifications_route_1.NotificationRoutes },
    { path: '/public', route: public_route_1.PublicRoutes },
    { path: '/subcategory', route: subcategory_route_1.SubcategoryRoutes },
    { path: '/category', route: category_route_1.CategoryRoutes },
    { path: '/offer', route: offer_route_1.OfferRoutes },
    { path: '/request', route: request_route_1.RequestRoutes },
    { path: '/message', route: message_route_1.MessageRoutes },
    { path: '/chat', route: chat_route_1.ChatRoutes },
];
apiRoutes.forEach(route => {
    router.use(route.path, route.route);
});
exports.default = router;
