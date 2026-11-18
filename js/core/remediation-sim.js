window.RemediationSim = (function () {
  let smbFixed = false;
  let ftpStopped = false;
  let ftpDisabled = false;

  function resetState() {
    smbFixed = false;
    ftpStopped = false;
    ftpDisabled = false;
  }

  function handleRemediationCmd(cmd, lower) {
    // 1. IP a & Ping commands for 192.168.100.0/24 network
    if (lower === "ip a" || lower === "ip addr" || lower.startsWith("ip a ")) {
      return { output: window.LabData.COMMANDS["ip a"], ok: true };
    }
    if (lower.startsWith("ping ") && cmd.includes("192.168.100.20")) {
      return { output: window.LabData.COMMANDS["ping -c 4 192.168.100.20"], ok: true };
    }

    // 2. SMB Hardening scenario
    if (lower.includes("nano") && lower.includes("smb.conf")) {
      return { output: window.LabData.COMMANDS["sudo nano /etc/samba/smb.conf"], ok: true };
    }
    if (lower.includes("systemctl restart smbd") || lower.includes("service smbd restart")) {
      smbFixed = true;
      return { output: window.LabData.COMMANDS["sudo systemctl restart smbd"], ok: true };
    }
    if (lower.includes("smb-protocols") && (cmd.includes("192.168.100.20") || cmd.includes("192.168.202.136"))) {
      if (smbFixed) {
        return {
          output: `Starting Nmap 7.99 ( https://nmap.org )
Nmap scan report for 192.168.100.20
Host is up (0.00045s latency).

PORT    STATE SERVICE
445/tcp open  microsoft-ds
| smb-protocols: 
|   dialects: 
|     2.02
|     2.10
|_    3.00

[✓] Kiểm chứng thành công: Dòng cảnh báo 'NT LM 0.12 (SMBv1)' đã biến mất hoàn toàn.`,
          ok: true
        };
      }
      return { output: window.LabData.COMMANDS["nmap -p445 --script smb-protocols 192.168.100.20"], ok: true };
    }
    if (lower.includes("smb-vuln-ms17-010") && lower.includes("packet-trace")) {
      return { output: window.LabData.COMMANDS["nmap -p445 --script smb-vuln-ms17-010,smb-vuln-ms08-067 --packet-trace 192.168.100.20"], ok: true };
    }
    if (lower.includes("-sv") && lower.includes("-o") && cmd.includes("192.168.100.20")) {
      return { output: window.LabData.COMMANDS["nmap -sV -O -p445 192.168.100.20"], ok: true };
    }

    // 3. FTP Backdoor Remediation scenario
    if (lower.includes("systemctl stop vsftpd") || lower.includes("service vsftpd stop")) {
      ftpStopped = true;
      return { output: window.LabData.COMMANDS["sudo systemctl stop vsftpd"], ok: true };
    }
    if (lower.includes("systemctl disable vsftpd")) {
      ftpDisabled = true;
      ftpStopped = true;
      return { output: window.LabData.COMMANDS["sudo systemctl disable vsftpd"], ok: true };
    }
    if (lower.includes("banner") && cmd.includes("192.168.100.20")) {
      if (ftpStopped) {
        return {
          output: `PORT   STATE  SERVICE VERSION\n21/tcp closed ftp`,
          ok: true
        };
      }
      return { output: window.LabData.COMMANDS["nmap -sV -p21 --script=banner 192.168.100.20"], ok: true };
    }
    if (lower.includes("ftp-vsftpd-backdoor")) {
      if (ftpStopped) {
        return {
          output: `Starting Nmap 7.99 ( https://nmap.org )\nPORT   STATE  SERVICE\n21/tcp closed ftp\n|_ ftp-vsftpd-backdoor: Dịch vụ FTP đã tắt, không thể khai thác backdoor.`,
          ok: true
        };
      }
      return { output: window.LabData.COMMANDS["nmap -p21 --script ftp-vsftpd-backdoor 192.168.100.20"], ok: true };
    }
    if ((lower.includes("p21,6200") || lower.includes("p 21,6200")) && (cmd.includes("192.168.100.20") || cmd.includes("192.168.202.136"))) {
      if (ftpStopped) {
        return { output: window.LabData.COMMANDS["nmap -p21,6200 192.168.100.20"], ok: true };
      }
      return {
        output: `Starting Nmap 7.99 ( https://nmap.org )
PORT     STATE SERVICE
21/tcp   open  ftp
6200/tcp open  lm-x`,
        ok: true
      };
    }
    if ((lower.includes("p6200") || lower.includes("p 6200")) && (cmd.includes("192.168.100.20") || cmd.includes("192.168.202.136"))) {
      if (ftpStopped) {
        return {
          output: `PORT     STATE  SERVICE\n6200/tcp closed lm-x\n[✓] Cổng ẩn backdoor 6200 đã đóng.`,
          ok: true
        };
      }
      return { output: window.LabData.COMMANDS["nmap -p6200 192.168.100.20"], ok: true };
    }

    return null;
  }

  return {
    resetState,
    handleRemediationCmd,
    isSmbFixed: () => smbFixed,
    isFtpStopped: () => ftpStopped,
    isFtpDisabled: () => ftpDisabled
  };
})();
