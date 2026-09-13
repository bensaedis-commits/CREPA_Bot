# CREPA Bot - Deploy Script for Quaxly
# يقوم برفع التحديث إلى GitHub ثم عمل Kill+Start للسيرفر

param(
    [string]$Message = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "[CREPA] Preparing to deploy..." -ForegroundColor Cyan

# 1. Git add & commit & push
Write-Host "[1/3] Git push to GitHub..." -ForegroundColor Yellow
git add .
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit" -ForegroundColor Gray
} else {
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Commit failed or no changes" -ForegroundColor Yellow
    }
}
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Git push failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Pushed to https://github.com/bensaedis-commits/CREPA_Bot" -ForegroundColor Green

# 2. Quaxly Kill
Write-Host "[2/3] Quaxly Kill..." -ForegroundColor Yellow
node scripts/quaxly-restart.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Quaxly restart failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[3/3] Done! Bot will auto-pull from GitHub on next start (AUTO_UPDATE=1)" -ForegroundColor Green
Write-Host "Monitor: https://panel.quaxly.com/server/6f4e4fbd" -ForegroundColor Cyan
