window.LabData = window.LabData || {};
window.LabData.COMMANDS = window.LabData.COMMANDS || {};

Object.assign(window.LabData.COMMANDS, {
  "ip a": `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:85:12:34 brd ff:ff:ff:ff:ff:ff
    inet 192.168.100.10/24 brd 192.168.100.255 scope global eth0
       valid_lft forever preferred_lft forever`,

  "ping -c 4 192.168.100.20": `PING 192.168.100.20 (192.168.100.20) 56(84) bytes of data.
64 bytes from 192.168.100.20: icmp_seq=1 ttl=64 time=0.412 ms
64 bytes from 192.168.100.20: icmp_seq=2 ttl=64 time=0.385 ms
64 bytes from 192.168.100.20: icmp_seq=3 ttl=64 time=0.392 ms
64 bytes from 192.168.100.20: icmp_seq=4 ttl=64 time=0.401 ms

--- 192.168.100.20 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3054ms
rtt min/avg/max/mdev = 0.385/0.397/0.412/0.010 ms`,

  "nmap -sV -O -p445 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00045s latency).

PORT    STATE SERVICE     VERSION
445/tcp open  netbios-ssn Samba smbd 3.x - 4.x (workgroup: WORKGROUP)
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19 (Ubuntu Server)
Network Distance: 1 hop

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 4.12 seconds`,

  "nmap -p445 --script smb-protocols 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00045s latency).

PORT    STATE SERVICE
445/tcp open  microsoft-ds
| smb-protocols: 
|   dialects: 
|     NT LM 0.12 (SMBv1) [dangerous, but default]
|     2.02
|_    2.10

Nmap done: 1 IP address (1 host up) scanned in 0.52 seconds`,

  "nmap -p445 --script smb-vuln-ms17-010,smb-vuln-ms08-067 --packet-trace 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
SENT (0.0120s) TCP 192.168.100.10:49210 > 192.168.100.20:445 S ttl=55 id=14291 iplen=44  seq=3819201948 win=1024 <mss 1460>
RCVD (0.0125s) TCP 192.168.100.20:445 > 192.168.100.10:49210 SA ttl=64 id=0 iplen=44  seq=1928471029 win=64240 <mss 1460>
SENT (0.0128s) TCP 192.168.100.10:49210 > 192.168.100.20:445 [SMB Negotiate Protocol Request (SMBv1)]
RCVD (0.0135s) TCP 192.168.100.20:445 > 192.168.100.10:49210 [SMB Negotiate Protocol Response (NT LM 0.12)]
Nmap scan report for 192.168.100.20
Host is up (0.00050s latency).

PORT    STATE SERVICE
445/tcp open  microsoft-ds
| smb-vuln-ms17-010: 
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)
|     State: VULNERABLE
|     IDs:  CVE:CVE-2017-0143
|_    Risk factor: HIGH (SMBv1 protocol dialect enabled)

Nmap done: 1 IP address (1 host up) scanned in 0.78 seconds`,

  "sudo nano /etc/samba/smb.conf": `[+] Mở tệp /etc/samba/smb.conf...
====================== /etc/samba/smb.conf ======================
[global]
   workgroup = WORKGROUP
   server string = %h server (Samba, Ubuntu)
   dns proxy = no
   log file = /var/log/samba/log.%m
   max log size = 1000
   panic action = /usr/share/samba/panic-action %d
   server role = standalone server
   passdb backend = tdbsam
   obey pam restrictions = yes
   unix password sync = yes
   min protocol = SMB2  <--- [ĐÃ THÊM CẤU HÌNH VÔ HIỆU HÓA SMBv1]
=================================================================
[+] Đã lưu cấu hình (Ctrl + O) và thoát (Ctrl + X).`,

  "sudo systemctl restart smbd": `[+] Restarting smbd.service...
[+] Dịch vụ Samba (smbd) đã khởi động lại thành công với chuẩn min protocol = SMB2.`,

  "nmap -sV -p21 --script=banner 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00042s latency).

PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 2.3.4
|_banner: 220 (vsFTPd 2.3.4)

Nmap done: 1 IP address (1 host up) scanned in 0.28 seconds`,

  "nmap -p21 --script ftp-vsftpd-backdoor 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00040s latency).

PORT   STATE SERVICE
21/tcp open  ftp
| ftp-vsftpd-backdoor: 
|   VULNERABLE:
|   vsFTPd version 2.3.4 backdoor
|     State: VULNERABLE (Exploitable)
|     IDs:  CVE:CVE-2011-2523
|     Description: vsFTPd 2.3.4 contains a backdoor triggered by ':)' opening root shell on port 6200/tcp.

Nmap done: 1 IP address (1 host up) scanned in 1.15 seconds`,

  "nmap -p6200 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00038s latency).

PORT     STATE SERVICE
6200/tcp open  lm-x

Nmap done: 1 IP address (1 host up) scanned in 0.12 seconds`,

  "sudo systemctl stop vsftpd": `[+] Stopping vsftpd.service...
[+] Dịch vụ vsftpd đã dừng tiến trình đang chạy trên RAM.`,

  "sudo systemctl disable vsftpd": `Synchronizing state of vsftpd.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.
Executing: /usr/lib/systemd/systemd-sysv-install disable vsftpd
Removed "/etc/systemd/system/multi-user.target.wants/vsftpd.service".
[+] Đã vô hiệu hóa khả năng tự khởi động cùng hệ thống của vsftpd.`,

  "nmap -p21,6200 192.168.100.20": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00041s latency).

PORT     STATE    SERVICE
21/tcp   closed   ftp
6200/tcp closed   lm-x

Nmap done: 1 IP address (1 host up) scanned in 0.09 seconds`
});
