let accounts = [];

// Tải accs.json
async function loadAccounts() {
  const res = await fetch('https://raw.githubusercontent.com/' + GITHUB_USERNAME + '/' + REPO_NAME + '/' + BRANCH + '/' + PATH_JSON);
  accounts = await res.json();
  renderTable();
}

loadAccounts();

// Tạo ID mới
function getNextId() {
  return accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
}

// Thêm acc mới
async function addAccount() {
  const level = document.getElementById('level').value.trim();
  const rank = document.getElementById('rank').value.trim();
  const imagesInput = document.getElementById('images');
  const links = Array.from(document.querySelectorAll('#linkCheckboxes input:checked')).map(i => i.value);

  if (!level || !rank || links.length !== 2 || imagesInput.files.length === 0) {
    alert("Vui lòng điền đầy đủ thông tin, chọn đúng 2 liên kết và ít nhất 1 ảnh.");
    return;
  }

  const id = getNextId();
  const imagePaths = [];

  for (let i = 0; i < imagesInput.files.length; i++) {
    const file = imagesInput.files[i];
    const path = `img/${id}/${i + 1}.jpg`;
    await uploadImageToGitHub(file, path);
    imagePaths.push(`img/${id}/${i + 1}.jpg`);
  }

  const acc = { id, level, rank, links, images: imagePaths, sold: false };
  accounts.push(acc);
  await updateAccountsFile();

  alert("Thêm acc thành công!");
  document.getElementById('level').value = "";
  document.getElementById('rank').value = "";
  document.getElementById('images').value = "";
  document.querySelectorAll('#linkCheckboxes input').forEach(i => i.checked = false);
  renderTable();
}

// Hiển thị bảng
function renderTable() {
  const tbody = document.querySelector("#accTable tbody");
  tbody.innerHTML = "";
  accounts.forEach(acc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${acc.id}</td>
      <td>${acc.level}</td>
      <td>${acc.rank}</td>
      <td>${acc.links.join(", ")}</td>
      <td>${acc.images.length} ảnh</td>
      <td>${acc.sold ? "Đã bán" : "Đang bán"}</td>
      <td>
        <button class="btn-secondary" onclick="toggleSold(${acc.id})">${acc.sold ? "↩ Mở bán lại" : "✅ Đã bán"}</button>
        <button class="btn-danger" onclick="deleteAcc(${acc.id})">Xoá</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Đánh dấu bán / mở bán
async function toggleSold(id) {
  const acc = accounts.find(a => a.id === id);
  acc.sold = !acc.sold;
  await updateAccountsFile();
  renderTable();
}

// Xoá acc
async function deleteAcc(id) {
  if (!confirm("Bạn có chắc muốn xoá acc này?")) return;
  accounts = accounts.filter(a => a.id !== id);
  await updateAccountsFile();
  renderTable();
}

// Upload ảnh lên GitHub
async function uploadImageToGitHub(file, path) {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = async () => {
      const content = reader.result.split(",")[1];
      const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${path}`;
      await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload ${path}`,
          content: content,
          branch: BRANCH
        })
      });
      resolve();
    };
    reader.readAsDataURL(file);
  });
}

// Cập nhật file accs.json
async function updateAccountsFile() {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PATH_JSON}`;
  const res = await fetch(url, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const data = await res.json();

  const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(accounts, null, 2))));
  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Cập nhật accs.json",
      content: newContent,
      sha: data.sha,
      branch: BRANCH
    })
  });
}
