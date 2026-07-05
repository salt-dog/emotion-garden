const app = document.getElementById("app");
var MATERIALS_DATA=[{c:'职场与学业',t:'电影《当幸福来敲门》',q:'别让任何人告诉你你成不了才，即使是我也不行。如果你有梦想的话，就要去捍卫它。',r:'肯定用户为了理想付出心血的认真极其珍贵；剥离权威的绝对定义权，将导师/老板的严苛降维成他个人的局限，而不是对用户人身价值的宣判。'},{c:'存在与意义',t:'毛姆《月亮与六便士》',q:'满地都是六便士，他却抬头看到了月亮。',r:'重新拉高格局，告诉用户咱们现在做的事情、挨的累，是为了去摸我们自己的「月亮」，而不是为了让那些只看得到六便士的人给我们打满分，别为他们伤了元气。'},{c:'精神内耗',t:'史铁生《我与地坛》',q:'每一个瞬间都有它的意义，而未来的事情其实根本无须执念。',r:'用极其平稳、松弛的宇宙视角，把用户眼前的「天大事情」缩小。告诉她世界很大，犯不上为了眼前这一个小卡点把自己当前的精气神全耗光了，陪她一起把紧绷的劲儿松下来。'},{c:'亲密与孤独',t:'电影《楚门的世界》',q:'如果再也见不到你，那祝你下午好，晚上好，早安。',r:'不用宏大的哲理，承认没人能随时随地接住我们的客观常态。但巧妙地把孤独翻译成「独享的自由」，引导用户将注意力收回到自己身上，自顾自地把日子过得有声有色。'},{c:'生活高光与小确幸',t:'新裤子乐队《我们的时代》',q:'这是我们的时代，没有人能阻挡我们。那些所有热烈的、疯狂的梦，都在闪闪发光。',r:'绝不翻旧账、绝不脑补过去的辛苦。化身头号铁杆粉丝，用最热烈、最纯粹的能量陪用户一起高频共振，肯定她现在的实力，并把焦点锁在接下来的庆祝和快乐加倍上。'},{c:'职场与学业',t:'岸见一郎/古贺史健《被讨厌的勇气》',q:'你不是为了满足别人的期待而活着。',r:'把导师/老板的评判从「上帝视角」降格为一个普通人的主观意见——他有他的局限，你有你的路。你的认真和努力不需要靠别人的打分来证明，它们在你心里早就有了自己的分量。'},{c:'职场与学业',t:'电影《死亡诗社》',q:'你们必须努力寻找自己的声音。因为你越迟开始找，找到的可能性就越小。',r:'不鼓动用户掀桌子辞职退学，而是帮ta看见——即使在既定轨道里，每一个选择仍然可以是ta自己做主的一小步。别人的剧本和你自己的台词是可以分开的，现在开始找就来得及。'},{c:'职场与学业',t:'电影《阿甘正传》',q:'你得丢开以往的事，才能不断继续前进。',r:'不去粉饰那次失败有多疼——疼是真实的。但告诉用户，你现在觉得过不去，是因为你正在经历它。阿甘从来不是靠聪明赢的，他就是一直往前跑。你现在也只需要迈开下一步，跑着跑着就离它远了。'},{c:'职场与学业',t:'《哈利·波特与密室》邓布利多',q:'决定我们成为什么样人的，不是我们的能力，而是我们的选择。',r:'帮用户松绑——能力不是定死的，今天觉得自己不够格不代表永远不够格。关键是你敢不敢为自己选一次。那个敢于做出选择的你，本身就比昨天的你更接近自己想成为的人。'},{c:'职场与学业',t:'电影《三傻大闹宝莱坞》',q:'追求卓越，成功就会在不经意间追上你。',r:'这句话不是让你更卷——是让你换一个方向跑。分数和KPI跑得比你快，追它们你会累死。但你追你想要的那个卓越的自己，追着追着，那些当初觉得天大的指标自己就变小了。'},{c:'职场与学业',t:'曾国藩',q:'莫问收获，但问耕耘。',r:'你现在流的每一滴汗都不是凭空蒸发的——它们在你看不见的土壤下面扎根。收获这件事有它自己的节奏，不会因为你焦虑就提前到账。你只管把今天的地耕好，秋天的事交给秋天。'},{c:'职场与学业',t:'罗永浩',q:'我不是为了输赢，我就是认真。',r:'学历和出身是你简历的第一行，不是你人生的最后一页。你用「认真」这两个字打出来的每一拳，都比那些靠光环站着的人更有重量。咱们不比起点，比谁更把这件事当回事。'},{c:'职场与学业',t:'电影《垫底辣妹》',q:'世界上最大的谎言就是你不行。',r:'那些说你不行的人，不是因为他们真的知道你的上限——他们连自己的上限都不了解。你心里那点不甘心不是倔强，是你对自己最诚实的判断。把它点上，让它烧起来，烧给所有人看。'},{c:'存在与意义',t:'电影《心灵奇旅》',q:'火花不是人生目标，当你想要生活的那一刻，火花就已经被点燃。',r:'不是每个人都有一件「我这辈子就是要做这个」的事，这太正常了。火花不是你还没找到的那个答案，它是你今天想吃一碗好面、想看一片好看的云的那个瞬间。你早就有了。'},{c:'存在与意义',t:'加缪《西西弗神话》',q:'应当想象西西弗是幸福的。',r:'推石头这件事本身不是意义——意义是你推石头的姿势。你可以咬牙切齿地推，也可以哼着歌推。加缪说西西弗是幸福的，因为他在自己的劳动里找到了属于自己的节奏。你的每一天也配得上你自己的节奏。'},{c:'存在与意义',t:'电影《肖申克的救赎》',q:'有些鸟是注定不会被关在笼子里的。',r:'你现在感觉被困住，恰恰是因为你的羽翼还在——真正被驯服的人不会有这种难受。这份不舒服不是你的弱点，是你心里有一片更大天空的证据。现在飞不出去没关系，先在心里把地图画好。'},{c:'存在与意义',t:'王小波《黄金时代》',q:'我觉得自己会永远生猛下去，什么也锤不了我。',r:'二十一岁的你觉得自己什么也锤不了，现在的你觉得被锤了——但那个「生猛」的核其实还在。它只是换了一种方式存在：不再是不知天高地厚的莽撞，而是明知山有虎、还往前走一步的从容。'},{c:'存在与意义',t:'电影《海上钢琴师》',q:'琴键有始有终，你确切知道八十八个键就在那儿。',r:'一九零零不下船，不是因为胆小，是因为他太知道自己要什么了。你不用什么都要——八十八个键已经足够弹出一首好曲子。你手里的选择其实够了，不用再去羡慕陆地上那些无限的可能。'},{c:'存在与意义',t:'电影《飞屋环游记》',q:'冒险就在那里。',r:'冒险不一定要飞到南美洲——你今天换一条路回家、尝试一个新菜谱、和一个陌生人说一句话，都是冒险。生活没把你困住，是它把冒险伪装成了日常琐事，等你去发现。'},{c:'存在与意义',t:'木心《文学回忆录》',q:'生活的最佳状态是冷冷清清的风风火火。',r:'木心这辈子表面冷冷清清，心里却风风火火过了一辈子。谁说普通是不好的？你的普通里面也有你独有的风火——你对某件事的认真、你对某个人的温柔、你深夜不睡在想的那件事。那都是你的传奇。'},{c:'亲密与孤独',t:'电影《这个杀手不太冷》莱昂',q:'你让我尝到了人生的滋味。',r:'莱昂一个人喝牛奶、熨衣服、照顾盆栽，他以为那就是他的全部——直到玛蒂尔达让他知道，他也是可以被人在乎的。你现在觉得「没人在乎」，可能只是在乎你的那个人还没出现。在那之前，你先替那个人好好在乎你自己。'},{c:'亲密与孤独',t:'《小王子》圣埃克苏佩里',q:'正是你为你的玫瑰付出的时间，才使你的玫瑰变得如此重要。',r:'你付出的那些时间——凌晨的修改、深夜的陪伴、反反复复的解释——它们没有消失，它们都长成了你心里的玫瑰。就算那个人没看到，你的玫瑰已经在你心里开好了。那是你独有的花园，谁也拿不走。'},{c:'亲密与孤独',t:'村上春树《挪威的森林》',q:'哪里会有人喜欢孤独，不过是不喜欢失望罢了。',r:'你不是不喜欢人，你是被之前那些失望吓到了。这没什么丢人的——每一个社恐的人心里都有一张柔软的底牌，只是需要一点安全感才翻得开。你可以慢慢来，不用对所有人敞开，先对你觉得安全的那一个人。'},{c:'亲密与孤独',t:'张爱玲',q:'因为懂得，所以慈悲。',r:'你之所以自责，恰恰说明你真的在乎这段关系——这本身就很珍贵。但「慈悲」不只是对别人，也是对自己的。你先慈悲地看看那个已经尽力了的自己，然后再去看对方，你会发现事情可能没那么糟。'},{c:'亲密与孤独',t:'电影《怦然心动》',q:'总有一天，你会遇到一个如彩虹般绚丽的人。',r:'这句话不是在让你等那个「彩虹」——它是在提醒你，你得先成为你自己世界里那个如彩虹般绚丽的人。当你有了自己的颜色，别人的颜色才不会把你淹没，而是和你一起变成更美的光谱。'},{c:'亲密与孤独',t:'电影《一代宗师》',q:'世间所有的相遇，都是久别重逢。',r:'把「失去」从终点变成逗号——你遇到的人不是随便出现的，每一段相遇都有它的来意。即使分开，也不是「没了」，是这段缘分暂时完成了它的任务。你带着它给你的东西，去赴下一次重逢就好。'},{c:'精神内耗',t:'电影《海边的曼彻斯特》',q:'我走不出来。',r:'不是所有事都需要「走出来」——有些人、有些事就是会跟你一辈子，这不是你的失败。你可以带着它往前走，它不是你背上的包袱，是你身上多出来的一层皮肤。允许自己不好起来，有时候比强迫自己好起来更需要勇气。'},{c:'精神内耗',t:'庄子',q:'知其不可奈何而安之若命。',r:'庄子不是让你躺平——他是让你把能量用在刀刃上。那些你控制不了的事——导师的心情、面试官的眼缘、明天的天气——放它们走。你只管你手里能做的事，剩下的交给世界自己去运转。'},{c:'精神内耗',t:'电影《心灵捕手》',q:'这不是你的错。',r:'这句话之所以经典，是因为它敲在了每个人心里最柔软的地方。你觉得自己不配、觉得自己搞砸了一切——但那些不是你一个人的错。成长环境、过去的经历、那些你没得选的事——先把这份自我谴责放下来，这不是你的错。'},{c:'精神内耗',t:'是枝裕和《步履不停》',q:'人生路上步履不停，为何总是慢一拍。',r:'慢一拍不意味着错过——你只是在走你自己的步调，而你的步调里有别人没有的沉稳和感受力。那些你觉得「晚了」的事，可能只是还没有到你出场的时间。快的人不一定先到，慢的人看过的风景更多。'},{c:'精神内耗',t:'李娟《我的阿勒泰》',q:'世界就在手边，躺倒就是睡眠。',r:'李娟笔下的日子告诉我们——生活可以很简单，简单到「世界就在手边，躺倒就是睡眠」。你现在觉得累，不是因为你不够努力，是因为你太久没有允许自己只是「存在着」而不是「追赶着」。今天先停一下，躺倒，睡一觉。没什么比这更重要。'},{c:'精神内耗',t:'苏轼',q:'回首向来萧瑟处，归去，也无风雨也无晴。',r:'苏轼这辈子被贬了多少次？每一次他都觉得「这次完了」。但他走过去了，回头一看，当年那些天大的风雨，不过是记忆里一阵微凉的风。你现在觉得过不去，是因为你还在雨里。没事的，往前走两步，雨会停的。'},{c:'精神内耗',t:'洛莉·戈特利布《也许你该找个人聊聊》',q:'痛苦没有高低之分。',r:'你觉得自己的烦恼「不值一提」——失恋的人觉得没资格比失去亲人的人难过，挂科的人觉得没资格比失业的人焦虑。但痛苦不是比赛，你的伤心在你身体里的重量，和任何人的都一样重。说出来，它就轻了一半。'},{c:'生活高光与小确幸',t:'五月天《倔强》',q:'我和我最后的倔强，握紧双手绝对不放。',r:'不翻旧账、不回顾辛苦——就现在，这一刻，你是你人生战场上最闪耀的那个人。你的倔强配得上所有的掌声，咱们就站在这儿，大大方方地为自己的胜利骄傲一回。今晚必须庆祝。'},{c:'生活高光与小确幸',t:'村上春树',q:'如果没有小确幸，人生只不过是干巴巴的沙漠而已。',r:'你今天发现的那件小事——那口好吃的、那片好看的云、那只歪头看你的猫——它就是你的小确幸。村上春树说没有它们人生就是沙漠。你今天给自己的沙漠浇了一瓢水，这事本身就值得开心。'},{c:'生活高光与小确幸',t:'汪曾祺《人间草木》',q:'一定要爱着点什么，恰似草木对光阴的钟情。',r:'你不需要拯救世界才配开心——你今天认真做的这顿饭、收拾好的这个角落，就是你和光阴之间最体己的交情。汪曾祺说草木尚且对光阴有深情，你对这一天的认真，当然也值得被大大方方地肯定。'},{c:'生活高光与小确幸',t:'周杰伦《晴天》',q:'从前从前，有个人爱你很久。',r:'不为别的，就为这一刻——风吹得很轻，歌放得刚好，你的心情突然很亮。不用分析为什么，不用去想之后要干嘛。就停在这一秒，感受它。这阵风吹过来的时候，整个宇宙都在跟你说：今天其实挺好的。'}];function pickRandomMaterials(n){var s=MATERIALS_DATA.slice();for(var i=s.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=s[i];s[i]=s[j];s[j]=t}return s.slice(0,n)}

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

