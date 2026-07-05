const app = document.getElementById("app");

// ---------- API ----------
const API_BASE = window.location.origin;

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `请求失败 (${res.status})`);
  }
  return res.json();
}

const ASSETS = {
  homeBg: "./assets/home/greenhouse-bg.webp",
  homeShelf: (count) => `./assets/home/shelf-state-${Math.min(count, 3)}.webp`,
  memoryBg: "./assets/memory/memory-shelf-bg.webp",
  lilyCardFlower: "./assets/memory/lily-card-flower.webp",
  workbenchBg: "./assets/interaction/workbench-bg.webp",
  plant: {
    pot: "./assets/interaction/pot.webp",
    seed: "./assets/interaction/seed.webp",
    bud: "./assets/interaction/bud.webp",
    water: "./assets/interaction/water.webp",
    flower: "./assets/interaction/flower-lily.webp"
  }
};

const STORAGE_KEY = "garden_healing_demo_v2_memories";

let interaction = null;
let activeMemoryId = null;
let detailCardFlipped = false;
let recommendationDraft = null;

function navigate(page) {
  window.location.hash = page;
}

function currentPage() {
  return window.location.hash.replace("#", "") || "home";
}

window.addEventListener("hashchange", renderPage);
renderPage();

function renderPage() {
  const page = currentPage();
  closeTransientState();

  if (page === "home") renderHomePage();
  else if (page === "memory") renderMemoryPage();
  else if (page === "interaction") renderInteractionPage();
  else navigate("home");
}

function closeTransientState() {
  activeMemoryId = null;
  detailCardFlipped = false;
  recommendationDraft = null;
}

