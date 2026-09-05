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

// FiveM aktivite kayıtları
let activitySessions = [];

function activityDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} sa ${minutes} dk` : `${minutes} dk`;
}

function activityDate(timestamp) {
  if (!timestamp) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Istanbul'
  }).format(new Date(timestamp));
}

function startOfIstanbulDay() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  return new Date(`${parts}T00:00:00+03:00`).getTime();
}

function durationAt(session, now = Date.now()) {
  if (session.durationSeconds != null) return Math.max(0, Number(session.durationSeconds));
  return Math.max(0, Math.floor((Math.min(now, Number(session.lastSeenAt) || now) - Number(session.startedAt)) / 1000));
}

function renderActivity() {
  const query = document.getElementById('activitySearch').value.trim().toLocaleLowerCase('tr-TR');
  const filtered = activitySessions.filter(session => {
    const searchable = `${session.username || ''} ${session.userId || ''}`.toLocaleLowerCase('tr-TR');
    return searchable.includes(query);
  }).slice(0, 500);

  const rows = document.getElementById('activityRows');
  rows.textContent = '';

  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'activity-empty';
    cell.textContent = query ? 'Aramanıza uygun kayıt bulunamadı.' : 'Henüz FiveM oturum kaydı yok.';
    row.appendChild(cell);
    rows.appendChild(row);
  } else {
    filtered.forEach(session => {
      const row = document.createElement('tr');
      const userCell = document.createElement('td');
      const user = document.createElement('div');
      user.className = 'activity-user';
      const avatar = document.createElement('span');
      avatar.className = 'activity-avatar';
      avatar.textContent = (session.username || '?').charAt(0).toUpperCase();
      const identity = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = session.username || session.userId || 'Bilinmeyen';
      const id = document.createElement('small');
      id.textContent = session.userId || '';
      identity.append(name, id);
      user.append(avatar, identity);
      userCell.appendChild(user);

      const startCell = document.createElement('td');
      startCell.textContent = activityDate(session.startedAt);
      const endCell = document.createElement('td');
      endCell.textContent = session.isActive ? '—' : activityDate(session.endedAt);
      const durationCell = document.createElement('td');
      durationCell.className = 'activity-duration';
      durationCell.textContent = activityDuration(durationAt(session));
      const statusCell = document.createElement('td');
      const status = document.createElement('span');
      status.className = session.isActive ? 'activity-status is-live' : 'activity-status';
      status.textContent = session.isActive ? 'Aktif' : 'Tamamlandı';
      statusCell.appendChild(status);
      row.append(userCell, startCell, endCell, durationCell, statusCell);
      rows.appendChild(row);
    });
  }

  document.getElementById('activityShown').textContent = `${filtered.length} kayıt`;
}

function updateActivitySummary() {
  const now = Date.now();
  const todayStart = startOfIstanbulDay();
  const weekStart = now - (7 * 24 * 60 * 60 * 1000);
  const todaySeconds = activitySessions
    .filter(session => Number(session.startedAt) >= todayStart)
    .reduce((sum, session) => sum + durationAt(session, now), 0);
  const weekSeconds = activitySessions
    .filter(session => Number(session.startedAt) >= weekStart)
    .reduce((sum, session) => sum + durationAt(session, now), 0);
  const live = activitySessions.filter(session => session.isActive).length;
  document.getElementById('activityToday').textContent = activityDuration(todaySeconds);
  document.getElementById('activityWeek').textContent = activityDuration(weekSeconds);
  document.getElementById('activityLive').textContent = live;
  document.getElementById('activityTotal').textContent = activitySessions.length;
  document.getElementById('activityCount').textContent = live || activitySessions.length;
}

document.getElementById('activitySearch').addEventListener('input', renderActivity);

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

    activitySessions = Object.values(data)
      .filter(item => item?.recordType === 'fivem-session')
      .sort((a, b) => Number(b.startedAt) - Number(a.startedAt));
    updateActivitySummary();
    renderActivity();

    Object.entries(data).forEach(([key, app]) => {
      if (app?.recordType === 'fivem-session') return;
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
