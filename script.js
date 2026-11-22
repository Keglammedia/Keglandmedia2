const BATCH = 4;
let shown = 0;
let POSTS = [];

const feed = document.getElementById("feed");
const sentinel = document.getElementById("sentinel");
const endMsg = document.getElementById("end");

function makeCard(p) {
  const card = document.createElement("article");
  card.className = "card";

  const top = document.createElement("div");
  top.className = "card-top";
  const cat = document.createElement("span");
  cat.className = "cat";
  cat.textContent = p.category || "";
  const date = document.createElement("span");
  date.className = "date";
  date.textContent = p.date || "";
  top.append(cat, date);

  const img = document.createElement("img");
  img.src = p.image;
  img.alt = p.title || "";
  img.loading = "lazy";

  const actions = document.createElement("div");
  actions.className = "actions";
  const like = document.createElement("button");
  like.className = "like";
  like.textContent = "\u2661";
  like.setAttribute("aria-label", "Like");
  like.addEventListener("click", () => {
    const on = like.classList.toggle("on");
    like.textContent = on ? "\u2665" : "\u2661";
  });
  actions.append(like);

  const body = document.createElement("div");
  body.className = "body";
  const h2 = document.createElement("h2");
  h2.textContent = p.title || "";
  const desc = document.createElement("p");
  desc.textContent = p.description || "";
  body.append(h2, desc);
   if (p.credit) {
    const credit = document.createElement("p");
    credit.className = "credit";
    credit.textContent = "Photo credit: " + p.credit;
    body.append(credit);
  }
  }

  card.append(top, img, actions, body);
  return card;
}

function loadMore() {
  POSTS.slice(shown, shown + BATCH).forEach(p => feed.append(makeCard(p)));
  shown += BATCH;
  if (shown >= POSTS.length) {
    observer.disconnect();
    endMsg.hidden = false;
  }
}

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) loadMore();
}, { rootMargin: "600px" });

fetch("posts.json", { cache: "no-store" })
  .then(r => r.json())
  .then(data => {
    POSTS = data.posts || [];
    loadMore();
    observer.observe(sentinel);
  });
  