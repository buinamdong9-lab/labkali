window.ThmTasks = (function () {
  const solvedTasks = new Set();

  function buildTaskQaHtml(sc) {
    if (!sc.question) return "";
    return `
      <div class="thm-qa-box" data-task="${sc.id}">
        <div class="thm-question">🚩 ${sc.question}</div>
        <div class="thm-input-row">
          <input
            type="text"
            class="thm-ans-input"
            id="ans-${sc.id}"
            placeholder="${sc.placeholder || "Answer..."}"
            autocomplete="off"
          />
          <button class="btn btn-thm-submit" data-submit="${sc.id}">Submit</button>
          <button class="btn btn-thm-hint" data-hint="${sc.id}" title="Xem gợi ý">💡</button>
        </div>
        <div class="thm-feedback hidden" id="fb-${sc.id}"></div>
      </div>
    `;
  }

  function handleContainerClick(e, onProgressUpdate) {
    const submitBtn = e.target.closest(".btn-thm-submit");
    if (submitBtn) {
      checkAnswer(submitBtn.getAttribute("data-submit"), onProgressUpdate);
      return true;
    }
    const hintBtn = e.target.closest(".btn-thm-hint");
    if (hintBtn) {
      showHint(hintBtn.getAttribute("data-hint"));
      return true;
    }
    return false;
  }

  function handleContainerKeydown(e, onProgressUpdate) {
    if (e.key === "Enter" && e.target.classList.contains("thm-ans-input")) {
      const box = e.target.closest(".thm-qa-box");
      if (box) checkAnswer(box.getAttribute("data-task"), onProgressUpdate);
    }
  }

  function checkAnswer(taskId, onProgressUpdate) {
    const sc = window.LabData.SCENARIOS[taskId];
    const input = document.getElementById(`ans-${taskId}`);
    const fb = document.getElementById(`fb-${taskId}`);
    const card = document.getElementById(`card-${taskId}`);
    if (!sc || !input || !fb) return;

    const val = input.value.trim().toLowerCase();
    const isCorrect = sc.answers.some((a) => a.toLowerCase() === val);

    fb.classList.remove("hidden", "thm-hint-text", "thm-wrong", "thm-correct");
    if (isCorrect) {
      solvedTasks.add(taskId);
      fb.classList.add("thm-correct");
      fb.textContent = "✓ Correct Answer! Đã hoàn thành Task.";
      input.disabled = true;
      if (card) card.classList.add("task-solved");
      window.LabAudio.playAlertBeep("info");
      if (onProgressUpdate) {
        onProgressUpdate(solvedTasks.size, Object.keys(window.LabData.SCENARIOS).length);
      }
    } else {
      fb.classList.add("thm-wrong");
      fb.textContent = "✕ Chưa chính xác. Hãy kiểm tra lại kết quả hoặc bấm 💡.";
    }
  }

  function showHint(taskId) {
    const sc = window.LabData.SCENARIOS[taskId];
    const fb = document.getElementById(`fb-${taskId}`);
    if (!sc || !fb) return;

    fb.classList.remove("hidden", "thm-wrong", "thm-correct");
    fb.classList.add("thm-hint-text");
    fb.textContent = `💡 Hint: ${sc.hint}`;
  }

  function resetAll() {
    solvedTasks.clear();
    document.querySelectorAll(".thm-ans-input").forEach((inp) => {
      inp.value = "";
      inp.disabled = false;
    });
    document.querySelectorAll(".thm-feedback").forEach((fb) => {
      fb.className = "thm-feedback hidden";
      fb.textContent = "";
    });
    document.querySelectorAll(".scenario-card.task-solved").forEach((c) => {
      c.classList.remove("task-solved");
    });
  }

  return { buildTaskQaHtml, handleContainerClick, handleContainerKeydown, resetAll };
})();
