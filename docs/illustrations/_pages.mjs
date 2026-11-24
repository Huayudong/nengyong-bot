/**
 * Writes the illustration pages, one per picture and language (01-hero-zh.html, 01-hero-en.html, …), from the table
 * below. Crops are in the CSS px of the 1440×1080 shots from _scene.mjs (shots/<language>/), listed back to front;
 * a crop's `en` replaces its fields where the English text runs longer than the Chinese.
 *
 *   node docs/illustrations/_pages.mjs
 */

import { writeFileSync } from 'node:fs'

const PAGES = [
  {
    name: '01-hero',
    isTall: true,
    tint: 'violet',
    crops: [
      { shot: 'main', x: 64, y: 8, w: 282, h: 792, k: 0.8, left: 0, top: 22 },
      { shot: 'main', x: 364, y: 220, w: 724, h: 422, k: 0.8, left: 100, top: 250, en: { y: 147, h: 495, top: 200 } },
      {
        shot: 'main',
        x: 613,
        y: 11,
        w: 228,
        h: 32,
        k: 1.2,
        left: 300,
        top: 150,
        isPill: true,
        en: { x: 580, w: 292, left: 240, top: 110 },
      },
    ],
    zh: {
      eyebrow: 'Nengyong Bot',
      headline: '一群 Bot<br />各管一摊',
      lede: '主 Bot 接活、分派，其他 Bot 在后台把事做完，结论都回到聊天里。聊天记录和 Key 都存在你自己的电脑上。',
    },
    en: {
      eyebrow: 'Nengyong Bot',
      headline: 'Your own<br />team of bots',
      lede: 'The main bot takes your request and hands it out. The others work in the background and report back in the chat. Chats and keys stay on your computer.',
    },
  },
  {
    name: '02-tasks',
    tint: 'green',
    crops: [
      { shot: 'tasks', x: 64, y: 326, w: 592, h: 158, k: 0.95, left: 0, top: 120, en: { h: 174, top: 110 } },
      {
        shot: 'tasks',
        x: 590,
        y: 11,
        w: 273,
        h: 32,
        k: 1.2,
        left: 200,
        top: 52,
        isPill: true,
        en: { x: 540, w: 373, left: 120 },
      },
      { shot: 'tasks', x: 1114, y: 726, w: 316, h: 260, k: 1.1, left: 330, top: 270, en: { y: 746, top: 275 } },
    ],
    zh: {
      eyebrow: '后台任务 · 例行任务',
      headline: '交代完就去忙<br />做完回来汇报',
      lede: '要动手的事交给后台任务，每个任务有独立的上下文；到点的事按 cron 自动跑。侧边栏一眼看出谁在干活、谁没跑成。',
    },
    en: {
      eyebrow: 'Tasks · Routines',
      headline: 'Hand it off,<br />hear back later',
      lede: 'Work runs as background tasks, each with its own context. Scheduled work runs on cron. The sidebar shows who is busy and whose run failed.',
    },
  },
  {
    name: '03-flows',
    tint: 'blue',
    crops: [
      { shot: 'flows', x: 366, y: 324, w: 722, h: 148, k: 0.85, left: 0, top: 110, en: { h: 172, top: 95 } },
      { shot: 'flows', x: 1114, y: 532, w: 316, h: 272, k: 1.05, left: 340, top: 210, en: { h: 290, top: 238 } },
    ],
    zh: {
      eyebrow: '流程',
      headline: '教一次<br />以后照着做',
      lede: '一件事做成了、你点了头，Bot 就把做法存成流程：什么时候用、分几步、注意什么。后台任务和例行任务都能按流程来。',
    },
    en: {
      eyebrow: 'Flows',
      headline: 'Teach it once,<br />it sticks',
      lede: 'When a job goes right and you approve, the bot saves how it did it as a flow: when to use it, the steps, what to watch for. Tasks and routines can follow a flow.',
    },
  },
  {
    name: '04-mini-apps',
    tint: 'sky',
    crops: [
      { shot: 'mini-app', x: 366, y: 196, w: 452, h: 346, k: 0.9, left: 0, top: 150, en: { y: 110, h: 386, top: 130 } },
      { shot: 'mini-app', x: 981, y: 60, w: 375, h: 672, k: 0.8, left: 380, top: 31 },
    ],
    zh: {
      eyebrow: '小程序',
      headline: 'Bot 给你做<br />能点的小页面',
      lede: '后台任务把结果做成手机大小的页面，数据随任务更新。在页面里点一下，就替你给 Bot 发了消息。页面跑在沙箱里，不能联网。',
    },
    en: {
      eyebrow: 'Mini apps',
      headline: 'Pages your<br />bots build',
      lede: 'A task turns its results into a phone-sized page, and later runs refresh the data. Tapping in the page messages the bot for you. Pages run in a sandbox with no network.',
    },
  },
  {
    name: '05-badge',
    tint: 'peach',
    crops: [
      { shot: 'desk', x: 1114, y: 44, w: 316, h: 374, k: 1, left: 10, top: 120, rotate: -6 },
      { shot: 'main', x: 1114, y: 44, w: 316, h: 368, k: 1, left: 360, top: 110 },
    ],
    zh: {
      eyebrow: '工牌 · 工位',
      headline: '每个 Bot<br />都有个工位',
      lede: '工牌上写着入职天数、对话次数和流程数，等级随经验涨。刷一下工牌翻到背面，看 Bot 正在忙什么，没活时它会摸鱼。',
    },
    en: {
      eyebrow: 'Badge · Desk',
      headline: 'Every bot<br />gets a desk',
      lede: 'The badge shows days on the job, chats, flows and a level that grows with experience. Swipe it to see the desk: what the bot is working on, or how it slacks off when idle.',
    },
  },
]

