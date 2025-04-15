var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class ProhibitedKeywords {
    static getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(this.DB_PATH);
            const data = yield response.json();
            return data.keywords;
        });
    }
    static add(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const keywords = yield this.getAll();
            if (!keywords.includes(keyword)) {
                const updatedData = {
                    keywords: [...keywords, keyword],
                    lastUpdated: new Date().toISOString(),
                };
                yield fetch('/api/prohibited-keywords', {
                    method: 'POST',
                    body: JSON.stringify(updatedData),
                });
            }
        });
    }
}
ProhibitedKeywords.DB_PATH = './data/prohibited-keywords.json';
