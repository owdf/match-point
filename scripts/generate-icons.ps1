param(
  [string]$Source = "static/logo.png",
  [string]$OutputRoot = "unpackage/res/icons"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sizes = 20, 29, 40, 58, 60, 72, 76, 80, 87, 96, 120, 144, 152, 167, 180, 192, 1024
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null

$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
try {
  foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
      } finally {
        $graphics.Dispose()
      }
      $outputPath = Join-Path $OutputRoot "$size`x$size.png"
      $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
      Write-Output "Generated $outputPath"
    } finally {
      $bitmap.Dispose()
    }
  }
} finally {
  $sourceImage.Dispose()
}
