(function () {
  let isRunningScenario = false;
  let abortController = { aborted: false };
  const cmdHistory = [];
  let historyIndex = -1;

  const els = {};

  function cacheElements() {
    els.scenarioList = document.getElementById("scenarioList");
    els.outputEl = document.getElementById("terminalOutput");
    els.btnAutoDemo = document.getElementById("btnAutoDemo");
    els.btnReset = document.getElementById("btnReset");
    els.btnCopy = document.getElementById("btnCopy");
    els.btnSound = document.getElementById("btnSound");
    els.btnInfo = document.getElementById("btnInfo");
    els.btnCloseModal = document.getElementById("btnCloseModal");
    els.infoModal = document.getElementById("infoModal");
    els.statusText = document.getElementById("statusText");
    els.progressFill = document.getElementById("progressFill");
    els.progressPercent = document.getElementById("progressPercent");
    els.nodeUbuntu = document.getElementById("node-ubuntu");
    els.nodeWin7 = document.getElementById("node-win7");
    els.badgeUbuntu = document.getElementById("badge-ubuntu");
    els.badgeWin7 = document.getElementById("badge-win7");
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function updateStatus(text, percent = null) {
    if (els.statusText) els.statusText.textContent = text;
    if (percent !== null && els.progressFill && els.progressPercent) {
      const clamped = Math.max(0, Math.min(100, Math.round(percent)));
      els.progressFill.style.width = clamped + "%";
      els.progressPercent.textContent = clamped + "%";
    }
  }

  function updateTopologyUI(state) {
    els.nodeUbuntu.classList.remove("active-target");
    els.nodeWin7.classList.remove("active-target");

    if (state.activeNode === "all" || state.activeNode === "both") {
      els.nodeUbuntu.classList.add("active-target");
      els.nodeWin7.classList.add("active-target");
    } else if (state.activeNode === "ubuntu") {
      els.nodeUbuntu.classList.add("active-target");
    } else if (state.activeNode === "win7") {
      els.nodeWin7.classList.add("active-target");
    }

    if (state.compromised === "ubuntu") {
      els.nodeUbuntu.classList.add("compromised");
      els.badgeUbuntu.textContent = "PWNED (SMB)";
      els.badgeUbuntu.style.color = "#f87171";
    }
    if (state.compromised === "win7") {
      els.nodeWin7.classList.add("compromised");
      els.badgeWin7.textContent = "SYSTEM SHELL";
      els.badgeWin7.style.color = "#f87171";
    }
  }

  function resetTopologyUI() {
    els.nodeUbuntu.className = "node-item";
    els.nodeWin7.className = "node-item";
    els.badgeUbuntu.textContent = "Target 2";
    els.badgeUbuntu.style.color = "";
    els.badgeWin7.textContent = "Target 1";
    els.badgeWin7.style.color = "";
    document.querySelectorAll(".cmd-chip.executed").forEach((el) => {
      el.classList.remove("executed");
    });
    document.querySelectorAll(".scenario-card.active").forEach((el) => {
      el.classList.remove("active");
    });
    if (window.ThmTasks) window.ThmTasks.resetAll();
  }

  function renderSidebar() {
    const scenarios = window.LabData.SCENARIOS;
    els.scenarioList.innerHTML = "";

    Object.values(scenarios).forEach((sc) => {
      const card = document.createElement("div");
      card.className = "scenario-card";
      card.id = `card-${sc.id}`;

      const chipsHtml = sc.commands
        .map(
          (cmd) =>
            `<button class="cmd-chip" data-cmd="${cmd.replace(/"/g, "&quot;")}" title="Click để gõ và chạy lệnh trên Terminal">$ ${cmd}</button>`
        )
        .join("");

      const qaHtml = window.ThmTasks ? window.ThmTasks.buildTaskQaHtml(sc) : "";

      card.innerHTML = `
        <div class="scenario-header">
          <span class="scenario-title">${sc.name}</span>
          <button class="btn btn-demo-sc" data-scenario="${sc.id}">▶ Chạy</button>
        </div>
        <div class="scenario-desc">${sc.description}</div>
        <div class="cmd-chip-list">${chipsHtml}</div>
        ${qaHtml}
      `;
      els.scenarioList.appendChild(card);
    });

    const onTaskSolved = (solved, total) => {
      updateStatus(`🚩 TryHackMe Progress: ${solved}/${total} Tasks Solved`, Math.round((solved / total) * 100));
    };

    els.scenarioList.addEventListener("keydown", (e) => {
      if (window.ThmTasks) window.ThmTasks.handleContainerKeydown(e, onTaskSolved);
    });

    els.scenarioList.addEventListener("click", async (e) => {
      if (window.ThmTasks && window.ThmTasks.handleContainerClick(e, onTaskSolved)) {
        return;
      }

      const chip = e.target.closest(".cmd-chip");
      if (chip && !isRunningScenario && !window.TerminalEngine.isBusy()) {
        const cmd = chip.getAttribute("data-cmd");
        await simulateTypingInInput(cmd);
        await handleUserEnter(cmd);
        return;
      }

      const demoBtn = e.target.closest(".btn-demo-sc");
      if (demoBtn && !isRunningScenario) {
        const scId = demoBtn.getAttribute("data-scenario");
        await runScenario(scId);
      }
    });
  }

  async function simulateTypingInInput(text) {
    window.TerminalEngine.setInputValue("");
    for (let i = 1; i <= text.length; i++) {
      if (abortController.aborted) return;
      window.TerminalEngine.setInputValue(text.slice(0, i));
      if (i % 2 === 0) window.LabAudio.playKeyTick();
      await sleep(18);
    }
  }

  async function handleUserEnter(rawText) {
    if (window.TerminalEngine.isBusy()) return;
    const trimmed = rawText.trim();
    if (trimmed) {
      cmdHistory.push(trimmed);
      historyIndex = cmdHistory.length;
      updateStatus(`Đang thực thi: ${trimmed}`, 60);
    }
    const ok = await window.TerminalEngine.handleCommand(rawText);
    if (trimmed) {
      if (ok) {
        markChipExecuted(trimmed);
        updateStatus(`Hoàn tất: ${trimmed}`, 100);
      } else {
        updateStatus(`Chưa đủ điều kiện / Lệnh không hợp lệ`, 0);
      }
    }
  }

  function handleHistoryNavigation(key, inputEl) {
    if (key === "ArrowUp") {
      if (historyIndex > 0) {
        historyIndex--;
        inputEl.value = cmdHistory[historyIndex];
      }
    } else if (key === "ArrowDown") {
      if (historyIndex < cmdHistory.length - 1) {
        historyIndex++;
        inputEl.value = cmdHistory[historyIndex];
      } else {
        historyIndex = cmdHistory.length;
        inputEl.value = "";
      }
    }
  }

  async function runScenario(scenarioId, isPartOfFullDemo = false) {
    const sc = window.LabData.SCENARIOS[scenarioId];
    if (!sc) return;

    if (!isPartOfFullDemo) {
      isRunningScenario = true;
      abortController = { aborted: false };
      setControlsDisabled(true);
    }

    window.TerminalEngine.ensureKaliShell();

    document.querySelectorAll(".scenario-card").forEach((c) => c.classList.remove("active"));
    const activeCard = document.getElementById(`card-${scenarioId}`);
    if (activeCard) activeCard.classList.add("active");

    const total = sc.commands.length;
    for (let i = 0; i < total; i++) {
      if (abortController.aborted) break;
      const cmd = sc.commands[i];
      const pct = Math.round(((i + 1) / total) * 100);
      updateStatus(`${sc.name} (${i + 1}/${total})`, pct);

      await simulateTypingInInput(cmd);
      if (abortController.aborted) break;

      markChipExecuted(cmd);
      await window.TerminalEngine.handleCommand(cmd);

      if (i < total - 1 && !abortController.aborted) {
        await sleep(1500);
      }
    }

    if (!isPartOfFullDemo) {
      updateStatus(`Hoàn thành: ${sc.name}`, 100);
      isRunningScenario = false;
      setControlsDisabled(false);
    }
  }

  async function runAllScenarios() {
    if (isRunningScenario) return;
    isRunningScenario = true;
    abortController = { aborted: false };
    setControlsDisabled(true);

    window.TerminalEngine.resetTerminal();
    resetTopologyUI();

    const keys = Object.keys(window.LabData.SCENARIOS);
    for (let i = 0; i < keys.length; i++) {
      if (abortController.aborted) break;
      await runScenario(keys[i], true);
      if (i < keys.length - 1 && !abortController.aborted) {
        await sleep(1500);
      }
    }

    if (!abortController.aborted) {
      updateStatus("Hoàn tất toàn bộ 4 kịch bản", 100);
    }
    isRunningScenario = false;
    setControlsDisabled(false);
  }

  function markChipExecuted(cmd) {
    document.querySelectorAll(".cmd-chip").forEach((chip) => {
      if (chip.getAttribute("data-cmd") === cmd) {
        chip.classList.add("executed");
      }
    });
  }

  function setControlsDisabled(disabled) {
    els.btnAutoDemo.disabled = disabled;
    window.TerminalEngine.setInputDisabled(disabled);
    document.querySelectorAll(".btn-demo-sc").forEach((b) => (b.disabled = disabled));
  }

  function bindEvents() {
    els.btnAutoDemo.addEventListener("click", runAllScenarios);

    els.btnReset.addEventListener("click", () => {
      abortController.aborted = true;
      isRunningScenario = false;
      setControlsDisabled(false);
      window.TerminalEngine.resetTerminal();
      resetTopologyUI();
      updateStatus("Terminal Ready", 0);
    });

    els.btnCopy.addEventListener("click", async () => {
      const text = window.TerminalEngine.getPlainTextTranscript();
      try {
        await navigator.clipboard.writeText(text);
        const orig = els.btnCopy.textContent;
        els.btnCopy.textContent = "✓ Copied";
        setTimeout(() => (els.btnCopy.textContent = orig), 1500);
      } catch (_) {}
    });

    els.btnSound.addEventListener("click", () => {
      const on = window.LabAudio.toggle();
      els.btnSound.textContent = on ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    });

    els.btnInfo.addEventListener("click", () => els.infoModal.classList.remove("hidden"));
    els.btnCloseModal.addEventListener("click", () => els.infoModal.classList.add("hidden"));
    els.infoModal.addEventListener("click", (e) => {
      if (e.target === els.infoModal) els.infoModal.classList.add("hidden");
    });

    const menuView = document.getElementById("menuView");
    if (menuView) {
      menuView.addEventListener("click", () => {
        document.querySelector(".main-layout").classList.toggle("sidebar-hidden");
        window.TerminalEngine.focusInput();
      });
    }
    const menuSession = document.getElementById("menuSession");
    if (menuSession) menuSession.addEventListener("click", () => els.btnReset.click());
    const menuActions = document.getElementById("menuActions");
    if (menuActions) menuActions.addEventListener("click", () => els.btnAutoDemo.click());
    const menuEdit = document.getElementById("menuEdit");
    if (menuEdit) menuEdit.addEventListener("click", () => els.btnCopy.click());
    const menuHelp = document.getElementById("menuHelp");
    if (menuHelp) menuHelp.addEventListener("click", () => handleUserEnter("help"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    cacheElements();
    renderSidebar();
    window.TerminalEngine.init(
      { outputEl: els.outputEl },
      {
        onStateChange: updateTopologyUI,
        onEnter: handleUserEnter,
        onHistoryNav: handleHistoryNavigation
      }
    );
    bindEvents();
  });
})();
