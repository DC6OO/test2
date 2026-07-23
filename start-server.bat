@echo off
cd /d "%~dp0"
echo Starting Connie's Cake Shop local server...
echo.
echo Open this link in your browser:
echo   http://localhost:5500/order.html
echo.
echo Keep this window open while using the site.
echo Press Ctrl+C to stop the server.
echo.
python -m http.server 5500
