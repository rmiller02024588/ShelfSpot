# =========================================================
# PowerShell: Reset EAS Link for Expo Project
# =========================================================

# --- Step 0: Set your correct EAS project ID ---
$correctProjectId = "2dba6a7b-c82f-43a4-8c7f-98f479e635c6"  # replace with your current valid projectId

# --- Step 1: Delete old EAS metadata ---
Write-Host "Deleting old EAS metadata..."
Remove-Item -Recurse -Force .eas -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# --- Step 2: Search for old UUIDs ---
Write-Host "Searching for old EAS project IDs in files..."
Get-ChildItem -Recurse -File | Select-String -Pattern "\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b" |
    ForEach-Object { Write-Host "Found in:" $_.Path "->" $_.Matches.Value }

# --- Step 3: Update app.config.js ---
$appConfigPath = Join-Path (Get-Location) "app.config.js"

if (Test-Path $appConfigPath) {
    Write-Host "Updating app.config.js with correct projectId..."
    $configContent = Get-Content $appConfigPath -Raw

    if ($configContent -match "eas\s*:\s*{\s*projectId\s*:\s*['""]?[0-9a-f-]{36}['""]?\s*}") {
        # Replace old UUID
        $newContent = [regex]::Replace($configContent, "eas\s*:\s*{\s*projectId\s*:\s*['""]?[0-9a-f-]{36}['""]?\s*}", "eas: { projectId: `"$correctProjectId`" }")
        Set-Content -Path $appConfigPath -Value $newContent
        Write-Host "Updated projectId in app.config.js"
    } else {
        # Append if not found
        Write-Host "No existing projectId found. Adding manually..."
        $newContent = $configContent -replace "extra\s*:\s*{", "extra: { eas: { projectId: `"$correctProjectId`" },"
        Set-Content -Path $appConfigPath -Value $newContent
    }
} else {
    Write-Host "Warning: app.config.js not found! Please check the project folder."
}

# --- Step 4: Log into Expo CLI ---
Write-Host "Make sure you're logged into Expo CLI..."
Write-Host "If needed, run: npx eas logout && npx eas login"

# --- Step 5: Re-initialize EAS project locally ---
Write-Host "Initializing EAS locally..."
Write-Host "Run: npx eas init --force and choose existing project (@shelfspot/ShelfSpot)"

# --- Step 6: Reinstall dependencies ---
Write-Host "Reinstalling dependencies..."
npm install

Write-Host "Cleanup complete. You can now run:"
Write-Host "npx eas build:configure"