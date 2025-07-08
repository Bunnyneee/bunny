// admin-script.js hoàn chỉnh

// ⚙️ Cấu hình (lấy từ config.js)
const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  "Content-Type": "application/json"
};

let accounts = [];

// 📥 Tải danh sách acc từ GitHub
async function loadAccounts() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PATH_JSON}?ref=${BRANCH}`);
    const data = await res.json();
    const content = atob(data.content);
    accounts = JSON.parse(content);
    renderAccounts();
  } catch (err) {
    console.error("❌ Lỗi tải accs.json:", err);
  }
}

// 💾 Lưu accs mới lên GitHub
async function saveAccountsToGitHub() {
  const getShaRes = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PATH_JSON}?ref=${BRANCH}`, {
    headers
  });
  const getShaData = await getShaRes.json();
  const sha = getShaData.sha;

  const updatedContent = btoa(JSON.stringify(accounts, null, 2));

  const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${PATH_JSON}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "Update accs.json",
      content: updatedContent,
      branch: BRANCH,
      sha
    })
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("❌ Lỗi lưu JSON:", err);
    alert("Không thể lưu dữ liệu lên GitHub.");
  }
}

// 🖼️ Upload ảnh lên GitHub
async function uploadImageToGitHub(file, accId, index) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      const base64Content = reader.result.split(",")[1];
      const path = `${IMG_FOLDER}/${accId}/${index + 1}.jpg`;

      const getRes = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`, { headers });
      const getData = await getRes.json();
      const oldSha = getData?.sha;

      await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${path}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: "Upload image",
          content: base64Content,
          branch: BRANCH,
          ...(oldSha ? { sha: oldSha } : {})
        })
      });
      resolve(path);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ➕ Thêm acc mới
async function addAccount() {
  const level = document.getElementById("level").value.trim();
  const rank = document.getElementById("rank").value.trim();
  const checkboxes = document.querySelectorAll("#linkCheckboxes input[type=checkbox]:checked");
  const files = selectedImages;

  if (!level || !rank || checkboxes.length !== 2 || files.length === 0) {
    alert("Vui lòng nhập đầy đủ thông tin và chọn đúng 2 liên kết cùng ít nhất 1 ảnh.");
    return;
  }

  const links = Array.from(checkboxes).map(cb => cb.value);
  const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
  const imgPaths = [];

  for (let i = 0; i < files.length; i++) {
    const path = await uploadImageToGitHub(files[i], newId, i);
    imgPaths.push(path);
  }

  const newAcc = {
    id: newId,
    level,
    rank,
    links,
    images: imgPaths,
    sold: false
  };

  accounts.push(newAcc);
  await saveAccountsToGitHub();
  selectedImages = [];
  alert("✅ Đã thêm acc mới!");
  renderAccounts();
}

// 🧹 Xoá acc
async function deleteAcc(id) {
  if (!confirm("Bạn có chắc muốn xoá acc này?")) return;
  accounts = accounts.filter(acc => acc.id !== id);
  await saveAccountsToGitHub();
  renderAccounts();
}

// ✏️ Đánh dấu đã bán
async function toggleSold(id) {
  const acc = accounts.find(a => a.id === id);
  acc.sold = !acc.sold;
  await saveAccountsToGitHub();
  renderAccounts();
}

// 🖼️ Hiển thị danh sách acc
function renderAccounts() {
  const tbody = document.querySelector("#accTable tbody");
  tbody.innerHTML = "";
  for (const acc of accounts) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.id}</td>
      <td>${acc.level}</td>
      <td>${acc.rank}</td>
      <td>${acc.links.join(", ")}</td>
      <td>${acc.images.length} ảnh</td>
      <td>${acc.sold ? "<span style='color:red'>Đã bán</span>" : "Đang bán"}</td>
      <td>
        <button onclick="toggleSold(${acc.id})" class="btn-secondary">${acc.sold ? "Bỏ đánh dấu" : "Đánh dấu đã bán"}</button>
        <button onclick="deleteAcc(${acc.id})" class="btn-danger">Xoá</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// 🧠 Quản lý ảnh chọn nhiều lần
let selectedImages = [];
document.getElementById("images").addEventListener("change", function (e) {
  const files = Array.from(e.target.files);
  if (selectedImages.length + files.length > 20) {
    alert("Tối đa chỉ được 20 ảnh!");
    return;
  }
  selectedImages.push(...files);
  e.target.value = "";
});

// 🚀 Bắt đầu
loadAccounts();
