window.CommandResolver = (function () {
  let state = createInitialState();

  function createInitialState() {
    return {
      msfConfig: {
        RHOSTS: "",
        LHOST: "",
        PAYLOAD: "windows/meterpreter/reverse_tcp",
        SMBUser: "",
        SMBPass: ""
      }
    };
  }

  function resetState() {
    state = createInitialState();
    if (window.KaliShellSim) window.KaliShellSim.resetFs();
    if (window.SshLabSim) window.SshLabSim.resetState();
    if (window.FtpWebSim) window.FtpWebSim.resetState();
  }

  function reply(output, ok = true, nextShell = null) {
    return { output, ok, nextShell };
  }

  function resolve(rawCmd, currentShell) {
    const cmd = rawCmd.trim().replace(/\s+/g, " ");
    const lower = cmd.toLowerCase();

    if (currentShell === "kali") return resolveInKali(cmd, lower);
    if (currentShell === "smb") return resolveInSmb(cmd, lower);
    if (currentShell === "ftp") return window.FtpWebSim.resolveInFtpShell(cmd, lower);
    if (currentShell === "msf") return resolveInMsfRoot(cmd, lower);
    if (currentShell === "msf_exploit") return resolveInMsfExploit(cmd, lower);
    if (currentShell === "msf_ssh_enum") return window.SshLabSim.resolveInMsfSshEnum(cmd, lower);
    if (currentShell === "msf_ssh_pubkey") return window.SshLabSim.resolveInMsfSshPubkey(cmd, lower);
    if (currentShell === "ubuntu_ssh") return window.SshLabSim.resolveInUbuntuSsh(cmd, lower);
    if (currentShell === "meterpreter") return resolveInMeterpreter(cmd, lower);
    if (currentShell === "cmd") return resolveInWindowsCmd(cmd, lower);

    return reply(`zsh: command not found: ${cmd.split(" ")[0]}`, false);
  }

  function resolveInKali(cmd, lower) {
    if (lower === "msfconsole" || lower.startsWith("msfconsole ")) {
      state.msfConfig = createInitialState().msfConfig;
      return reply(window.LabData.COMMANDS["msfconsole"], true, "msf");
    }
    if (lower === "help") {
      return reply(window.LabData.COMMANDS["help"], true);
    }

    if (window.SshLabSim) {
      const sshRes = window.SshLabSim.handleKaliSshCmd(cmd, lower);
      if (sshRes) return sshRes;
    }

    if (window.FtpWebSim) {
      const ftpRes = window.FtpWebSim.handleKaliFtpWebCmd(cmd, lower);
      if (ftpRes) return ftpRes;
    }

    // 1. Block out-of-order sub-shell commands when still in Kali ZSH
    if (lower.startsWith("get ")) {
      return reply(`zsh: command not found: get\n[!] Logic Lab: Chưa kết nối SMB! Hãy chạy 'smbclient //192.168.202.136/public -N' trước.`, false);
    }
    if (lower.startsWith("use ")) {
      return reply(`zsh: command not found: use\n[!] Logic Lab: Chưa khởi động Metasploit! Hãy chạy lệnh 'msfconsole' trước.`, false);
    }
    if (lower.startsWith("set ")) {
      return reply(`[!] Logic Lab: Không thể dùng 'set' của Metasploit ngoài ZSH. Hãy chạy 'msfconsole' -> 'use exploit/windows/smb/ms17_010_psexec' trước!`, false);
    }
    if (lower === "exploit" || lower === "run") {
      return reply(`zsh: command not found: ${lower}\n[!] Logic Lab: Chưa vào Metasploit và chưa cấu hình mục tiêu!\n    Trình tự đúng: msfconsole -> use exploit/... -> set RHOSTS/LHOST -> exploit`, false);
    }
    if (lower === "getuid" || lower === "sysinfo" || lower === "hashdump") {
      return reply(`zsh: command not found: ${lower}\n[!] Logic Lab: Lệnh này chỉ chạy được trong phiên 'meterpreter >' sau khi exploit thành công!`, false);
    }
    if (lower === "shell") {
      return reply(`zsh: command not found: shell\n[!] Logic Lab: Bạn phải chiếm được phiên 'meterpreter >' trên Windows 7 trước khi mở 'shell'!`, false);
    }
    if (lower === "net user" || lower.startsWith("net ")) {
      return reply(`zsh: command not found: net\n[!] Logic Lab: 'net user' là lệnh của Windows CMD (C:\\Windows\\system32>). Hãy chạy 'shell' từ Meterpreter trước!`, false);
    }
    if (lower === "ipconfig") {
      return reply(`zsh: command not found: ipconfig (Trên Kali dùng 'ifconfig' hoặc 'ip a')`, false);
    }

    // 2. Delegate to KaliShellSim for real Kali Linux commands & dynamic tool parsing
    if (window.KaliShellSim) {
      const simRes = window.KaliShellSim.parseKaliCommand(cmd);
      if (simRes) {
        return reply(simRes.output, simRes.ok !== false, simRes.nextShell || null);
      }
    }

    return reply(`zsh: command not found: ${cmd.split(" ")[0]}`, false);
  }

  function resolveInSmb(cmd, lower) {
    if (lower === "ls" || lower === "dir") return reply(window.LabData.COMMANDS["ls"]);
    if (lower === "get secret.txt" || lower === "mget secret.txt") {
      if (window.KaliShellSim) window.KaliShellSim.addFile("secret.txt", "Day la file bi lo hong SMB");
      return reply(window.LabData.COMMANDS["get secret.txt"]);
    }
    if (lower === "get passwords.txt") {
      if (window.KaliShellSim) window.KaliShellSim.addFile("passwords.txt", "admin:P@ssw0rd123 | hacker:1234");
      return reply(window.LabData.COMMANDS["get passwords.txt"]);
    }
    if (lower === "get config.bak") {
      if (window.KaliShellSim) window.KaliShellSim.addFile("config.bak", "[global] workgroup = WORKGROUP | map to guest = Bad User");
      return reply(window.LabData.COMMANDS["get config.bak"]);
    }
    if (lower.startsWith("get ")) {
      return reply(`NT_STATUS_OBJECT_NAME_NOT_FOUND opening remote file \\${cmd.slice(4).trim()}`, false);
    }
    if (lower === "pwd") return reply(`Current directory is \\\\192.168.202.136\\public\\`);
    if (lower === "help" || lower === "?") return reply(`SMB commands: ls, dir, get secret.txt, get passwords.txt, get config.bak, pwd, exit`);
    if (lower === "exit" || lower === "quit") return reply("", true, "kali");

    return reply(`${cmd.split(" ")[0]}: command not found trong SMB shell. (Gõ 'ls', 'get secret.txt', hoặc 'exit' để ra Kali)`, false);
  }

  function resolveInMsfRoot(cmd, lower) {
    if (
      lower === "use exploit/windows/smb/ms17_010_psexec" ||
      lower === "use exploit/windows/smb/ms17_010_eternalblue" ||
      lower === "use 0" ||
      lower === "use 1"
    ) {
      return reply(window.LabData.COMMANDS["use exploit/windows/smb/ms17_010_psexec"], true, "msf_exploit");
    }
    if (lower === "use auxiliary/scanner/ssh/ssh_enumusers") {
      return reply(window.LabData.COMMANDS["use auxiliary/scanner/ssh/ssh_enumusers"], true, "msf_ssh_enum");
    }
    if (lower === "use auxiliary/scanner/ssh/ssh_login_pubkey") {
      return reply(window.LabData.COMMANDS["use auxiliary/scanner/ssh/ssh_login_pubkey"], true, "msf_ssh_pubkey");
    }
    if (lower.startsWith("set ") || lower === "exploit" || lower === "run" || lower === "show options" || lower === "options") {
      return reply(`[-] Chưa chọn module khai thác! Hãy chạy lệnh: use exploit/windows/smb/ms17_010_psexec trước.`, false);
    }
    if (lower.startsWith("search ")) {
      return reply(`Matching Modules:\n  0  exploit/windows/smb/ms17_010_eternalblue\n  1  exploit/windows/smb/ms17_010_psexec`);
    }
    if (lower === "banner") return reply(window.LabData.COMMANDS["msfconsole"]);
    if (lower === "help" || lower === "?") return reply(`Msf6 commands: search ms17_010, use exploit/windows/smb/ms17_010_psexec, exit`);
    if (lower === "exit" || lower === "quit") return reply("", true, "kali");

    return reply(`[-] Unknown command: ${cmd.split(" ")[0]}. Hãy gõ 'use exploit/windows/smb/ms17_010_psexec'`, false);
  }

  function resolveInMsfExploit(cmd, lower) {
    if (lower.startsWith("set ") || lower.startsWith("setg ")) {
      const parts = cmd.split(" ");
      if (parts.length >= 3) {
        const key = parts[1].toUpperCase();
        const val = parts.slice(2).join(" ");
        if (key === "RHOSTS" || key === "RHOST") state.msfConfig.RHOSTS = val;
        else if (key === "LHOST") state.msfConfig.LHOST = val;
        else if (key === "PAYLOAD") state.msfConfig.PAYLOAD = val;
        else if (key === "SMBUSER") state.msfConfig.SMBUser = val;
        else if (key === "SMBPASS") state.msfConfig.SMBPass = val;
        return reply(`${parts[1]} => ${val}`);
      }
    }
    if (lower === "show options" || lower === "options" || lower === "info") {
      const c = state.msfConfig;
      return reply(`Module options (exploit/windows/smb/ms17_010_psexec):\n   Name      Current Setting  Required\n   ----      ---------------  --------\n   RHOSTS    ${(c.RHOSTS || "(chưa đặt)").padEnd(15)}  yes\n   LHOST     ${(c.LHOST || "(chưa đặt)").padEnd(15)}  yes\n   PAYLOAD   ${c.PAYLOAD}\n   SMBUser   ${c.SMBUser || "(trống)"}\n   SMBPass   ${c.SMBPass || "(trống)"}`);
    }
    if (lower === "check") {
      if (state.msfConfig.RHOSTS !== "192.168.202.137") return reply(`[-] Hãy đặt 'set RHOSTS 192.168.202.137' trước khi check!`, false);
      return reply(`[+] 192.168.202.137:445 - The target is vulnerable to MS17-010 (CVE-2017-0143)!`);
    }
    if (lower === "exploit" || lower === "run" || lower.startsWith("exploit ")) {
      const missing = [];
      if (state.msfConfig.RHOSTS !== "192.168.202.137") missing.push("set RHOSTS 192.168.202.137");
      if (state.msfConfig.LHOST !== "192.168.202.132") missing.push("set LHOST 192.168.202.132");
      if (state.msfConfig.SMBUser !== "hacker") missing.push("set SMBUser hacker");
      if (state.msfConfig.SMBPass !== "1234") missing.push("set SMBPass 1234");
      if (missing.length > 0) {
        return reply(`[-] Msf::OptionValidateError Chưa cấu hình đủ tham số cho module ms17_010_psexec!\n[!] Bạn cần chạy các lệnh phía trên còn thiếu:\n    ${missing.join("\n    ")}`, false);
      }
      return reply(window.LabData.COMMANDS["exploit"], true, "meterpreter");
    }
    if (lower === "back") return reply("", true, "msf");
    if (lower === "exit" || lower === "quit") return reply("", true, "kali");

    return reply(`[-] Unknown/Invalid command: ${cmd}. (Hãy 'set RHOSTS ...', 'set LHOST ...' rồi 'exploit')`, false);
  }

  function resolveInMeterpreter(cmd, lower) {
    if (lower === "getuid") return reply(window.LabData.COMMANDS["getuid"]);
    if (lower === "sysinfo") return reply(window.LabData.COMMANDS["sysinfo"]);
    if (lower === "hashdump") return reply(window.LabData.COMMANDS["hashdump"]);
    if (lower === "getsystem") return reply("...got system via technique 1 (Named Pipe Impersonation (In Memory/Admin)).");
    if (lower === "getprivs") return reply("Enabled Process Privileges:\n  SeDebugPrivilege\n  SeImpersonatePrivilege\n  SeTcbPrivilege");
    if (lower === "ipconfig" || lower === "ifconfig") return reply(window.LabData.COMMANDS["ipconfig"]);
    if (lower === "pwd" || lower === "getwd") return reply("C:\\Windows\\system32");
    if (lower === "ps") {
      return reply(`Process List\n PID   PPID  Name            Arch  User\n ---   ----  ----            ----  ----\n 4     0     System          x86   NT AUTHORITY\\SYSTEM\n 648   612   powershell.exe  x86   NT AUTHORITY\\SYSTEM`);
    }
    if (lower === "shell") return reply(window.LabData.COMMANDS["shell"], true, "cmd");
    if (lower === "whoami" || lower === "net user") {
      return reply(`[-] Unknown command: ${cmd}. Bạn đang ở 'meterpreter >', hãy gõ 'shell' trước để vào Windows CMD!`, false);
    }
    if (lower === "help" || lower === "?") return reply(`Meterpreter commands: getuid, sysinfo, getprivs, getsystem, ps, hashdump, ipconfig, pwd, shell, exit`);
    if (lower === "exit" || lower === "quit" || lower === "background") return reply("", true, "msf_exploit");

    return reply(`[-] Unknown Meterpreter command: ${cmd}. (Gõ 'getuid', 'sysinfo', 'shell' hoặc 'exit')`, false);
  }

  function resolveInWindowsCmd(cmd, lower) {
    if (lower === "whoami") return reply(window.LabData.COMMANDS["whoami"]);
    if (lower === "whoami /priv" || lower === "whoami /all") {
      return reply("PRIVILEGES INFORMATION\n----------------------\nPrivilege Name                State\n============================= =======\nSeDebugPrivilege              Enabled\nSeImpersonatePrivilege        Enabled");
    }
    if (lower === "net user") return reply(window.LabData.COMMANDS["net user"]);
    if (lower === "net localgroup administrators") return reply("Alias name     administrators\nMembers\n-------------------------------------------------------------------------------\nAdministrator\nhacker\nThe command completed successfully.");
    if (lower === "ipconfig" || lower === "ipconfig /all") return reply(window.LabData.COMMANDS["ipconfig"]);
    if (lower === "systeminfo") return reply("Host Name:                 WIN7-PC\nOS Name:                   Microsoft Windows 7 Ultimate\nOS Version:                6.1.7601 Service Pack 1 Build 7601\nSystem Type:               X86-based PC");
    if (lower === "tasklist") return reply("Image Name                     PID Session Name\n========================= ======== ================\nSystem                           4 Services\nsmss.exe                       492 Services\ncmd.exe                        648 Services");
    if (lower === "hostname") return reply("WIN7-PC");
    if (lower === "ver") return reply("Microsoft Windows [Version 6.1.7601]");
    if (lower === "dir") {
      return reply(` Directory of C:\\Windows\\system32\n11/11/2026  03:10 PM           301,568 cmd.exe\n11/11/2026  03:10 PM    <DIR>          drivers`);
    }
    if (lower === "exit" || lower === "quit") return reply("", true, "meterpreter");

    return reply(`'${cmd.split(" ")[0]}' is not recognized as an internal or external command,\noperable program or batch file.`, false);
  }

  return { resolve, resetState };
})();
