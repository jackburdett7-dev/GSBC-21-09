@echo off
rem Local preview of the GBSC concept site. Nothing is deployed.
cd /d "%~dp0"
start "GBSC concept :4520" /min node serve.mjs
timeout /t 1 >nul
start "" http://localhost:4520/
