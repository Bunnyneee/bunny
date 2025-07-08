let accData = [];
let currentTab = "dangban";

// Load dữ liệu từ accs.json
fetch('accs.json')
  .then(res => res.json())
  .then(data => {
    accData = data;
    renderAccs();
  });

// Tab sự kiện
document.getElementById("tab-dangban").addEventListener("click", () => {
  currentTab = "dangban";
  switchTab("tab-dangban");
  renderAccs();
});

document.getElementById("tab-daban").addEventListener("click", () => {
  currentTab = "daban";
  switchTab("tab-daban");
  renderAccs();
});

function switchTab(activeId) {
  document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}

// Lọc liên kết
document.getElementById("filterType").addEventListener("change", renderAccs);

// Hiển thị danh sách acc
function renderAccs() {
  const filter = document.getElementById("filterType").value;
  const container = document.getElementById("accList");
  container.innerHTML = "";

  accData.forEach(acc => {
    if ((currentTab === "dangban" && acc.sold) || (currentTab === "daban" && !acc.sold)) return;
    if (filter !== "all" && !acc.links.includes(filter)) return;

    const card = document.createElement("div");
    card.className = "acc-card";
    card.onclick = () => openPopup(acc);

    if (acc.sold) {
      const soldBadge = document.createElement("div");
      soldBadge.className = "sold-badge";
      soldBadge.innerText = "Đã bán";
      card.appendChild(soldBadge);
    }

    const img = document.createElement("img");
    img.src = acc.images[0] || "";
    card.appendChild(img);

    const content = document.createElement("div");
    content.className = "acc-content";

    const title = document.createElement("h3");
    title.innerText = `Acc #${acc.id}`;
    content.appendChild(title);

    const level = document.createElement("p");
    level.innerText = `Level: ${acc.level}`;
    content.appendChild(level);

    const rank = document.createElement("p");
    rank.innerText = `Rank: ${acc.rank}`;
    content.appendChild(rank);

    const links = document.createElement("p");
    acc.links.forEach(link => {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.innerText = link;
      links.appendChild(badge);
    });
    content.appendChild(links);

    card.appendChild(content);
    container.appendChild(card);
  });
}

// Popup chi tiết acc
function openPopup(acc) {
  document.getElementById("popupLevel").innerText = acc.level;
  document.getElementById("popupRank").innerText = acc.rank;
  const linkContainer = document.getElementById("popupLinks");
  linkContainer.innerHTML = "";
  acc.links.forEach(link => {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.innerText = link;
    linkContainer.appendChild(badge);
  });

  const carousel = document.getElementById("carousel");
  carousel.innerHTML = "";
  acc.images.forEach(imgUrl => {
    const img = document.createElement("img");
    img.src = imgUrl;
    img.onclick = () => showBigImage(imgUrl);
    carousel.appendChild(img);
  });

  document.getElementById("accDetailPopup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("accDetailPopup").classList.add("hidden");
}

// Hiện ảnh to
function showBigImage(url) {
  const popup = document.getElementById("imagePopup");
  const popupImg = document.getElementById("popupImg");
  popupImg.src = url;
  popup.style.display = "flex";
}
