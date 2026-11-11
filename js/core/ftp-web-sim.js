window.FtpWebSim = (function () {
  let ftpState = createInitialState();

  function createInitialState() {
    return {
      hasUserList: false,
      hasPassList: false,
      hasInternalDoc: false,
      loginBruted: false
    };
  }

  function resetState() {
    ftpState = createInitialState();
  }

  function reply(output, ok = true, nextShell = null) {
    return { output, ok, nextShell };
  }

  function handleKaliFtpWebCmd(cmd, lower) {
    // 1. Interactive FTP connection: ftp 192.168.202.136
    if (lower === "ftp 192.168.202.136" || lower === "ftp -n 192.168.202.136") {
      return reply(
        `Connected to 192.168.202.136.\n220 (vsFTPd 3.0.5)\nName (192.168.202.136:kali): anonymous\n331 Please specify the password.\nPassword: \n230 Login successful.\nRemote system type is UNIX.\nUsing binary mode to transfer files.`,
        true,
        "ftp"
      );
    }
    if (lower.startsWith("ftp ") && cmd.includes("192.168.202.137")) {
      return reply(`ftp: connect to address 192.168.202.137: Connection timed out (Filtered by Windows Firewall)`, false);
    }

    // 2. Block FTP sub-shell commands if typed directly in Kali ZSH
    if (lower.startsWith("put ") || lower === "bye") {
      return reply(
        `zsh: command not found: ${cmd.split(" ")[0]}\n[!] Logic Lab: Đây là lệnh trong phiên 'ftp>'. Hãy chạy 'ftp 192.168.202.136' trước!`,
        false
      );
    }

    // 3. Credential analysis: paste allowed.userlist allowed.userlist.passwd
    if (lower.startsWith("paste ")) {
      if (!ftpState.hasUserList || !ftpState.hasPassList) {
        return reply(
          `paste: allowed.userlist: No such file or directory\n[!] Logic Lab: Bạn chưa tải 2 tệp từ FTP! Hãy vào 'ftp 192.168.202.136' -> 'get allowed.userlist' -> 'get allowed.userlist.passwd' -> 'bye' trước.`,
          false
        );
      }
      return reply(window.LabData.COMMANDS["paste allowed.userlist allowed.userlist.passwd"]);
    }

    // 4. Nmap scans for Task 5 & Task 6
    if (lower.startsWith("nmap") || lower.startsWith("sudo nmap")) {
      if (lower.includes("banner") && lower.includes("ftp-anon")) {
        return reply(
          `Starting Nmap 7.99 ( https://nmap.org )\nNmap scan report for 192.168.202.136\nPORT   STATE SERVICE VERSION\n21/tcp open  ftp\n|_banner: 220 Welcome to Internal FTP Server - Authorized Access Only\n80/tcp open  http    Apache\n|_http-server-header: Apache`
        );
      }
      if (lower.includes("banner") || lower.includes("ftp-syst") || lower.includes("max-rtt-timeout")) {
        return reply(window.LabData.COMMANDS["nmap -p 21,80 -sV --script=banner,ftp-syst 192.168.202.136 192.168.202.137"]);
      }
      if (lower.includes("ftp-anon")) {
        return reply(window.LabData.COMMANDS["nmap -p 21 --script=ftp-anon 192.168.202.136"]);
      }
      if (lower.includes("http-methods.url-path=/login.php") || (lower.includes("http-methods") && lower.includes("http-title"))) {
        return reply(window.LabData.COMMANDS['nmap -p 80 --script=http-methods,http-title --script-args "http-methods.url-path=/login.php" 192.168.202.136']);
      }
      if (lower === "nmap -p 80 --script=http-enum 192.168.202.136") {
        return reply(`PORT   STATE SERVICE\n80/tcp open  http\n| http-enum:\n|_  /login.php: Possible admin folder/login page (200 OK)`);
      }
      if (lower.includes("http-form-brute")) {
        if (!ftpState.hasUserList || !ftpState.hasPassList) {
          return reply(
            `[-] NSE: failed to load userdb=allowed.userlist or passdb=allowed.userlist.passwd\n[!] Logic Lab: Bạn cần tải 'allowed.userlist' và 'allowed.userlist.passwd' qua FTP trước khi chạy http-form-brute!`,
            false
          );
        }
        ftpState.loginBruted = true;
        return reply(
          window.LabData.COMMANDS[
            'nmap -p 80 --script=http-form-brute --script-args "http-form-brute.path=/login.php,userdb=allowed.userlist,passdb=allowed.userlist.passwd" 192.168.202.136'
          ]
        );
      }
    }

    // 5. Post-Exploitation curl /dashboard.php | grep -i flag
    if (lower.includes("dashboard.php")) {
      if (!ftpState.hasUserList || !ftpState.hasPassList) {
        return reply(
          `[!] Logic Lab: Bạn chưa thu thập danh sách tài khoản từ FTP ('allowed.userlist' & 'allowed.userlist.passwd') trước khi truy cập /dashboard.php!`,
          false
        );
      }
      return reply(`<!-- HTB_FLAG: c7110277ac44d78b6a9fff2232434d16 -->`);
    }

    return null;
  }

  function resolveInFtpShell(cmd, lower) {
    if (lower === "ls" || lower === "dir") {
      return reply(
        `200 PORT command successful. Consider using PASV.\n150 Here comes the directory listing.\n-rw-r--r--    1 0        0              29 Nov 10 20:40 allowed.userlist\n-rw-r--r--    1 0        0              62 Nov 10 20:40 allowed.userlist.passwd\n-rw-r--r--    1 0        0               0 Nov 10 20:42 tai_lieu_noi_bo.txt\n226 Directory send OK.`
      );
    }

    if (lower === "get tai_lieu_noi_bo.txt") {
      ftpState.hasInternalDoc = true;
      if (window.KaliShellSim) {
        window.KaliShellSim.addFile("tai_lieu_noi_bo.txt", "(Tệp mẫu nội bộ - 0 bytes)");
      }
      return reply(
        `local: tai_lieu_noi_bo.txt remote: tai_lieu_noi_bo.txt\n200 PORT command successful. Consider using PASV.\n150 Opening BINARY mode data connection for tai_lieu_noi_bo.txt (0 bytes).\n226 Transfer complete.`
      );
    }

    if (lower === "get allowed.userlist") {
      ftpState.hasUserList = true;
      if (window.KaliShellSim) {
        window.KaliShellSim.addFile("allowed.userlist", "aron\npwnmeow\negotisticalsw\nadmin");
      }
      return reply(
        `local: allowed.userlist remote: allowed.userlist\n200 PORT command successful. Consider using PASV.\n150 Opening BINARY mode data connection for allowed.userlist (29 bytes).\n226 Transfer complete.\n29 bytes received in 0.00 secs (142.16 kB/s)`
      );
    }

    if (lower === "get allowed.userlist.passwd") {
      ftpState.hasPassList = true;
      if (window.KaliShellSim) {
        window.KaliShellSim.addFile(
          "allowed.userlist.passwd",
          "root\nSupersecretpassword1\n@BaASD&9032123sADS\nrKXM59ESxesUFHAd"
        );
      }
      return reply(
        `local: allowed.userlist.passwd remote: allowed.userlist.passwd\n200 PORT command successful. Consider using PASV.\n150 Opening BINARY mode data connection for allowed.userlist.passwd (62 bytes).\n226 Transfer complete.\n62 bytes received in 0.00 secs (284.50 kB/s)`
      );
    }

    if (lower.startsWith("put ")) {
      const parts = cmd.split(" ");
      const localFile = parts[1] || "/etc/issue";
      const remoteFile = parts[2] || localFile;
      return reply(
        `local: ${localFile} remote: ${remoteFile}\n200 PORT command successful. Consider using PASV.\n550 Permission denied.`
      );
    }

    if (lower === "pwd") {
      return reply(`257 "/" is the current directory`);
    }
    if (lower === "help" || lower === "?") {
      return reply(`Commands may be abbreviated. Commands are:\nls\t\tget\t\tput\t\tpwd\t\tbye\t\texit`);
    }
    if (lower === "bye" || lower === "exit" || lower === "quit") {
      return reply(`221 Goodbye.`, true, "kali");
    }

    return reply(`?Invalid command. (Trong 'ftp>' hỗ trợ: ls, get <file>, put <file>, pwd, bye)`, false);
  }

  return {
    resetState,
    handleKaliFtpWebCmd,
    resolveInFtpShell
  };
})();
