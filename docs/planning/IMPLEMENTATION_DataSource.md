# Implementation Plan: Centralized Data Source & Processing API

**Version:** 1.1 (Updated 2024-07-26 - Reflects creation of base `headerMappings.ts`)

## 1. Goal

To create a robust and user-friendly system within the Next.js application that allows users to:
1.  Load primary data sources (like Amazon SQP, Business Reports, Ads Reports via CSV) into a central location.
2.  Have this data processed, cleaned, validated (using flexible header mapping), and potentially joined server-side for performance and reliability.
3.  Allow individual analysis tools (Description Editor, Keyword Analyzer, etc.) to flexibly consume either the centrally loaded data or accept their own independent file uploads.
4.  Improve overall application performance, reduce data loading redundancy, and enable more complex cross-source analysis.

## 2. Core Components

1.  **`DataSourceManager` (Frontend Component):** UI for uploading/managing central data sources.
2.  **Global State (Frontend):** A central store (e.g., using Zustand) to hold the status and results of the loaded/processed data.
3.  **Processing API Route (Backend):** A Next.js API route (e.g., `/api/process-data`) responsible for receiving raw data, performing validation, cleaning, transformation, joining, and returning structured JSON.
4.  **Header Mapping Configuration (`src/lib/config/headerMappings.ts`):** **(Base Created)** Defines canonical internal names, display names, aliases for UI report headers, and descriptions for metrics. Used by the Processing API.
5.  **Individual Tool Components (Frontend):** Existing/new tools modified to interact with the Global State or trigger their own data processing.

## 3. High-Level Data Flow

1.  **Upload:** User interacts with `DataSourceManager`, selects up to 3 CSV files (initially).
2.  **Initiate Processing:** User clicks a "Process" button in `DataSourceManager`.
3.  **API Call:** `DataSourceManager` sends the selected files to the `/api/process-data` endpoint. Global state indicates "loading".
4.  **Server-Side Processing:** The API route receives files. For each file:
    *   Identifies its type (e.g., based on input names like `sqpReport`, `businessReport`).
    *   Parses the CSV using `papaparse`.
    *   Extracts headers and uses `findCanonicalName` (from `src/lib/config/headerMappings.ts`) to map them to internal canonical names based on the configured `aliases`. Reports errors if required headers (or aliases) are missing.
    *   Cleans data (dates, numbers).
    *   If multiple relevant files are processed successfully (e.g., SQP + Business Report), performs joins based on defined keys (Date, ASIN/SKU).
5.  **API Response:** API route returns JSON containing the processed data (mapped to canonical headers) for each source and potentially joined data, along with status and any errors/warnings (e.g., `{ sources: { sqp: { status: 'success', data: [...] }, business: { status: 'error', message: 'Missing Date column' } }, joinedData: { status: 'success', data: [...] } }`).
6.  **Update Global State:** `DataSourceManager` receives the API response and updates the Global State with the processed data and status information. Loading state is cleared.
7.  **Tool Consumption:**
    *   User navigates to an individual tool (e.g., `KeywordAnalyzer`).
    *   Tool UI offers: "Use Loaded Data" or "Upload New CSV".
    *   If "Use Loaded Data": Tool reads the necessary data slices (e.g., `sqpData`, `joinedData`) from the Global State. It displays warnings if required data isn't available.
    *   If "Upload New CSV": Tool triggers its own upload mechanism (potentially reusing the API route or having a simpler one).

## 4. Detailed Implementation Steps

### 4.1. Backend: Processing API Route (`/api/process-data`)

*   **Setup:** Create the API route file in `/pages/api/`.
*   **Input Handling:**
    *   Configure for `multipart/form-data` requests. Use libraries like `formidable` or Next.js features.
    *   Expect specific input field names (e.g., `sqpReport`, `businessReport`, `adsReport`).
*   **Parsing:**
    *   Use `papaparse` (server-side) for robust CSV parsing.
*   **Validation & Header Mapping:**
    *   **Import `findCanonicalName` from `src/lib/config/headerMappings.ts`.**
    *   For each uploaded file:
        *   Identify its type.
        *   Extract actual headers from the parsed CSV.
        *   Map headers: Iterate through actual headers, call `findCanonicalName(header)` to get the internal canonical name. Store the mapping (e.g., `{'Customer Search Term': 'searchTerm', 'Spend': 'cost'}`).
        *   Validate: Check if all *required* canonical headers for that file type have been successfully mapped. Return specific error messages if required headers are missing (mentioning expected aliases might be helpful).
