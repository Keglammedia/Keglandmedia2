const BATCH = 4;
const AD_EVERY = 2;
const MAX_PHOTOS = 12;
let shown = 0;
let count = 0;
let adIndex = 0;
let POSTS = [];
let ADS = [];

const feed = document.getElementById("feed");
const sentinel = document.getElementById("sentinel");
const endMsg = document.getElementById("end");

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function makeSlider(p) {
  const extra = (p.more_photos || []).map(m => m.image);
  const photos = [p.image].concat(extra).filter(Boolean).slice(0, MAX_PHOTOS);

  const wrap = el("div", "pslider");
  const strip = el("div", "pstrip");
  photos.forEach(src => {
    const img = el("img");
    img.src = src;
    img.alt = p.title || "";
    img.loading = "lazy";
    strip.append(img);
  });
  wrap.append(strip);

  if (photos.length > 1) {
    const prev = el("button", "parrow prev", "\u2190");
    const next = el("button", "parrow next", "\u2192");
    prev.type = "button";
    next.type = "button";
    prev.setAttribute("aria-label", "Previous photo");
    next.setAttribute("aria-label", "Next photo");
    const counter = el("div", "pcount");

    function update() {
      const w = strip.clientWidth || 1;
      const i = Math.round(strip.scrollLeft / w);
      prev.disabled = i <= 0;
      next.disabled = i >= photos.length - 1;
      counter.textContent = (i + 1) + " / " + photos.length;
    }

    prev.addEventListener("click", () => strip.scrollBy({ left: -strip.clientWidth, behavior: "smooth" }));
    next.addEventListener("click", () => strip.scrollBy({ left: strip.clientWidth, behavior: "smooth" }));
    strip.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    wrap.append(prev, next, counter);
    update();
  }
  return wrap;
}

function makeCard(p) {
  const card = el("article", "card");

  const top = el("div", "card-top");
  top.append(el("span", "cat", p.category || ""), el("span", "date", p.date || ""));

  const actions = el("div", "actions");
  const like = el("button", "like", "\u2661");
  like.setAttribute("aria-label", "Like");
  like.addEventListener("click", () => {
    const on = like.classList.toggle("on");
    like.textContent = on ? "\u2665" : "\u2661";
  });
  actions.append(like);

  const body = el("div", "body");
  body.append(el("h2", "", p.title || ""), el("p", "", p.description || ""));
  if (p.credit) body.append(el("p", "credit", "Photo credit: " + p.credit));

  card.append(top, makeSlider(p), actions, body);
  return card;
}

function makeAd(a, extraClass) {
  const box = el("div", "ad" + (extraClass ? " " + extraClass : ""));
  box.append(el("div", "tag", "Advertisement"));
  let inner;
  if (a.link) {
    inner = el("a", "ad-link");
    inner.href = a.link;
    inner.target = "_blank";
    inner.rel = "noopener sponsored";
  } else {
    inner = el("div");
  }
  if (a.image) {
    const img = el("img");
    img.src = a.image;
    img.alt = a.title || "Advertisement";
    img.loading = "lazy";
    inner.append(img);
  }
  if (a.title) inner.append(el("h3", "", a.title));
  if (a.text) inner.append(el("p", "", a.text));
  box.append(inner);
  return box;
}

function renderLeft(s) {
  const holder = document.getElementById("leftBox");
  if (!holder) return;
  if (!s.left_title && !s.left_summary && !s.left_contact) {
    holder.hidden = true;
    return;
  }
  const box = el("div", "box");
  if (s.left_title) box.append(el("h3", "", s.left_title));
  if (s.left_summary) box.append(el("p", "pre", s.left_summary));
  if (s.left_contact) {
    box.append(el("h4", "", "Contact"));
    box.append(el("p", "pre", s.left_contact));
  }
  holder.append(box);
}

function loadMore() {
  POSTS.slice(shown, shown + BATCH).forEach(p => {
    feed.append(makeCard(p));
    count++;
    if (ADS.length && count % AD_EVERY === 0) {
      feed.append(makeAd(ADS[adIndex % ADS.length], "feed-ad"));
      adIndex++;
    }
  });
  shown += BATCH;
  if (shown >= POSTS.length) {
    observer.disconnect();
    endMsg.hidden = false;
  }
}

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadMore();
}, { rootMargin: "600px" });

function getJson(url, required) {
  return fetch(url, { cache: "no-store" })
    .then(r => {
      if (!r.ok) {
        if (required) throw new Error(url + " not found");
        return {};
      }
      return r.json();
    })
    .catch(err => {
      if (required) throw new Error(url + ": " + err.message);
      return {};
    });
}

Promise.all([getJson("posts.json", true), getJson("sidebar.json", false)])
  .then(([data, side]) => {
    POSTS = data.posts || [];
    ADS = side.ads || [];
    renderLeft(side);
    const col = document.getElementById("adsCol");
    if (col) {
      ADS.forEach(a => col.append(makeAd(a)));
      if (!ADS.length) col.hidden = true;
    }
    loadMore();
    observer.observe(sentinel);
  })
  .catch(err => {
    endMsg.textContent = "Could not load stories. Reason: " + err.message;
    endMsg.hidden = false;
  });
