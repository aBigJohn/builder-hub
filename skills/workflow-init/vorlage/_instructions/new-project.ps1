# Scaffold a new project.
#   .\_instructions\new-project.ps1 -Name my_plugin
# Creates projects\<Name>\ with the standard skeleton and seeds it from templates\.
# Guideline files are NEVER copied -- they live in _instructions\ and load via the root CLAUDE.md.
param(
    [Parameter(Mandatory=$true)][string]$Name
)
$ErrorActionPreference = "Stop"

if ($Name -notmatch '^[a-z0-9_]+$') {
    throw "Name must be lower_snake_case (letters, digits, underscore): '$Name'"
}

$instr = $PSScriptRoot
$root  = Split-Path $instr -Parent
$proj  = Join-Path $root "projects\$Name"
if (Test-Path -LiteralPath $proj) { throw "Already exists: $proj" }

# Adjust to the project's technology during setup (/workflow-init step 3).
$buildDir = 'dist'
$dirs = @('src', 'tests', $buildDir, 'notes', 'reference', 'tools')
foreach ($d in $dirs) { New-Item -ItemType Directory -Force (Join-Path $proj $d) | Out-Null }

$date   = Get-Date -Format 'yyyy-MM-dd'
# guideline vintage = newest mtime in _instructions, so STATE.md records which advice was current
$kbdate = (Get-ChildItem -LiteralPath $instr -Recurse -Filter *.md | Sort-Object LastWriteTime -Descending |
           Select-Object -First 1).LastWriteTime.ToString('yyyy-MM-dd')

function Seed($template, $dest) {
    # Explicit UTF-8 without BOM: PowerShell 5.1 would otherwise mangle umlauts (traps.md).
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $t = [System.IO.File]::ReadAllText((Join-Path $instr "templates\$template"), $utf8NoBom)
    $t = $t.Replace('{{PROJECT}}', $Name).Replace('{{DATE}}', $date).Replace('{{KBDATE}}', $kbdate).Replace('{{BUILD_DIR}}', $buildDir)
    [System.IO.File]::WriteAllText($dest, $t, $utf8NoBom)
    if (-not (Test-Path -LiteralPath $dest)) { throw "not written: $dest" }      # read back (RETRO lesson 5)
}
Seed 'STATE.md'          (Join-Path $proj 'notes\STATE.md')
Seed 'TASKS.md'          (Join-Path $proj 'notes\TASKS.md')
Seed 'project-CLAUDE.md' (Join-Path $proj 'CLAUDE.md')

Write-Output ""
Write-Output "Created $proj"
foreach ($d in $dirs) { Write-Output "   $d\" }
Write-Output "   notes\STATE.md      (from template, guidelines as of $kbdate)"
Write-Output "   notes\TASKS.md      (milestones + tasks, shown in the builder-hud band)"
Write-Output "   CLAUDE.md           (stub -> read notes\STATE.md first)"
Write-Output ""
Write-Output "Next:"
Write-Output "  1. Fill in goal / scope / delivery target at the top of notes\STATE.md,"
Write-Output "     and the first milestones in notes\TASKS.md"
Write-Output "  2. Survey the host program with a minimal plugin before building (RETRO lesson 1)"
Write-Output "  3. Draft the architecture in _instructions\architecture.md and show it to the user"
Write-Output ""
Write-Output "Work from projects\$Name\ in future sessions so both CLAUDE.md files load."
