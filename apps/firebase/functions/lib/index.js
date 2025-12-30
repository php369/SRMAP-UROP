"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.securePing = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.securePing = (0, https_1.onCall)((request) => {
    const auth = request.auth;
    if (!auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in");
    }
    const email = auth.token.email;
    if (!email || !email.endsWith("@srmap.edu.in")) {
        throw new https_1.HttpsError("permission-denied", "Only SRMAP accounts allowed");
    }
    return {
        message: "Secure Firebase Function is working!",
        email,
    };
});
//# sourceMappingURL=index.js.map