var FLOWER_IMAGES=[ASSETS.lilyCardFlower,ASSETS.plant.flower,ASSETS.plant.bud,ASSETS.plant.seed,ASSETS.plant.pot,ASSETS.plant.water];
function pickFlowerImg(id){return FLOWER_IMAGES[Math.abs(id.split('').reduce(function(a,c){return a+c.charCodeAt(0)},0))%FLOWER_IMAGES.length]}

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

      <div class="progress-bar" id="progressBar">
        <div class="progress-step" id="progStep1"><span class="step-icon">🌱</span><span class="step-label">倾诉</span></div>
        <div class="progress-line"></div>
        <div class="progress-step" id="progStep2"><span class="step-icon">🌿</span><span class="step-label">生长</span></div>
        <div class="progress-line"></div>
        <div class="progress-step" id="progStep3"><span class="step-icon">🌸</span><span class="step-label" id="progLabel3">开花</span></div>
      </div>
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
  var c = state.messageCount;
  var list = ['嗯，你提到' + text.slice(0, 15) + '…我听到了。还有吗？你可以继续说，我在这儿。', '这种感觉不轻松。谢谢你愿意说出来。', '嗯，我明白了。这件事听上去确实让人不好受。'];
  var grow = ['这部分开始有轮廓了。我听到的不只是事情本身。', '能感受到这件事在你心里慢慢长出了形状。', '你说得很清楚，这些情绪已经有了自己的形状。'];
  var ready = ['到这里，这朵花已经有了自己的形状。你可以继续补充，也可以把它整理成花。', '我能感觉到这朵花已经准备好绽放了。整理成花的按钮就在那里。'];
  var pool = c <= 1 ? list : c <= 2 ? grow : ready;
  var s = c <= 1 ? 'seed' : c <= 2 ? 'bud' : state.stage === 'bud' ? 'water' : 'bud';
  var canB = c >= 2;
  return { reply: pool[Math.floor(Math.random() * pool.length)], stage: s, flowStatus: canB ? 'ready_to_bloom' : 'chatting', canBloom: canB };
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
  var msgs = state.messages.filter(function(m) { return m.role === 'user'; }).map(function(m) { return m.content; });
  var last = msgs[msgs.length - 1] || '我想把这段感受先安放在这里。';
  var picks = pickRandomMaterials(3);
  return {
    title: '被好好接住的一次倾诉',
    dialogueSummary: summarizeConversation(msgs),
    userOneSentence: last.slice(0, 80),
    flowerAsset: pickFlowerImg(last),
    recommendations: picks.map(function(m) { return { title: m.t, reason: m.r, url: '' }; })
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
    flowerAsset: recommendationDraft.flowerAsset || pickFlowerImg(recommendationDraft.id || 'm_'+Date.now()),
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

function updateProgressBar() {
  var s = interaction.stage;
  var canBloom = interaction.canBloom && interaction.flowStatus !== "flower";
  var isFlower = interaction.flowStatus === "flower";
  var s1 = document.getElementById("progStep1");
  var s2 = document.getElementById("progStep2");
  var s3 = document.getElementById("progStep3");
  var l3 = document.getElementById("progLabel3");
  if (!s1||!s2||!s3) return;
  s1.className = "progress-step active";
  if (s === "pot" || s === "seed") { s2.className = "progress-step dim"; s3.className = "progress-step dim"; if (l3) l3.textContent = "开花"; }
  else if (s === "bud" || s === "water") { s2.className = "progress-step active"; s3.className = "progress-step dim"; if (l3) l3.textContent = "开花"; }
  if (canBloom) { s2.className = "progress-step active"; s3.className = "progress-step highlight"; if (l3) l3.textContent = "可开花！"; }
  if (isFlower) { s2.className = "progress-step dim"; s3.className = "progress-step done"; if (l3) l3.textContent = "已开花"; }
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
