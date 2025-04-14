# TODO ISSUES List - Project Improvements and Fixes

This list tracks tasks based on the analysis of `run_tasks.log` (Timestamp: 2025-04-14T10:31:21.228Z) and subsequent build logs (e.g., `npm run build` output). Tasks are prioritized based on severity, starting with build-blocking issues or critical warnings.

## Command Used

`.\run_tasks.bat`, `npm run build`

## 🚨 Critical Build Failures & Core Issues

-   [ ] **Fix `cn` Utility Function Import Path Warning:**
    -   **Issue:** While the previous fatal `TypeError: (0 , o.cn) is not a function` seems resolved (build completes), numerous warnings (`Attempted import error: 'cn' is not exported from '@/lib/styling-utils'`) appear during `npm run build`. This indicates `src/components/ui/chart.tsx` is importing `cn` from the incorrect path (`@/lib/styling-utils`).
    -   **Progress:**
        -   ✅ `cn` utility function (using `clsx` and `tailwind-merge`) added to `src/lib/core-utils.ts`.
        -   ✅ Imports standardized to use `@/lib/core-utils` in 15+ previously known affected UI components.
        -   ✅ Path alias configuration (`@/`) in `tsconfig.json` verified.
        -   ✅ Build now completes successfully, avoiding the previous fatal runtime error.
    -   **Impact:** Although not breaking the build currently, incorrect imports can lead to unexpected styling issues or breakages if `styling-utils` changes. It pollutes the build log with warnings.
    -   **Action:** **Correct the import path for `cn` within `src/components/ui/chart.tsx` from `'@/lib/styling-utils'` to `'@/lib/core-utils'`. Verify that `npm run build` completes successfully *without these warnings*.**
-   [ ] **Resolve Module Not Found Errors (TS2307):**
    -   `@/app/components/ui/theme-provider` in `src/components/ui/client-providers.tsx` (Hint: Check if path should be `@/components/ui/...`)
    -   `./sidebar-nav` in `src/components/ui/dashboard-sidebar.tsx`
    -   `@/app/components/ui/dropdown-menu`, `@/app/components/ui/input`, `@/app/components/ui/table` in `src/components/ui/data-table.tsx` and `src/lib/amazon-tools/acos/components/acos-table.tsx` (Hint: Check if path should be `@/components/ui/...`)
    -   `./algorithms` and `./errors` in `src/lib/amazon-tools/types.ts`
    -   `@/data/sample-data.json` in `src/lib/hooks/use-amazon-data.ts`
    -   **Action:** Verify file paths, exports, and `tsconfig.json` path aliases. Ensure all necessary files exist and are correctly referenced. Correct paths like `@/app/components/ui/...` to `@/components/ui/...` if needed.

## 🔥 High Priority Type Errors (Likely Functionality Impact)

-   [ ] **Fix Component Prop Type Mismatches (TS2322, TS2339):**
    -   **Inputs/Progress:** Many components pass incorrect props (`value`, `name`, `type`, `placeholder`, `onChange` type) to standard HTML elements (`input`, `progress`) or custom components (`NumberInput`). Affected files:
        -   `about-section.tsx` (`progress`)
        -   `acos-calculator.tsx` (`input`)
        -   `competitor-analyzer.tsx` (`input`)
        -   `description-editor.tsx` (`input`, `progress`)
        -   `fba-calculator.tsx` (`input`, `progress`)
        -   `keyword-analyzer.tsx` (`input`)
        -   `keyword-deduplicator.tsx` (`progress`)
        -   `listing-quality-checker.tsx` (`input`, `progress`)
        -   `ppc-campaign-auditor.tsx` (`progress`)
        -   `profit-margin-calculator.tsx` (`input`, `progress`)
        -   `sales-estimator.tsx` (`input`, `progress`)
        -   `contact-section.tsx` (`input`)
        -   `ui/input.tsx` (`type`)
        -   `ui/NumberInput.tsx` (`type`)
        -   `ui/progress.tsx` (`value`, `max`)
        -   `lib/amazon-tools/keyword-analyzer/components/keyword-table.tsx` (`placeholder`)
        -   `lib/amazon-tools/ppc-analyzer/components/ppc-table.tsx` (`placeholder`)
    -   **Links:** `mdx-components.tsx` passes `href: string | undefined` to a component expecting `Url` (TS2322).
    -   **Custom Components:**
        -   `keyword-trend-analyzer.tsx`: `onUpload` prop missing on `UploaderProps` (TS2322).
        -   `profit-margin-calculator.tsx`: `toolName` prop missing on `SampleCsvButtonProps` (TS2322).
    -   **Action:** Review the props being passed to these components and ensure they match the expected types defined by React, HTML, or the custom component's interface. Use correct event types (`ChangeEvent` vs `FormEvent`) and access event values correctly (e.g., `e.target.value`).
