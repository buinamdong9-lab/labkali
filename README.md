# 🐉 Kali Linux QTerminal — Web Lab Mô phỏng Tấn công Mạng (192.168.202.0/24)

Ứng dụng web mô phỏng **QTerminal trên Kali Linux** thực hiện 4 kịch bản tấn công mạng nội bộ (Quét mạng Nmap, Dò lỗ hổng SMB/MS17-010, Khai thác Ubuntu SMB Anonymous Share, và Khai thác Windows 7 EternalBlue qua Metasploit) chạy trực tiếp trên trình duyệt.

## 📁 Cấu trúc thư mục (Modular Architecture, < 300 dòng/file)

```text
LABMOPHONG/
├── index.html                    # Giao diện chính chuẩn QTerminal Kali Linux
├── prompt_web_lab.md             # Tài liệu đặc tả yêu cầu gốc
├── README.md                     # Hướng dẫn sử dụng & kiến trúc module
├── css/
│   ├── base.css                  # Bảng màu Kali Linux Dark Slate (#1f2229), layout chính
│   ├── components.css            # Sidebar, card kịch bản, menu QTerminal, progress bar, modal
│   └── terminal.css              # Dấu nhắc 2 dòng Kali ZSH (┌──(kali㉿kali)-[~] / └─$), inline input
└── js/
    ├── data/
    │   ├── commands.js           # Tập dữ liệu ánh xạ lệnh (COMMANDS) và kết quả mô phỏng
    │   └── scenarios.js          # Cấu hình 4 kịch bản tấn công (SCENARIOS) & trạng thái shell
    ├── core/
    │   ├── audio.js              # Bộ tạo âm thanh bàn phím & cảnh báo bằng Web Audio API
    │   ├── command-resolver.js   # Xử lý thông minh các lệnh ngoài kịch bản theo từng môi trường Shell
    │   └── terminal-engine.js    # Quản lý dòng nhắc inline, hiệu ứng typewriter, chuyển đổi shell
    └── ui/
        └── app.js                # Điều khiển sự kiện UI, Auto Demo, lịch sử lệnh, menu QTerminal
```

## 🚀 Tính năng nổi bật

- **Nhập lệnh trực tiếp tại dấu nhắc `└─$`**: Không dùng ô input rời ở đáy màn hình; gõ lệnh ở đâu hiển thị cố định ngay tại dòng đó giống hệt Terminal thật.
- **Tương tác thanh Menu QTerminal**:
  - Click `View` để **Ẩn/Hiện Sidebar** (chuyển sang chế độ toàn màn hình QTerminal 100%).
  - Click `Session` để Reset phiên, `Actions` để chạy Auto Demo, `Edit` để Copy, `Help` để xem trợ giúp.
- **Hỗ trợ phím tắt & lệnh ngoài kịch bản**:
  - `Tab`: Tự động hoàn thiện lệnh (Autocomplete).
  - `↑` / `↓`: Duyệt lịch sử lệnh đã gõ.
  - `Ctrl + L`: Xóa màn hình (`clear`).
  - `Ctrl + C`: Hủy dòng lệnh hiện tại (`^C`).
  - Hỗ trợ các lệnh ngoài kịch bản theo đúng ngữ cảnh (`kali`, `smb`, `msf6`, `meterpreter`, `cmd`).
# labkali
