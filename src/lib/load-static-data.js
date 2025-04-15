var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function loadStaticData(file) {
    return __awaiter(this, void 0, void 0, function* () {
        if (file === 'projects') {
            return (yield import('../data/portfolio-data/projects.json'))
                .default;
        }
        if (file === 'blog') {
            return (yield import('../data/portfolio-data/blog.json'))
                .default;
        }
        if (file === 'case-studies') {
            return (yield import('../data/portfolio-data/case-studies.json'))
                .default;
        }
        if (file === 'changelog') {
            return (yield import('../data/portfolio-data/changelog.json'))
                .default;
        }
        if (file === 'experience') {
            return (yield import('../data/portfolio-data/experience.json'))
                .default;
        }
        if (file === 'tools') {
            return (yield import('../data/portfolio-data/tools.json'))
                .default;
        }
        throw new Error(`Invalid file type: ${file}`);
    });
}
// Example usage:
// const projectsData = await loadStaticData('projects');
