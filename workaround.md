## General Workaround Library

**Most Used Commands:**

```bash
npm run pc
```

```bash
npm run cq
```

```bash
npm run test
```

```bash
npm run test:capture-errors
```

```bash
npm test 2>&1 | grep -i "error\|fail" > project-cli.error.log
```

```bash
npm run build > build-output.log 2>&1
```

**Most Used Workflow:**

```txt
Thoroughly debug and resolve all errors and failing tests reported by `npm run test:capture-errors`, achieving a 100% passing test suite with zero regressions. Leverage the `project-cli.error.log` file in the root directory as the primary resource for identifying and diagnosing issues. Deliver a detailed post-resolution report outlining every code modification, bug fix, and adjustment made, including specific file paths and line numbers, to ensure complete transparency and maintainability of the codebase. Prioritize addressing the root cause of each failure rather than implementing superficial workarounds.
```

```txt
Execute `npm run build > build-output.log 2>&1`, redirecting all console output (stdout and stderr) to a file named `build-output.log` located in the project's root directory. Upon completion of the build process, meticulously analyze the contents of `build-output.log`, identifying and rectifying any errors, warnings, or anomalies present until a successful, clean build is achieved, leaving no errors or warnings in the log file.
```

**Other Commands:**

```bash
npm run build
npm run start
npm install
npm run format
npm run lint
npm run typecheck
npm outdated
npm audit fix --force
npm run update
npm run update:all
npm run build --clear-cache

```

**Random Command Workarounds:**

- `Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json; npm cache clean --force; npm install`
- `npm install dotenv archiver chalk inquirer semver glob`
- `npm rebuild`
- `npm ci --prefer-offline`
- `npm run build > build-output.log 2>&1`

**Reset:**

```powershell
# Clean
Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json; npm cache clean --force
# Reinstall
npm install dotenv archiver chalk inquirer semver glob
```

**Project CLI:**

```bash
npm run pc
```

**or**

```bash
chmod +x project-cli.sh

./project-cli.sh

bash project-cli.sh

sh project-cli.sh
```

**TypeScript Configuration:**

```
npm install --save-dev @types/aria-query @types/babel__core @types/babel__traverse @types/bcrypt @types/d3-fetch @types/d3-force @types/d3-format @types/d3-geo @types/d3-hierarchy @types/d3-timer @types/estree @types/papaparse @types/testing-library__react
```

**Node.js Installation:**

```bash
choco install nodejs-lts
```

**Node.js Installation:**

```bash
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri 'https://nodejs.org/dist/v22.15.0/node-v22.15.0-x64.msi' -OutFile 'nodejs_setup.msi'
msiexec /i nodejs_setup.msi /quiet /norestart
del nodejs_setup.msi
```

```json
{
  "scripts": {
    "format": "prettier --write . 2>&1 | grep -i \"error\\|fail\" >> project-cli.error.log",
    "lint": "eslint . 2>&1 | grep -i \"error\\|fail\" >> project-cli.error.log",
    "typecheck": "tsc --noEmit 2>&1 | grep -i \"error\\|fail\" >> project-cli.error.log",
    "test": "jest",
    "test:capture-errors": "npm test -- --watchAll=false 2>&1 | grep -i \"error\\|fail\" >> project-cli.error.log",
    "check": "echo '' > project-cli.error.log && npm run format && npm run lint && npm run typecheck && npm run test:capture-errors"
  }
}
```