-   [ ] **Address Missing Properties/Methods on Types (TS2339):**
    -   `InventoryData` missing `salesLast30Days`, `leadTime` (`api/amazon/inventory/route.ts`).
    -   `AmazonAlgorithms` missing `calculateInventoryRecommendation` (`api/amazon/inventory/route.ts`).
    -   `EventTarget` missing `value`, `valueAsNumber` in various components (use `(e.target as HTMLInputElement).value`).
    -   `KeywordData` missing `keywords` (`keyword-deduplicator.tsx`).
    -   `ProductData` missing numerous properties (`conversionRate`, `sessions`, `reviewRating`, etc.) in `profit-margin-calculator.tsx`.
    -   `Column<TData, unknown>` missing `setIsVisible` (Did you mean `getIsVisible`?) in `data-table.tsx`, `acos-table.tsx`, `keyword-table.tsx`, `ppc-table.tsx` (TS2551).
    -   Link objects missing `id` in `header.tsx`.
    -   **Action:** Update type definitions (`InventoryData`, `AmazonAlgorithms`, `KeywordData`, `ProductData`, etc.) or fix the code accessing incorrect properties. Use type assertions or correct methods (e.g., `getIsVisible`).
-   [ ] **Fix Type Mismatches and Constraint Errors (TS2322, TS2345, TS2344, TS2554):**
    -   `api/amazon/pricing/route.ts`: Incorrect number of arguments passed (TS2554).
    -   `api/search/route.ts`: Types `BlogPost[]` and `{ name: string; description: string; }[]` do not satisfy `keyof StaticDataTypes` constraint (TS2344).
    -   `acos-calculator.tsx`: `number | undefined` not assignable to `number` (TS2345).
    -   `competitor-analyzer.tsx`: `FormEvent` not assignable to `ChangeEvent` (TS2345); `string` not assignable to `MetricType` (TS2345, TS2322).
    -   `keyword-deduplicator.tsx`: `{...}` not assignable to `KeywordData[]` due to `cleanedKeywords: unknown[]` vs `string[]` (TS2322).
    -   `listing-quality-checker.tsx`: Callback parameter type mismatch (`unknown` vs `CSVRow`) (TS2345).
    -   `profit-margin-calculator.tsx`: Function type not assignable to `ReactNode` (TS2322).
    -   **Action:** Correct function arguments, ensure types satisfy constraints, handle potential `undefined` values, fix event handler types, ensure data structures match their type definitions.
-   [ ] **Resolve Missing Names/Types (TS2304):**
    -   `getChartColor` in `competitor-analyzer.tsx`.
    -   `FBAData` in `fba-calculator.tsx`.
    -   `AmazonAlgorithms`, `ProductCategory` in `profit-margin-calculator.tsx`.
    -   **Action:** Define or import these missing types/functions.
-   [ ] **Fix Missing Exports / Import Suggestions (TS2614, TS2305, TS2724):**
    -   `CampaignData` from `./ppc-campaign-auditor` (Did you mean default import?) in `CampaignCard.tsx` (TS2614).
    -   `AmazonProduct`, `KeywordData` from `../amazon-tools/types` in `use-amazon-data.ts` (TS2305).
    -   `CompetitorData` from `../amazon-tools/types` (Did you mean `CompetitorDataRow`?) in `use-amazon-data.ts` (TS2724).
    -   **Action:** Correct the imports/exports as suggested or define the missing exports.
