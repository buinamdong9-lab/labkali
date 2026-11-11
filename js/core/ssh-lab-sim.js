window.SshLabSim = (function () {
  let sshState = createInitialState();

  function createInitialState() {
    return {
      keyGenerated: false,
      keyCopied: false,
      sessionOpened: false,
      enumConfig: {
        RHOSTS: "",
        USER_FILE: "",
        ACTION: ""
      },
      pubkeyConfig: {
        RHOSTS: "",
        USERNAME: "",
        KEY_PATH: ""
      }
    };
  }

  function resetState() {
    sshState = createInitialState();
  }

  function reply(output, ok = true, nextShell = null) {
    return { output, ok, nextShell };
  }

  function handleKaliSshCmd(cmd, lower) {
    if (lower.startsWith("ssh-keygen")) {
      sshState.keyGenerated = true;
      if (window.KaliShellSim) {
        window.KaliShellSim.addFile("leaked_key", "-----BEGIN OPENSSH PRIVATE KEY-----");
        window.KaliShellSim.addFile("leaked_key.pub", "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7... kali@kali");
      }
      return reply(window.LabData.COMMANDS['ssh-keygen -t rsa -f /home/kali/leaked_key -N ""']);
    }

    if (lower.startsWith("ssh-copy-id")) {
      if (!sshState.keyGenerated) {
        return reply(
          `/usr/bin/ssh-copy-id: ERROR: failed to open ID file '/home/kali/leaked_key.pub': No such file\n[!] Logic Lab: Bạn chưa tạo cặp khóa RSA! Hãy chạy lệnh 'ssh-keygen -t rsa -f /home/kali/leaked_key -N ""' trước.`,
          false
        );
      }
      if (!cmd.includes("192.168.202.136")) {
        return reply(`/usr/bin/ssh-copy-id: ERROR: Hãy chỉ định đúng mục tiêu vboxuser@192.168.202.136`, false);
      }
      sshState.keyCopied = true;
      return reply(window.LabData.COMMANDS["ssh-copy-id -i /home/kali/leaked_key.pub vboxuser@192.168.202.136"]);
    }

    if (lower.startsWith("sessions")) {
      return reply(`zsh: command not found: sessions\n[!] Logic Lab: Lệnh 'sessions -i 1' phải chạy bên trong Metasploit sau khi thực thi module ssh_login_pubkey!`, false);
    }

    return null;
  }

  function resolveInMsfSshEnum(cmd, lower) {
    if (lower.startsWith("set ") || lower.startsWith("setg ")) {
      const parts = cmd.split(" ");
      if (parts.length >= 3) {
        const key = parts[1].toUpperCase();
        const val = parts.slice(2).join(" ");
        if (key === "RHOSTS" || key === "RHOST") sshState.enumConfig.RHOSTS = val;
        else if (key === "USER_FILE") sshState.enumConfig.USER_FILE = val;
        else if (key === "ACTION") sshState.enumConfig.ACTION = val;
        return reply(`${parts[1]} => ${val}`);
      }
    }
    if (lower === "show options" || lower === "options") {
      const c = sshState.enumConfig;
      return reply(
        `Module options (auxiliary/scanner/ssh/ssh_enumusers):\n   RHOSTS     ${c.RHOSTS || "(chưa đặt)"}\n   USER_FILE  ${c.USER_FILE || "(chưa đặt)"}\n   ACTION     ${c.ACTION || "(chưa đặt)"}`
      );
    }
    if (lower === "run" || lower === "exploit") {
      const missing = [];
      if (sshState.enumConfig.RHOSTS !== "192.168.202.136") missing.push("set RHOSTS 192.168.202.136");
      if (!sshState.enumConfig.USER_FILE) missing.push("set USER_FILE /usr/share/wordlists/metasploit/unix_users.txt");
      if (!sshState.enumConfig.ACTION) missing.push("set ACTION Timing Attack");
      if (missing.length > 0) {
        return reply(
          `[-] Msf::OptionValidateError Chưa cấu hình đủ tham số cho ssh_enumusers!\n[!] Cần chạy các lệnh phía trên:\n    ${missing.join("\n    ")}`,
          false
        );
      }
      return reply(window.LabData.COMMANDS["ssh_enum_run"]);
    }
    if (lower === "use auxiliary/scanner/ssh/ssh_login_pubkey") {
      return reply(window.LabData.COMMANDS["use auxiliary/scanner/ssh/ssh_login_pubkey"], true, "msf_ssh_pubkey");
    }
    if (lower === "back") return reply("", true, "msf");
    if (lower === "exit" || lower === "quit") return reply("", true, "kali");

    return reply(`[-] Unknown/Invalid command in ssh_enumusers: ${cmd}`, false);
  }

  function resolveInMsfSshPubkey(cmd, lower) {
    if (lower.startsWith("set ") || lower.startsWith("setg ")) {
      const parts = cmd.split(" ");
      if (parts.length >= 3) {
        const key = parts[1].toUpperCase();
        const val = parts.slice(2).join(" ");
        if (key === "RHOSTS" || key === "RHOST") sshState.pubkeyConfig.RHOSTS = val;
        else if (key === "USERNAME") sshState.pubkeyConfig.USERNAME = val;
        else if (key === "KEY_PATH") sshState.pubkeyConfig.KEY_PATH = val;
        return reply(`${parts[1]} => ${val}`);
      }
    }
    if (lower === "show options" || lower === "options") {
      const c = sshState.pubkeyConfig;
      return reply(
        `Module options (auxiliary/scanner/ssh/ssh_login_pubkey):\n   RHOSTS    ${c.RHOSTS || "(chưa đặt)"}\n   USERNAME  ${c.USERNAME || "(chưa đặt)"}\n   KEY_PATH  ${c.KEY_PATH || "(chưa đặt)"}`
      );
    }
    if (lower === "run" || lower === "exploit") {
      if (!sshState.keyGenerated || !sshState.keyCopied) {
        return reply(
          `[-] 192.168.202.136:22 - SSH - Khóa '/home/kali/leaked_key' chưa được tạo hoặc chưa cấy lên mục tiêu!\n[!] Hãy gõ 'exit' ra Kali và chạy 'ssh-keygen ...' + 'ssh-copy-id ...' trước.`,
          false
        );
      }
      const missing = [];
      if (sshState.pubkeyConfig.RHOSTS !== "192.168.202.136") missing.push("set RHOSTS 192.168.202.136");
      if (sshState.pubkeyConfig.USERNAME !== "vboxuser") missing.push("set USERNAME vboxuser");
      if (sshState.pubkeyConfig.KEY_PATH !== "/home/kali/leaked_key") missing.push("set KEY_PATH /home/kali/leaked_key");
      if (missing.length > 0) {
        return reply(
          `[-] Msf::OptionValidateError Chưa cấu hình đủ tham số cho ssh_login_pubkey!\n[!] Cần chạy các lệnh phía trên:\n    ${missing.join("\n    ")}`,
          false
        );
      }
      sshState.sessionOpened = true;
      return reply(window.LabData.COMMANDS["ssh_pubkey_run"]);
    }
    if (lower === "sessions -i 1" || lower === "sessions -i <so_phien_lam_viec>" || lower === "sessions -l") {
      if (!sshState.sessionOpened) {
        return reply(`[-] No active sessions. Hãy chạy lệnh 'run' để xác thực khóa SSH và mở phiên trước!`, false);
      }
      if (lower === "sessions -l") {
        return reply(`Active sessions\n===============\n  Id  Name  Type         Information             Connection\n  --  ----  ----         -----------             ----------\n  1         shell linux  SSH vboxuser @ ubuntu   192.168.202.132:41892 -> 192.168.202.136:22`);
      }
      return reply(window.LabData.COMMANDS["sessions -i 1"], true, "ubuntu_ssh");
    }
    if (lower === "back") return reply("", true, "msf");
    if (lower === "exit" || lower === "quit") return reply("", true, "kali");

    return reply(`[-] Unknown/Invalid command in ssh_login_pubkey: ${cmd}`, false);
  }

  function resolveInUbuntuSsh(cmd, lower) {
    if (lower === "whoami") return reply("vboxuser");
    if (lower === "id") {
      return reply("uid=1000(vboxuser) gid=1000(vboxuser) groups=1000(vboxuser),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev)");
    }
    if (lower === "hostname") return reply("ubuntu");
    if (lower === "pwd") return reply("/home/vboxuser");
    if (lower === "uname" || lower === "uname -a") {
      return reply("Linux ubuntu 5.15.0-105-generic #115-Ubuntu SMP Mon Apr 15 09:52:04 UTC 2026 x86_64 GNU/Linux");
    }
    if (lower === "ls" || lower === "ls -la") {
      return reply("drwxr-xr-x 3 vboxuser vboxuser 4096 Nov 11 16:00 .\n-rw------- 1 vboxuser vboxuser  564 Nov 11 16:40 .ssh/authorized_keys");
    }
    if (lower === "ip a" || lower === "ifconfig") {
      return reply("eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.202.136  netmask 255.255.255.0  broadcast 192.168.202.255");
    }
    if (lower === "exit" || lower === "quit" || lower === "background") {
      return reply("", true, "msf_ssh_pubkey");
    }

    return reply(`bash: ${cmd.split(" ")[0]}: command not found (Gõ 'whoami', 'id', 'uname -a', hoặc 'exit')`, false);
  }

  return {
    resetState,
    handleKaliSshCmd,
    resolveInMsfSshEnum,
    resolveInMsfSshPubkey,
    resolveInUbuntuSsh
  };
})();