function getMemories() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (error) {
    console.warn("读取记忆失败，已重置。", error);
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function setMemories(memories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
}

function addMemory(memory) {
  const memories = getMemories();
  memories.unshift(memory);
  setMemories(memories);
}

function clearMemories() {
  if (!confirm("确认清空本地记忆吗？这个操作只影响当前浏览器里的 demo 数据。")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderPage();
}

/* Home */
function renderHomePage() {
  const memories = getMemories();
  const count = memories.length;

  app.innerHTML = `
    <main class="page home-page">
      <img loading="lazy" class="home-bg" src="${ASSETS.homeBg}" alt="温室主页背景" />
      <img loading="lazy" class="home-shelf-layer" src="${ASSETS.homeShelf(count)}" alt="花架状态" />

      <button class="hotspot shelf-hotspot" onclick="navigate('memory')" aria-label="进入记忆区" title="进入记忆区"></button>
      <button class="hotspot table-hotspot" onclick="startInteraction()" aria-label="进入交互区" title="进入交互区"></button>

      <div class="home-title">情绪花园</div>
      <div class="home-tip">点击左侧花架进入记忆区，点击右侧园艺台进入交互区</div>
      <div class="home-memory-count">已安放的花：${count} 朵</div>
    </main>
  `;
}

function startInteraction() {
  // Try API first; fall back to local mock if backend is unavailable
  createSessionViaApi().catch(() => {
    interaction = createNewInteraction();
    navigate("interaction");
  });
}

async function createSessionViaApi() {
  const data = await apiPost("/api/sessions");
  interaction = {
    id: data.sessionId,
    messageCount: 0,
    stage: "pot",
    flowStatus: "chatting",
    canBloom: false,
    messages: [data.message]
  };
  navigate("interaction");
}

/* Memory */
function renderMemoryPage() {
  const memories = getMemories();

  app.innerHTML = `
    <main class="page memory-page">
      <img loading="lazy" class="memory-bg" src="${ASSETS.memoryBg}" alt="记忆花架背景" />
      <div class="page-topbar">
        <button class="back-btn" onclick="navigate('home')">返回温室</button>
        <button class="secondary-btn" onclick="clearMemories()">清空本地记忆</button>
      </div>
      <div class="memory-page-title">记忆花架</div>

      ${memories.length === 0 ? `
        <div class="empty-memory-text">这里还没有被安放的花。完成一次交互后，它会出现在这里。</div>
      ` : `
        <section class="memory-flower-layer">
          ${memories.map(memory => `
            <button class="memory-flower-item" onclick="openMemoryDetail('${escapeAttr(memory.id)}')">
              <img src="${memory.flowerAsset}" alt="${escapeAttr(memory.title)}" />
              <span>${escapeHtml(memory.title)}</span>
            </button>
          `).join("")}
        </section>
      `}
    </main>
  `;
}

function openMemoryDetail(id) {
  activeMemoryId = id;
  detailCardFlipped = false;
  renderMemoryDetailModal();
}

function renderMemoryDetailModal() {
  const memory = getMemories().find(item => String(item.id) === String(activeMemoryId));
  if (!memory) return;

  const modal = document.createElement("div");
  modal.className = "modal-mask";
  modal.innerHTML = `
    <section class="modal">
      <button class="modal-close" onclick="closeModal()"></button>
      <div class="memory-detail-layout">
        <div>
          <img loading="lazy" class="memory-detail-flower" src="${memory.flowerAsset}" alt="有贺卡的百合花" />
          <p class="card-hint">点击右侧卡片，可以查看正反两面。</p>
        </div>
        <div>
          <div class="flip-card ${detailCardFlipped ? "flipped" : ""}" onclick="flipMemoryCard()">
            <div class="flip-card-inner">
              <article class="flip-card-front">
                <h2>${escapeHtml(memory.title)}</h2>
                <h3>对话总结</h3>
                <p>${escapeHtml(memory.dialogueSummary)}</p>
                <h3>用户的一句话总结</h3>
                <p>${escapeHtml(memory.userOneSentence)}</p>
                <p class="card-hint">当前为贺卡正面，点击翻到推荐作品。</p>
              </article>
              <article class="flip-card-back">
                <h2>推荐作品</h2>
                ${(memory.recommendations || []).map(item => `
                  <div class="recommendation-card">
                    <h4>${escapeHtml(item.title)}</h4>
                    <p>${escapeHtml(item.reason)}</p>
                    <a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">查看链接</a>
                  </div>
                `).join("")}
                <p class="card-hint">当前为贺卡背面，点击翻回对话总结。</p>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  document.body.appendChild(modal);
}

function flipMemoryCard() {
  detailCardFlipped = !detailCardFlipped;
  closeModal();
  renderMemoryDetailModal();
}

function closeModal() {
  const mask = document.querySelector(".modal-mask");
  if (mask) mask.remove();
}

/* Interaction */
function createNewInteraction() {
  return {
    id: `s_${Date.now()}`,
    messageCount: 0,
    stage: "pot",
    flowStatus: "chatting",
    canBloom: false,
    messages: [
      {
        role: "ai",
        content: "这里是一只空花盆。可以先把最近的烦恼放在这里，我会慢慢听你展开。"
      }
    ]
  };
}

function ensureInteraction() {
  if (!interaction) interaction = createNewInteraction();
}

function renderInteractionPage() {
  ensureInteraction();

  app.innerHTML = `
    <main class="page interaction-page">
      <img
        id="interactionStageBg"
        class="workbench-bg interaction-stage-bg"
        src="${ASSETS.plant[interaction.stage]}"
        alt="当前交互阶段背景"
      />

      <div class="page-topbar">
        <button class="back-btn" onclick="confirmLeaveInteraction()">返回温室</button>
      </div>

      <section class="dialog-box">
        <div id="chatList" class="chat-list">
          ${interaction.messages.map(msg => `
            <div class="message ${msg.role === "user" ? "user" : "ai"}">${escapeHtml(msg.role === "user" ? `你：${msg.content}` : `AI：${msg.content}`)}</div>
          `).join("")}
        </div>
        <div class="input-row">
          <input
            id="userInput"
            placeholder="继续说说这里发生了什么"
            onkeydown="handleInputKeydown(event)"
            ${interaction.flowStatus === "flower" ? "disabled" : ""}
          />
          <button
            class="primary-btn"
            onclick="sendMessage()"
            ${interaction.flowStatus === "flower" ? "disabled" : ""}
          >发送</button>
          ${interaction.canBloom && interaction.flowStatus !== "flower" ? `
            <button
              class="bloom-inline-btn"
              onclick="bloomInteraction()"
              title="这朵花已经有了轮廓。你可以继续补充，也可以先把这次整理成一朵花。开花后会出现推荐作品卡片。"
            >整理成花</button>
          ` : ""}
        </div>
      </section>
    </main>
  `;

  scrollChatToBottom();
}

function confirmLeaveInteraction() {
  if (interaction && interaction.messages.length > 1) {
    const ok = confirm("当前这轮交互还没有整理成花。确认返回温室吗？");
    if (!ok) return;
  }
  interaction = null;
  navigate("home");
}

function handleInputKeydown(event) {
  if (event.key === "Enter") sendMessage();
}

async function sendMessage() {
  ensureInteraction();

  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text || interaction.flowStatus === "flower") return;

  // Optimistic UI
  interaction.messages.push({ role: "user", content: text });
  interaction.messageCount += 1;
  input.value = "";
  renderInteractionPage();

  // Try API; fall back to mock
  try {
    const data = await apiPost(`/api/sessions/${interaction.id}/chat`, { content: text });
    interaction.messages.push({ role: "ai", content: data.reply });
    interaction.stage = data.plantStage.key;
    interaction.canBloom = data.canBloom;
    if (data.canBloom && interaction.flowStatus !== "flower") {
      interaction.flowStatus = "ready_to_bloom";
    }
    renderInteractionPage();
    switchPlantStage(data.plantStage.key);
  } catch (err) {
    console.warn("API 不可用，使用本地 mock:", err);
    const response = mockAssistantResponse(text, interaction);
    interaction.messages.push({ role: "ai", content: response.reply });
    interaction.stage = response.stage;
    interaction.flowStatus = response.flowStatus;
    interaction.canBloom = response.canBloom;
    renderInteractionPage();
  }
}

function mockAssistantResponse(text, state) {
  const count = state.messageCount;
  let stage = "bud";
  let reply = "我听到了。你可以继续往下说，也可以等它慢慢形成一朵花。";
  let canBloom = count >= 2;

  if (count === 1) {
    stage = "seed";
    reply = "像是先把一颗种子放进土里了。可以再展开一点吗？这件事最先让你感到压力的部分是什么？";
    canBloom = false;
  } else if (count === 2) {
    stage = "bud";
    reply = "这部分开始有轮廓了。我听到的不只是事情本身，还有你在里面承受的紧绷感。你可以继续补充，也可以稍后把它整理成花。";
  } else {
    stage = state.stage === "bud" ? "water" : "bud";
    const replies = [
      "我会把这部分也放进这次记忆里。它像是在给花苞浇水，不急着结束，你还可以继续说。",
      "这朵花还没有被强行定型。你刚刚补充的部分，让它更接近你真实的处境。",
      "我理解这里还有一层感受：你不只是想解决事情，也想被看见、被理解。"
    ];
    reply = replies[(count - 3) % replies.length];
  }

  return {
    reply,
    stage,
    flowStatus: canBloom ? "ready_to_bloom" : "chatting",
    canBloom
  };
}

function switchPlantStage(stage) {
  const image = document.getElementById("interactionStageBg");
  if (!image) return;
  image.classList.add("switching");
  setTimeout(() => {
    image.src = ASSETS.plant[stage];
    image.classList.remove("switching");
  }, 180);
}

function scrollChatToBottom() {
  const chat = document.getElementById("chatList");
  if (chat) chat.scrollTop = chat.scrollHeight;
}

async function bloomInteraction() {
  ensureInteraction();
  interaction.stage = "flower";
  interaction.flowStatus = "flower";
  interaction.canBloom = false;
  interaction.messages.push({ role: "ai", content: "这次整理已经开花了。我会给你几张共鸣作品卡片，等你看完后，再把它送回花架。" });

  renderInteractionPage();

  // Try API; fall back to mock
  try {
    const data = await apiPost(`/api/sessions/${interaction.id}/bloom`);
    recommendationDraft = data.memory;
  } catch (err) {
    console.warn("API 不可用，使用本地 mock 生成推荐:", err);
    recommendationDraft = buildRecommendationDraft(interaction);
  }
  renderRecommendationModal();
}

function buildRecommendationDraft(state) {
  const userMessages = state.messages.filter(msg => msg.role === "user").map(msg => msg.content);
  const lastUserSentence = userMessages[userMessages.length - 1] || "我想把这段感受先安放在这里。";

  return {
    title: "被压力慢慢托住的一次整理",
    dialogueSummary: summarizeConversation(userMessages),
    userOneSentence: lastUserSentence.slice(0, 80),
    flowerAsset: ASSETS.lilyCardFlower,
    recommendations: [
      {
        title: "《海街日记》片段：安静生活中的缓慢修复",
        reason: "适合承接那种不想被快速说服，只想先被温柔放一会儿的状态。",
        url: "https://example.com/recommendation-1"
      },
      {
        title: "一段关于整理混乱心事的散文",
        reason: "它的节奏比较慢，更像是在陪人把很多缠在一起的感受一根一根理开。",
        url: "https://example.com/recommendation-2"
      }
    ]
  };
}

function summarizeConversation(userMessages) {
  if (userMessages.length === 0) return "用户还没有留下足够多的信息。";
  const joined = userMessages.join("；");
  return `这次对话中，用户提到：${joined.slice(0, 170)}${joined.length > 170 ? "" : ""}`;
}

function renderRecommendationModal() {
  if (!recommendationDraft) return;

  const modal = document.createElement("div");
  modal.className = "modal-mask";
  modal.innerHTML = `
    <section class="modal">
      <h2>推荐作品卡片</h2>
      <p>下面是这次开花后生成的共鸣推荐。这里是本地 demo 的占位内容，后续可以替换为后端检索结果。</p>

      <div class="recommendation-list">
        ${(recommendationDraft.recommendations || []).map(item => `
          <article class="recommendation-card">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.reason)}</p>
            ${item.url ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">打开作品链接</a>` : ""}
          </article>
        `).join("")}
      </div>

      <h3>给这朵花写一句话</h3>
      <textarea id="oneSentenceInput" class="summary-input">${escapeHtml(recommendationDraft.userOneSentence)}</textarea>

      <div class="modal-actions">
        <button class="secondary-btn" onclick="closeModal()">先留在这里</button>
        <button class="primary-btn" onclick="completeInteraction()">我看完了，把花送回花架</button>
      </div>
    </section>
  `;

  document.body.appendChild(modal);
}

function completeInteraction() {
  if (!recommendationDraft) return;

  const input = document.getElementById("oneSentenceInput");
  const userOneSentence = input && input.value.trim()
    ? input.value.trim()
    : recommendationDraft.userOneSentence;

  const memory = {
    id: recommendationDraft.id || `m_${Date.now()}`,
    title: recommendationDraft.title,
    dialogueSummary: recommendationDraft.dialogueSummary,
    userOneSentence,
    flowerType: "lily",
    flowerAsset: recommendationDraft.flowerAsset || ASSETS.lilyCardFlower,
    recommendations: (recommendationDraft.recommendations || []).map(r => ({
      title: r.title,
      reason: r.reason,
      url: r.url || ""
    })),
    createdAt: recommendationDraft.createdAt || new Date().toISOString()
  };

  addMemory(memory);
  // Also sync memory to server (fire-and-forget)
  if (interaction && interaction.id) {
    apiPost(`/api/sessions/${interaction.id}/complete`, { memory }).catch(() => {});
  }
  closeModal();
  interaction = null;
  recommendationDraft = null;
  navigate("home");
}

function updateProgressBar() {
  var s = interaction.stage;
  var canBloom = interaction.canBloom && interaction.flowStatus !== "flower";
  var isFlower = interaction.flowStatus === "flower";

  var step1 = document.getElementById("progStep1");
  var step2 = document.getElementById("progStep2");
  var step3 = document.getElementById("progStep3");
  var label3 = document.getElementById("progLabel3");
  if (!step1 || !step2 || !step3) return;

  step1.className = "progress-step active";

  if (s === "pot" || s === "seed") {
    step2.className = "progress-step dim";
    step3.className = "progress-step dim";
    if (label3) label3.textContent = "开花";
  } else if (s === "bud" || s === "water") {
    step2.className = "progress-step active";
    step3.className = "progress-step dim";
    if (label3) label3.textContent = "开花";
  }

  if (canBloom) {
    step2.className = "progress-step active";
    step3.className = "progress-step highlight";
    if (label3) label3.textContent = "可开花！";
  }

  if (isFlower) {
    step2.className = "progress-step dim";
    step3.className = "progress-step done";
    if (label3) label3.textContent = "已开花";
  }
}

function updateProgressBar() {
  var s = interaction.stage;
  var canBloom = interaction.canBloom && interaction.flowStatus !== "flower";
  var isFlower = interaction.flowStatus === "flower";
  var step1 = document.getElementById("progStep1");
  var step2 = document.getElementById("progStep2");
  var step3 = document.getElementById("progStep3");
  var label3 = document.getElementById("progLabel3");
  if (!step1 || !step2 || !step3) return;
  step1.className = "progress-step active";
  if (s === "pot" || s === "seed") {
    step2.className = "progress-step dim";
    step3.className = "progress-step dim";
    if (label3) label3.textContent = "\u5f00\u82b1";
  } else if (s === "bud" || s === "water") {
    step2.className = "progress-step active";
    step3.className = "progress-step dim";
    if (label3) label3.textContent = "\u5f00\u82b1";
  }
  if (canBloom) {
    step2.className = "progress-step active";
    step3.className = "progress-step highlight";
    if (label3) label3.textContent = "\u53ef\u5f00\u82b1\uff01";
  }
  if (isFlower) {
    step2.className = "progress-step dim";
    step3.className = "progress-step done";
    if (label3) label3.textContent = "\u5df2\u5f00\u82b1";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
