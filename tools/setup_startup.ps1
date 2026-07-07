# Script tự động thêm ứng dụng vào thư mục Startup của Windows
# Ứng dụng sẽ khởi chạy dưới dạng cửa sổ Native App (không có thanh địa chỉ)

$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$EdgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$AppUrl = "http://localhost:3000" # Thay đổi URL này nếu bạn triển khai lên server khác

# Kiểm tra xem Chrome hay Edge có sẵn không
$BrowserPath = if (Test-Path $ChromePath) { $ChromePath } else { $EdgePath }

if (-not (Test-Path $BrowserPath)) {
    Write-Host "❌ Không tìm thấy Chrome hoặc Edge. Vui lòng cài đặt trình duyệt để sử dụng tính năng này." -ForegroundColor Red
    exit
}

$WshShell = New-Object -ComObject WScript.Shell
$StartupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\ACV_Map.lnk"

$Shortcut = $WshShell.CreateShortcut($StartupPath)
$Shortcut.TargetPath = $BrowserPath
$Shortcut.Arguments = "--app=$AppUrl"
$Shortcut.WorkingDirectory = "d:\Mappedin"
$Shortcut.Save()

Write-Host "✅ Đã thêm ACV Map vào thư mục khởi động của Windows!" -ForegroundColor Green
Write-Host "📍 Đường dẫn: $StartupPath"
Write-Host "🚀 Ứng dụng sẽ tự động mở khi bạn khởi động máy tính."
