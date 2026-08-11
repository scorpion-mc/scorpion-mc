// ===== ADMIN PANEL JS =====

// Auth check
if (sessionStorage.getItem('scorpion_admin') !== 'true') {
  window.location.href = 'giris.html';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('scorpion_admin');
  window.location.href = 'giris.html';
});

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(btn.dataset.tab + 'Tab').style.display = 'block';
  });
});

// Lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
lightbox.addEventListener('click', () => lightbox.classList.remove('active'));

function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.classList.add('active');
}

// Format date
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Build application card HTML
function buildCard(key, app, showActions) {
  const statusBadge = app.status === 'approved'
    ? '<span class="status-badge status-approved">✅ Onaylandı</span>'
    : app.status === 'rejected'
    ? '<span class="status-badge status-rejected">❌ Reddedildi</span>'
    : '';

  const actions = showActions ? `
    <div class="app-card-actions">
      <button class="btn-success" onclick="updateStatus('${key}', 'approved')">✅ ONAYLA</button>
      <button class="btn-danger" onclick="updateStatus('${key}', 'rejected')">❌ REDDET</button>
    </div>
  ` : `<div style="margin-top:8px;">${statusBadge}</div>`;

  const screenshotHtml = app.screenshot
    ? `<div class="app-card-image"><img src="${app.screenshot}" alt="Ekran Görüntüsü" onclick="openLightbox(this.src)"></div>`
    : '';

  const noteHtml = app.notes
    ? `<div class="app-card-note"><strong>Not</strong>${app.notes}</div>`
    : '';

  return `
    <div class="app-card">
      <div class="app-card-header">
        <div class="app-card-name">${app.icName}</div>
        <div class="app-card-date">${formatDate(app.createdAt)}</div>
      </div>
      <div class="app-card-fields">
        <div class="app-field"><label>IC İsim</label><span>${app.icName}</span></div>
        <div class="app-field"><label>OOC İsim</label><span>${app.oocName}</span></div>
        <div class="app-field"><label>FiveM Tecrübe</label><span>${app.fivemYears} yıl</span></div>
        <div class="app-field"><label>Discord</label><span>${app.discordName}</span></div>
      </div>
      ${noteHtml}
      ${screenshotHtml}
      ${actions}
    </div>
  `;
}

// Empty state
function emptyState(text) {
  return `<div class="empty-state"><div class="empty-state-icon">📭</div><p>${text}</p></div>`;
}

// Load applications from Firebase (realtime)
function loadApplications() {
  database.ref('applications').on('value', (snapshot) => {
    const data = snapshot.val() || {};
    const pending = [], approved = [], rejected = [];

    Object.entries(data).forEach(([key, app]) => {
      if (app.status === 'approved') approved.push({ key, ...app });
      else if (app.status === 'rejected') rejected.push({ key, ...app });
      else pending.push({ key, ...app });
    });

    // Sort by timestamp descending
    const sortFn = (a, b) => (b.timestamp || 0) - (a.timestamp || 0);
    pending.sort(sortFn);
    approved.sort(sortFn);
    rejected.sort(sortFn);

    // Update counts
    document.getElementById('pendingCount').textContent = pending.length;
    document.getElementById('approvedCount').textContent = approved.length;
    document.getElementById('rejectedCount').textContent = rejected.length;

    // Render
    const pendingGrid = document.getElementById('pendingGrid');
    const approvedGrid = document.getElementById('approvedGrid');
    const rejectedGrid = document.getElementById('rejectedGrid');

    pendingGrid.innerHTML = pending.length
      ? pending.map(a => buildCard(a.key, a, true)).join('')
      : emptyState('Bekleyen başvuru yok');

    approvedGrid.innerHTML = approved.length
      ? approved.map(a => buildCard(a.key, a, false)).join('')
      : emptyState('Onaylanan başvuru yok');

    rejectedGrid.innerHTML = rejected.length
      ? rejected.map(a => buildCard(a.key, a, false)).join('')
      : emptyState('Reddedilen başvuru yok');
  });
}

// Update application status
window.updateStatus = function(key, newStatus) {
  const confirmMsg = newStatus === 'approved'
    ? 'Bu başvuruyu onaylamak istediğinize emin misiniz?'
    : 'Bu başvuruyu reddetmek istediğinize emin misiniz?';
  
  if (!confirm(confirmMsg)) return;

  database.ref('applications/' + key).update({ status: newStatus })
    .then(() => {
      // Realtime listener will auto-update
    })
    .catch(err => {
      console.error('Durum güncelleme hatası:', err);
      alert('Bir hata oluştu!');
    });
};

// Export JSON
document.getElementById('exportBtn').addEventListener('click', () => {
  database.ref('applications').once('value', (snapshot) => {
    const data = snapshot.val() || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scorpion_mc_basvurular_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Import JSON
document.getElementById('importInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!confirm('Mevcut başvurular üzerine yazılacak. Devam etmek istiyor musunuz?')) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      database.ref('applications').set(data)
        .then(() => alert('Veriler başarıyla içe aktarıldı!'))
        .catch(err => {
          console.error('İçe aktarma hatası:', err);
          alert('İçe aktarma sırasında bir hata oluştu!');
        });
    } catch {
      alert('Geçersiz JSON dosyası!');
    }
  };
  reader.readAsText(file);
});

// Start loading
loadApplications();
