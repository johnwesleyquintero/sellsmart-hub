@echo off
REM Executes tasks based on the configuration in .wescore.json using a Node.js script
node .\.wescore\run_tasks_from_config.js %*
exit /b %errorlevel%