*   **Cleaning & Standardization:**
    *   Iterate through parsed rows.
    *   Use the header map created above to build standardized row objects using canonical names (e.g., `{ searchTerm: '...', cost: 10.50, ... }`).
    *   Parse dates (`date-fns`) and clean numbers during this process.
    *   Handle/log row-level errors.
*   **Transformation & Joining (Example: SQP + Business):**
    *   If both SQP and Business report data (now standardized with canonical keys) are available:
        *   Define join keys (e.g., `['date', 'asin']`).
        *   Perform a left join on the standardized data arrays.
        *   Store the result in a `joinedData` array.
*   **Output:**
    *   Construct the JSON response detailing status and data (using canonical keys) for each source and joined data.

### 4.2. Frontend: Global State

*   **Choose Library:** Select and set up Zustand (recommended), Jotai, or React Context.
*   **Define State Shape:**
    ```typescript
    type DataSourceStatus = 'empty' | 'loading' | 'success' | 'error' | 'partial'; // Added partial
    interface SourceData<T> {
      status: DataSourceStatus;
      data: T[] | null; // Data uses canonical keys
      fileName?: string;
      errorMessage?: string;
      warnings?: string[];
      processedAt?: Date;
    }
    interface AppState {
      sources: {
        sqp?: SourceData<any>; // Define specific types later using canonical keys
        business?: SourceData<any>;
        ads?: SourceData<any>;
      };
      joinedData?: SourceData<any>;
      // Actions to update state
    }
    ```
*   **Implement Actions:** Create functions within the store to update the state.

### 4.3. Frontend: `DataSourceManager` Component

*   **UI:**
    *   Distinct file input areas (labeled).
    *   "Process Uploaded Files" button.
    *   Loading indicators.
    *   Display success/error/warning messages from API response (via Global State).
    *   Show status indicators for each loaded source.
*   **Logic:**
    *   Manage selected files locally.
    *   On "Process" click: Create `FormData`, call `/api/process-data`, dispatch actions to update Global State based on response.

### 4.4. Frontend: Individual Tool Components (Refactor Example: `KeywordAnalyzer`)

*   **UI Modification:**
    *   Add choice: "Use Centrally Loaded Data" vs. "Upload New CSV".
*   **Logic Modification:**
    *   **If "Use Centrally Loaded Data":**
        *   Read required data (e.g., `state.sources.sqp.data`, `state.joinedData.data`) from Global State. Data will already have canonical keys.
        *   Check `status` and display messages if data is missing or has errors/warnings.
        *   Tool's internal logic uses canonical keys directly.
    *   **If "Upload New CSV":**
        *   Show dedicated file input.
        *   Implement upload handler (call central API or dedicated one).

### 4.5. Configuration (`src/lib/config/headerMappings.ts`)

*   **Status:** Base file generated from documentation.
*   **Action Required:** **Manually populate the `aliases` array for each metric** by comparing with headers from actual downloaded UI reports (CSV). This is critical for the `findCanonicalName` function to work correctly.
*   **Action Required:** Add/verify entries for non-advertising reports (e.g., Business Reports).

## 5. Key Technologies / Libraries

*   Next.js (API Routes, Frontend Framework)
*   React
*   TypeScript
*   Zustand / Jotai / Context API (Global State)
*   PapaParse (CSV Parsing - server-side primarily)
*   `date-fns` (Date manipulation)
*   `formidable` (Optional: Server-side file upload handling)
*   `src/lib/config/headerMappings.ts` (Header mapping configuration)
*   Tailwind CSS / UI Library

## 6. Future Considerations

*   Google Sheets Integration (OAuth 2.0, Google Sheets API).
*   Saving/Loading User Header Mappings (Manual Mapping UI).
*   More sophisticated data validation rules (beyond header presence).
*   Web workers for intensive client-side tasks (if any).
*   Database integration.

## 7. Caveats / Risks

*   **Complexity:** Managing global state, async API calls, and robust error handling.
*   **Alias Accuracy:** The system's reliability heavily depends on accurately populating the `aliases` in `headerMappings.ts`.
*   **Performance:** Large file processing times on the server need monitoring.
*   **Error Handling:** Clear user feedback for parsing/validation/joining errors is crucial.

