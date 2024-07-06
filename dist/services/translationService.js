"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = void 0;
const google_translate_api_1 = require("@vitalets/google-translate-api");
const translateText = (text, targetLanguage) => __awaiter(void 0, void 0, void 0, function* () {
    const { text: translatedText } = yield (0, google_translate_api_1.translate)(text, { to: targetLanguage });
    return translatedText;
});
exports.translateText = translateText;