for (const page of PAGES) {
  for (const lang of ['zh', 'en']) {
    writeFileSync(new URL(`${page.name}-${lang}.html`, import.meta.url), html(page, lang))
  }
}

function html(page, lang) {
  const { eyebrow, headline, lede } = page[lang]
  const shots = [...new Set(page.crops.map((crop) => crop.shot))]
  const shotVars = (theme) => shots.map((shot) => `--${shot}: url(shots/${lang}/${shot}-${theme}.png);`).join(' ')
  return `<!doctype html>
<html lang="${lang === 'zh' ? 'zh-CN' : 'en'}">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="base.css" />
    <style>
      :root { --shot-w: 1440px; --shot-h: 1080px; ${shotVars('light')} }
      @media (prefers-color-scheme: dark) { :root { ${shotVars('dark')} } }
      ${page.crops.map((crop, index) => cropStyle({ ...crop, ...(lang === 'en' && crop.en) }, index)).join('\n      ')}
    </style>
  </head>
  <body>
    <div id="canvas" class="${page.isTall ? 'tall' : ''}" data-tint="${page.tint}">
      <div class="copy">
        <span class="eyebrow">${eyebrow}</span>
        <h2 class="headline">${headline}</h2>
        <p class="lede">${lede}</p>
      </div>
      <div class="stage">
        ${page.crops.map((_, index) => `<div class="crop c${index}"></div>`).join('\n        ')}
      </div>
    </div>
  </body>
</html>
`
}

function cropStyle(crop, index) {
  const shape = crop.isPill ? 'border-radius: 999px;' : ''
  const turn = crop.rotate ? `transform: rotate(${crop.rotate}deg);` : ''
  return `.c${index} { --shot: var(--${crop.shot}); --x: ${crop.x}px; --y: ${crop.y}px; --w: ${crop.w}px; --h: ${crop.h}px; --k: ${crop.k}; left: ${crop.left}px; top: ${crop.top}px; ${shape} ${turn} }`
}
