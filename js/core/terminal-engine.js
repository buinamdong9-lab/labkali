window.TerminalEngine = (function () {
  let currentShell = "kali";
  let isTyping = false;
  let outputEl = null;
  let activeInputEl = null;
  let onStateChangeCallback = null;
  let onEnterCallback = null;
  let onHistoryNavCallback = null;

  function init(elements, callbacks) {
    outputEl = elements.outputEl;
    onStateChangeCallback = callbacks.onStateChange;
    onEnterCallback = callbacks.onEnter;
    onHistoryNavCallback = callbacks.onHistoryNav;

    outputEl.addEventListener("mouseup", () => {
      const sel = window.getSelection();
      if (!sel || sel.toString().length === 0) {
        focusInput();
      }
    });

    spawnPromptLine();
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatOutputHtml(rawText) {
    let html = escapeHtml(rawText);

    html = html.replace(
      /\b(192\.168\.202\.\d{1,3}(?:\/\d{1,2})?(?::\d+)?)\b/g,
      '<span class="hl-ip">$1</span>'
    );

    html = html.replace(
      /\b(VULNERABLE|CVE:CVE-2017-0143|HTB_FLAG:\s*[a-f0-9]+|Anonymous FTP login allowed)\b/g,
      '<span class="badge-vuln">$1</span>'
    );

    html = html.replace(
      /(\[\+\][^\n]*|SYSTEM session obtained!|NT AUTHORITY\\SYSTEM|nt authority\\system|Mapping: OK\s+Listing: OK\s+Writing: OK)/g,
      '<span class="hl-success">$1</span>'
    );

    html = html.replace(/(\[\*\])/g, '<span class="hl-warn">$1</span>');

    html = html.replace(
      /(Risk factor: HIGH|\[-\][^\n]*|\[!\][^\n]*|zsh: command not found[^\n]*|not recognized as an internal[^\n]*)/gi,
      '<span class="hl-error">$1</span>'
    );

    return html;
  }

  function buildPromptHtml() {
    if (currentShell === "kali") {
      return `
        <div class="kali-prompt-top">┌──(<span class="kali-userhost">kali㉿kali</span>)-[<span class="kali-path">~</span>]</div>
        <div class="kali-prompt-bottom">
          <span class="kali-bracket-bottom">└─</span><span class="kali-dollar">$</span>
          <span class="inline-input-wrapper"></span>
        </div>
      `;
    }

    let prefixHtml = "";
    if (currentShell === "smb") {
      prefixHtml = `<span class="subshell-prompt-prefix subshell-smb">smb: \\&gt;</span>`;
    } else if (currentShell === "ftp") {
      prefixHtml = `<span class="subshell-prompt-prefix subshell-smb">ftp&gt;</span>`;
    } else if (currentShell === "msf") {
      prefixHtml = `<span class="subshell-prompt-prefix"><span class="subshell-msf">msf6</span> &gt;</span>`;
    } else if (currentShell === "msf_exploit") {
      prefixHtml = `<span class="subshell-prompt-prefix"><span class="subshell-msf">msf6</span> exploit(<span class="subshell-exploit">windows/smb/ms17_010_psexec</span>) &gt;</span>`;
    } else if (currentShell === "msf_ssh_enum") {
      prefixHtml = `<span class="subshell-prompt-prefix"><span class="subshell-msf">msf6</span> auxiliary(<span class="subshell-exploit">scanner/ssh/ssh_enumusers</span>) &gt;</span>`;
    } else if (currentShell === "msf_ssh_pubkey") {
      prefixHtml = `<span class="subshell-prompt-prefix"><span class="subshell-msf">msf6</span> auxiliary(<span class="subshell-exploit">scanner/ssh/ssh_login_pubkey</span>) &gt;</span>`;
    } else if (currentShell === "ubuntu_ssh") {
      prefixHtml = `<span class="subshell-prompt-prefix" style="color: #4ade80; font-weight: 700;">vboxuser@ubuntu:~$</span>`;
    } else if (currentShell === "meterpreter") {
      prefixHtml = `<span class="subshell-prompt-prefix"><span class="subshell-msf">meterpreter</span> &gt;</span>`;
    } else if (currentShell === "cmd") {
      prefixHtml = `<span class="subshell-prompt-prefix">C:\\Windows\\system32&gt;</span>`;
    }

    return `
      <div class="kali-prompt-bottom">
        ${prefixHtml}
        <span class="inline-input-wrapper"></span>
      </div>
    `;
  }

  function spawnPromptLine() {
    if (!outputEl) return;

    const block = document.createElement("div");
    block.className = "kali-prompt-block";
    block.innerHTML = buildPromptHtml();

    const wrapper = block.querySelector(".inline-input-wrapper");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-cmd-input";
    input.autocomplete = "off";
    input.spellcheck = false;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (onEnterCallback) onEnterCallback(input.value);
      } else if (e.key === "Tab") {
        e.preventDefault();
        handleTabComplete(input);
      } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        resetTerminal();
      } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        freezeActivePrompt(input.value + "^C");
        spawnPromptLine();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        if (onHistoryNavCallback) onHistoryNavCallback(e.key, input);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        window.LabAudio.playKeyTick();
      }
    });

    wrapper.appendChild(input);
    outputEl.appendChild(block);
    activeInputEl = input;
    outputEl.scrollTop = outputEl.scrollHeight;
    focusInput();
  }

  function handleTabComplete(input) {
    const val = input.value;
    if (!val.trim()) return;
    const keys = Object.keys(window.LabData.COMMANDS);
    const match = keys.find((k) => k.toLowerCase().startsWith(val.toLowerCase()));
    if (match) {
      input.value = match;
      window.LabAudio.playKeyTick();
    }
  }

  function freezeActivePrompt(cmdText) {
    if (!activeInputEl) return;
    const wrapper = activeInputEl.parentElement;
    if (wrapper) {
      wrapper.innerHTML = `<span class="frozen-cmd-text">${escapeHtml(cmdText)}</span>`;
    }
    activeInputEl = null;
  }

  function detectTargetEffect(cmd) {
    if (!onStateChangeCallback) return;
    if (cmd.includes("192.168.202.0/24") || (cmd.includes("136") && cmd.includes("137"))) {
      onStateChangeCallback({ activeNode: "all" });
    } else if (cmd.includes("smb-vuln-ms17-010") || ((cmd === "exploit" || cmd === "run") && currentShell === "msf_exploit")) {
      onStateChangeCallback({ activeNode: "win7", compromised: "win7" });
    } else if (cmd.includes("get secret.txt") || cmd.includes("dashboard.php") || cmd.includes("sessions -i")) {
      onStateChangeCallback({ activeNode: "ubuntu", compromised: "ubuntu" });
    } else if (cmd.includes("192.168.202.137")) {
      onStateChangeCallback({ activeNode: "win7" });
    } else if (cmd.includes("192.168.202.136") || cmd === "ls" || cmd.includes("allowed.userlist") || currentShell.includes("ssh")) {
      onStateChangeCallback({ activeNode: "ubuntu" });
    }
  }

  function typeWriter(element, rawText, speed = 6) {
    return new Promise((resolve) => {
      isTyping = true;
      let idx = 0;
      const total = rawText.length;

      function step() {
        if (idx < total) {
          const chunk = total > 200 ? 5 : 3;
          idx = Math.min(total, idx + chunk);
          element.textContent = rawText.slice(0, idx);
          if (idx % 6 === 0) window.LabAudio.playKeyTick();
          outputEl.scrollTop = outputEl.scrollHeight;
          setTimeout(step, speed);
        } else {
          element.innerHTML = formatOutputHtml(rawText);
          outputEl.scrollTop = outputEl.scrollHeight;
          isTyping = false;
          resolve();
        }
      }
      step();
    });
  }

  async function handleCommand(rawCmd, speed = 6) {
    const cmd = rawCmd.trim();

    if (!activeInputEl) {
      spawnPromptLine();
    }

    if (!cmd) {
      freezeActivePrompt("");
      spawnPromptLine();
      return false;
    }

    if (cmd.toLowerCase() === "clear" || (cmd.toLowerCase() === "cls" && currentShell === "cmd")) {
      if (outputEl) outputEl.innerHTML = "";
      spawnPromptLine();
      return true;
    }

    freezeActivePrompt(cmd);

    const res = window.CommandResolver.resolve(cmd, currentShell);
    const output = res.output;

    if (res.ok) {
      detectTargetEffect(cmd);
    }

    if (res.ok && (output.includes("VULNERABLE") || output.includes("SYSTEM session obtained"))) {
      window.LabAudio.playAlertBeep("vuln");
    }

    if (output) {
      const respDiv = document.createElement("div");
      respDiv.className = "term-response";
      outputEl.appendChild(respDiv);
      await typeWriter(respDiv, output, speed);
    }

    if (res.nextShell) {
      currentShell = res.nextShell;
    }

    spawnPromptLine();
    return res.ok;
  }

  function ensureKaliShell() {
    if (currentShell !== "kali") {
      freezeActivePrompt("exit");
      currentShell = "kali";
      spawnPromptLine();
    }
  }

  function setInputValue(val) {
    if (!activeInputEl) spawnPromptLine();
    if (activeInputEl) {
      activeInputEl.value = val;
      outputEl.scrollTop = outputEl.scrollHeight;
    }
  }

  function focusInput() {
    if (activeInputEl && !activeInputEl.disabled) {
      activeInputEl.focus();
    }
  }

  function setInputDisabled(disabled) {
    if (activeInputEl) activeInputEl.disabled = disabled;
  }

  function resetTerminal() {
    currentShell = "kali";
    isTyping = false;
    if (window.CommandResolver) window.CommandResolver.resetState();
    if (outputEl) {
      outputEl.innerHTML = "";
    }
    spawnPromptLine();
  }

  function getPlainTextTranscript() {
    return outputEl ? outputEl.innerText : "";
  }

  return {
    init,
    handleCommand,
    ensureKaliShell,
    setInputValue,
    focusInput,
    setInputDisabled,
    resetTerminal,
    getPlainTextTranscript,
    isBusy: () => isTyping
  };
})();