-   [ ] **Add Explicit Types for `unknown` and Implicit `any` (TS18046, TS7006):**
    -   `tools` (`unknown`), `tool` (`any`) in `api/search/route.ts`.
    -   `error` (`unknown`) in `competitor-analyzer.tsx`, `description-editor.tsx`, `listing-quality-checker.tsx`.
    -   `err` (`unknown`) in `profit-margin-calculator.tsx`.
    -   `width`, `height` (`any`) in `profit-margin-calculator.tsx`.
    -   `event`, `value` (`any`) in `data-table.tsx`, `acos-table.tsx`.
    -   `k` (`any`) in `keyword-deduplicator.tsx`.
    -   `tag` (`any`) in `lib/mdx.ts`.
    -   **Action:** Provide explicit types for these variables and parameters instead of relying on `unknown` or implicit `any`.
-   [ ] **Handle Possibly Undefined Objects (TS2532, TS18048):**
    -   `keyword-analyzer.tsx(103,23)`: Object possibly undefined before access.
    -   `listing-quality-checker.tsx(84,25)`: `results.meta.fields` possibly undefined.
    -   `profit-margin-calculator.tsx(76,23)`: `result.meta.fields` possibly undefined.
    -   **Action:** Add null/undefined checks (e.g., `?.` optional chaining, `if` checks) before accessing properties.
-   [ ] **Fix Missing Required Properties (TS2741):**
    -   `productName` missing in objects in `lib/generate-sample-csv.ts`.
    -   **Action:** Ensure the objects being created include all required properties as defined by the `SampleData` type.

## 🟠 Medium Priority Code Quality & Refactoring

-   [ ] **Investigate and Fix MDX Type Errors (TS2339 on `never`):**
    -   **Issue:** Multiple errors in `src/lib/mdx.ts` indicate properties (`id`, `title`, `description`, `date`, `image`, `tags`, `readingTime`, `author`, `content`) are being accessed on a value typed as `never`.
    -   **Action:** Review the MDX content processing logic (`getAllPosts`, `getPostBySlug`, etc.) and associated type definitions. Ensure frontmatter and content are correctly parsed and typed.
-   [ ] **Resolve Duplicate Function Implementations (TS2393):**
    -   **Issue:** Duplicate function implementations found in `src/lib/keyword-intelligence.ts`.
    -   **Action:** Consolidate the duplicate functions into a single implementation.
-   [ ] **Fix Import Declaration Conflict (TS2440):**
    -   **Issue:** `calculateMetrics` import conflicts with a local declaration in `src/components/amazon-seller-tools/acos-calculator.tsx`.
    -   **Action:** Rename the imported function using `as` or rename the local declaration.
-   [ ] **Correct Static Data Loading Types (TS2322):**
    -   **Issue:** Data loaded in `src/lib/load-static-data.ts` for `projects`, `posts`, `studies`, `changes`, `experience` does not match the expected structure of `StaticDataTypes[T]`.
    -   **Action:** Update the JSON data structures or the `StaticDataTypes` definition to ensure they align.

## 🟡 Lower Priority & Best Practices

-   [ ] **Update Next.js Metadata Viewport Configuration:**
    -   **Issue:** Build warnings indicate `viewport` is configured in metadata exports (`/_not-found`, `/`, `/blog`).
    -   **Action:** Move viewport configuration from `metadata` export to a separate `generateViewport` export as recommended by Next.js docs.

## ✅ Post-Fix Tasks

-   [ ] **Run All Checks:** Execute `.\\run_tasks.bat` again (`npm run format`, `npm run lint`, `npm run typecheck`, `npm run build`) and ensure all tasks pass without errors or warnings.
-   [ ] **Thorough Testing:** Manually test all affected components and pages to ensure functionality remains intact and issues are resolved.
-   [ ] **Documentation:** Update any relevant documentation regarding the changes made, type definitions, or component usage.
