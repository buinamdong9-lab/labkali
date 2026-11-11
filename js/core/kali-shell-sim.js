window.KaliShellSim = (function () {
  let cwd = "/home/kali";
  const virtualFs = {
    "notes.txt": "Target Subnet: 192.168.202.0/24\nWin7: .137 | Ubuntu: .136"
  };

  function resetFs() {
    cwd = "/home/kali";
    Object.keys(virtualFs).forEach((k) => {
      if (k !== "notes.txt") delete virtualFs[k];
    });
  }

  function addFile(name, content) {
    virtualFs[name] = content;
  }

  function parseKaliCommand(rawCmd) {
    // Strip leading sudo
    let cmd = rawCmd.trim().replace(/^sudo\s+(-[a-zA-Z]+\s+)*/, "");
    const lower = cmd.toLowerCase();
    const parts = cmd.split(/\s+/);
    const bin = parts[0].toLowerCase();

    // 1. Handle output redirection: echo "abc" > file.txt
    if (bin === "echo" && cmd.includes(">")) {
      const [left, right] = cmd.split(">");
      const text = left.replace(/^echo\s+/i, "").trim().replace(/^["']|["']$/g, "");
      const fname = right.trim().split(/\s+/)[0];
      if (fname) virtualFs[fname] = text;
      return { output: "", ok: true, nextShell: null };
    }

    // 2. Dynamic Nmap parser (supports any flags like -A, -sS, -sC, -sV, -O, -p-, --script)
    if (bin === "nmap") {
      return parseNmap(cmd, lower);
    }

    // 3. Dynamic SMB & Web tools
    if (["smbclient", "enum4linux", "smbmap", "crackmapexec", "nxc"].includes(bin)) {
      return parseSmbTools(bin, cmd, lower);
    }
    if (bin === "curl") {
      if (lower.includes("admin/pass.txt")) {
        if (lower.includes("-i")) {
          return { output: "HTTP/1.1 200 OK\nServer: Apache/2.4.52 (Ubuntu)\nContent-Type: text/plain", ok: true };
        }
        return { output: window.LabData.COMMANDS["curl http://192.168.202.136/admin/pass.txt"], ok: true };
      }
      if (cmd.includes("192.168.202.136")) {
        return { output: "HTTP/1.1 200 OK\nServer: Apache/2.4.52 (Ubuntu)\nLocation: /login.php", ok: true };
      }
    }

    // 4. Linux System & Identity commands
    if (bin === "whoami") return { output: rawCmd.trim().startsWith("sudo") ? "root" : "kali", ok: true };
    if (bin === "id") {
      return {
        output: rawCmd.trim().startsWith("sudo")
          ? "uid=0(root) gid=0(root) groups=0(root)"
          : "uid=1000(kali) gid=1000(kali) groups=1000(kali),24(cdrom),27(sudo),138(wireshark)",
        ok: true
      };
    }
    if (bin === "hostname") return { output: "kali", ok: true };
    if (bin === "pwd") return { output: cwd, ok: true };
    if (bin === "cd") {
      const target = parts[1] || "~";
      if (target === "~" || target === "/home/kali") cwd = "/home/kali";
      else if (target === "/tmp") cwd = "/tmp";
      else if (target === "/") cwd = "/";
      else if (target === "..") cwd = "/home";
      return { output: "", ok: true };
    }
    if (bin === "uname") {
      return {
        output: lower.includes("-a")
          ? "Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2026-05-12) x86_64 GNU/Linux"
          : "Linux",
        ok: true
      };
    }
    if (bin === "lsb_release") {
      return {
        output: "Distributor ID:\tKali\nDescription:\tKali GNU/Linux Rolling\nRelease:\t2026.2\nCodename:\tkali-rolling",
        ok: true
      };
    }
    if (bin === "date") return { output: new Date().toUTCString(), ok: true };
    if (bin === "uptime") return { output: " 16:30:12 up  2:14,  1 user,  load average: 0.08, 0.12, 0.09", ok: true };
    if (bin === "free") {
      return {
        output: "               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       1.4Gi       5.1Gi        32Mi       1.3Gi       6.1Gi\nSwap:          2.0Gi          0B       2.0Gi",
        ok: true
      };
    }
    if (bin === "df") {
      return {
        output: "Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/sda1       81914160 16428120  61273412  22% /",
        ok: true
      };
    }
    if (bin === "ps") {
      return {
        output: "    PID TTY          TIME CMD\n   1342 pts/0    00:00:00 zsh\n   2194 pts/0    00:00:00 ps",
        ok: true
      };
    }

    // 5. File manipulation (ls, cat, touch, mkdir, rm, echo, grep)
    if (bin === "ls" || bin === "dir") {
      const files = Object.keys(virtualFs);
      if (lower.includes("-l") || lower.includes("-a")) {
        const rows = files.map(
          (f) => `-rw-r--r-- 1 kali kali ${String(virtualFs[f].length).padStart(4)} Nov 11 16:00 ${f}`
        );
        return {
          output: ["drwxr-xr-x 2 kali kali 4096 Nov 11 16:00 .", "drwxr-xr-x 4 root root 4096 Nov 10 09:00 ..", ...rows].join("\n"),
          ok: true
        };
      }
      return { output: files.join("  "), ok: true };
    }
    if (bin === "touch" && parts[1]) {
      virtualFs[parts[1]] = virtualFs[parts[1]] || "";
      return { output: "", ok: true };
    }
    if (bin === "mkdir" && parts[1]) {
      virtualFs[parts[1] + "/"] = "<DIR>";
      return { output: "", ok: true };
    }
    if (bin === "rm" && parts[1]) {
      const target = parts[parts.length - 1];
      delete virtualFs[target];
      return { output: "", ok: true };
    }
    if (bin === "cat" || bin === "head" || bin === "tail" || bin === "less" || bin === "more") {
      const f = parts[parts.length - 1];
      if (f === "/etc/os-release") {
        return { output: 'PRETTY_NAME="Kali GNU/Linux Rolling"\nNAME="Kali GNU/Linux"\nID=kali\nVERSION="2026.2"', ok: true };
      }
      if (f === "/etc/passwd") {
        return { output: "root:x:0:0:root:/root:/usr/bin/zsh\nkali:x:1000:1000:Kali,,,:/home/kali:/usr/bin/zsh", ok: true };
      }
      if (f === "/etc/hosts") {
        return { output: "127.0.0.1\tlocalhost\n192.168.202.132\tkali\n192.168.202.136\tubuntu\n192.168.202.137\twin7", ok: true };
      }
      if (virtualFs[f] !== undefined) return { output: virtualFs[f], ok: true };
      return { output: `${bin}: ${f}: No such file or directory`, ok: false };
    }
    if (bin === "echo") {
      return { output: cmd.slice(5).replace(/^["']|["']$/g, ""), ok: true };
    }

    // 6. Network stack commands (ip, ifconfig, arp, route, netstat, ss, ping, nc, curl)
    if (bin === "ifconfig" || (bin === "ip" && (parts[1] === "a" || parts[1] === "addr" || !parts[1]))) {
      return { output: window.LabData.COMMANDS["ifconfig"], ok: true };
    }
    if ((bin === "ip" && parts[1] === "route") || bin === "route") {
      return { output: "default via 192.168.202.2 dev eth0 proto dhcp src 192.168.202.132 metric 100\n192.168.202.0/24 dev eth0 proto kernel scope link src 192.168.202.132 metric 100", ok: true };
    }
    if (bin === "arp" || bin === "arp-scan") {
      return {
        output: "? (192.168.202.136) at 00:0c:29:d4:e1:c3 [ether] on eth0\n? (192.168.202.137) at 00:0c:29:48:d1:30 [ether] on eth0",
        ok: true
      };
    }
    if (bin === "netstat" || bin === "ss") {
      return {
        output: "Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State\ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN",
        ok: true
      };
    }
    if (bin === "ping") {
      const target = parts[parts.length - 1];
      if (["192.168.202.132", "192.168.202.136", "192.168.202.137", "localhost", "127.0.0.1"].includes(target)) {
        return {
          output: `PING ${target} (${target}) 56(84) bytes of data.\n64 bytes from ${target}: icmp_seq=1 ttl=64 time=0.39 ms\n64 bytes from ${target}: icmp_seq=2 ttl=64 time=0.35 ms\n--- ${target} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss`,
          ok: true
        };
      }
      return { output: `PING ${target}: Destination Host Unreachable`, ok: false };
    }

    return null;
  }

  function parseNmap(cmd, lower) {
    if (lower.includes("--open") && lower.includes("-f")) {
      return { output: window.LabData.COMMANDS["sudo nmap -n -F --open 192.168.202.136"], ok: true };
    }
    if (lower.includes("packet-trace") && lower.includes("-ps80")) {
      return { output: window.LabData.COMMANDS["sudo nmap -sn -n -PS80 -D 192.168.202.50,192.168.202.60 --send-ip --packet-trace 192.168.202.136"], ok: true };
    }
    if (lower.includes("packet-trace")) {
      return { output: window.LabData.COMMANDS["sudo nmap -sn -n --send-ip --packet-trace 192.168.202.136"], ok: true };
    }
    if (lower.includes("http-headers")) {
      return { output: window.LabData.COMMANDS['sudo nmap -n -p 80 -sV --script "http-headers,http-title" 192.168.202.136'], ok: true };
    }
    if (lower.includes("http-enum") && !lower.includes("http-methods")) {
      return { output: window.LabData.COMMANDS["sudo nmap -n -p 80 --script http-enum 192.168.202.136"], ok: true };
    }
    if (lower.includes("banner") || lower.includes("ftp-syst")) {
      return { output: window.LabData.COMMANDS["nmap -sV -p 21,80 --script banner,ftp-syst,http-server-header 192.168.202.136 192.168.202.137"], ok: true };
    }
    if (lower.includes("ftp-anon")) {
      return { output: window.LabData.COMMANDS["nmap -p 21 --script ftp-anon 192.168.202.136"], ok: true };
    }
    if (lower.includes("http-enum") || lower.includes("http-methods")) {
      return { output: window.LabData.COMMANDS["nmap -p 80 --script http-enum,http-methods 192.168.202.136"], ok: true };
    }
    if (lower.includes("ms17-010") || (lower.includes("vuln") && cmd.includes("137"))) {
      return { output: window.LabData.COMMANDS["nmap -p445 --script smb-vuln-ms17-010 192.168.202.137"], ok: true };
    }
    if (cmd.includes("192.168.202.0/24") || lower.includes("-sn")) {
      return { output: window.LabData.COMMANDS["nmap -sn 192.168.202.0/24"], ok: true };
    }
    if (cmd.includes("192.168.202.137") && (lower.includes("21") || lower.includes("80"))) {
      return { output: "PORT   STATE    SERVICE\n21/tcp filtered ftp\n80/tcp filtered http", ok: true };
    }
    if (cmd.includes("192.168.202.136") && (lower.includes("21") || lower.includes("80"))) {
      return { output: "PORT   STATE SERVICE VERSION\n21/tcp open  ftp     vsftpd 3.0.5\n80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))", ok: true };
    }
    if (cmd.includes("192.168.202.137")) {
      return { output: window.LabData.COMMANDS["nmap -sV -p 139,445 192.168.202.137"], ok: true };
    }
    if (cmd.includes("192.168.202.136")) {
      return { output: window.LabData.COMMANDS["nmap -sV -p 139,445 192.168.202.136"], ok: true };
    }
    return {
      output: "Nmap 7.99 ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target specification}\nTargets in Lab: 192.168.202.0/24, 192.168.202.136 (Ubuntu), 192.168.202.137 (Win7)",
      ok: true
    };
  }

  function parseSmbTools(bin, cmd, lower) {
    if (bin === "enum4linux" && cmd.includes("192.168.202.136")) {
      return { output: window.LabData.COMMANDS["enum4linux -a 192.168.202.136"], ok: true };
    }
    if (bin === "smbmap" && cmd.includes("192.168.202.136")) {
      return {
        output: "[+] IP: 192.168.202.136:445\tName: ubuntu\n\tDisk                                                  \tPermissions\n\t----                                                  \t-----------\n\tpublic                                            \tREAD, WRITE\n\tIPC$                                              \tNO ACCESS",
        ok: true
      };
    }
    if ((bin === "crackmapexec" || bin === "nxc") && lower.includes("smb")) {
      return {
        output: "SMB         192.168.202.136 445    UBUNTU           [*] Unix - Samba 4 (name:UBUNTU) (domain:WORKGROUP)\nSMB         192.168.202.137 445    WIN7-PC          [*] Windows 7 Ultimate 7601 Service Pack 1 x86 (SMBv1:True)",
        ok: true
      };
    }
    if (bin === "smbclient") {
      if (lower.includes("-l") && cmd.includes("192.168.202.136")) {
        return { output: window.LabData.COMMANDS["smbclient -L 192.168.202.136 -N"], ok: true };
      }
      if (cmd.includes("192.168.202.136") && lower.includes("public")) {
        return { output: window.LabData.COMMANDS["smbclient //192.168.202.136/public -N"], ok: true, nextShell: "smb" };
      }
    }
    return null;
  }

  return { parseKaliCommand, addFile, resetFs };
})();

