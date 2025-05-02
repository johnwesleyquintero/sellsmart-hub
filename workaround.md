## General Workaround Library

**Most Used Commands:**

```bash
npm run pc
npm run cq
npm run test
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

```

**Random Command Workarounds:**

- `Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json; npm cache clean --force; npm install`
- `npm install dotenv archiver chalk inquirer semver glob`
- `npm rebuild`
- `npm ci --prefer-offline`

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
