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
let activityWeeks = [];

const ISTANBUL_OFFSET = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

function startOfIstanbulWeek(timestamp = Date.now()) {
  const local = new Date(timestamp + ISTANBUL_OFFSET);
  const day = local.getUTCDay() || 7;
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - day + 1) - ISTANBUL_OFFSET;
}

function durationAt(session, now = Date.now()) {
  if (session.durationSeconds != null) return Math.max(0, Number(session.durationSeconds));
  return Math.max(0, Math.floor((Math.min(now, Number(session.lastSeenAt) || now) - Number(session.startedAt)) / 1000));
}

function sessionServer(session) {
  const value = session.serverName ?? session.serverLabel ?? session.serverNo ?? session.serverNumber
    ?? session.server ?? session.serverId ?? session.guildName ?? session.guildId;
  return value == null || String(value).trim() === '' ? 'Sunucu bilgisi yok' : String(value).trim();
}

function sessionEnd(session, now = Date.now()) {
  if (session.isActive) return Math.min(now, Number(session.lastSeenAt) || now);
  if (session.endedAt) return Number(session.endedAt);
  if (session.durationSeconds != null) return Number(session.startedAt) + (Number(session.durationSeconds) * 1000);
  return Number(session.lastSeenAt) || Number(session.startedAt);
}

function formatWeekDate(timestamp) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Istanbul'
  }).format(new Date(timestamp));
}

function buildActivityFilters() {
  const serverSelect = document.getElementById('activityServer');
  const previousServer = serverSelect.value;
  const servers = [...new Set(activitySessions.map(sessionServer))]
    .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }));

  serverSelect.innerHTML = '<option value="">Sunucu seçiniz</option>';
  servers.forEach(server => serverSelect.add(new Option(server, server)));
  if (servers.includes(previousServer)) serverSelect.value = previousServer;
  buildWeekOptions();
}

function buildWeekOptions() {
  const server = document.getElementById('activityServer').value;
  const weekSelect = document.getElementById('activityWeekSelect');
  const previousWeek = weekSelect.value;
  weekSelect.innerHTML = '';
  activityWeeks = [];

  if (!server) {
    weekSelect.disabled = true;
    weekSelect.add(new Option('Önce sunucu seçiniz', ''));
    renderActivity();
    return;
  }

  const sessions = activitySessions.filter(session => sessionServer(session) === server);
  const validStarts = sessions.map(session => Number(session.startedAt)).filter(Number.isFinite);
  const firstWeek = validStarts.length ? startOfIstanbulWeek(Math.min(...validStarts)) : startOfIstanbulWeek();
  const currentWeek = startOfIstanbulWeek();

  for (let start = currentWeek, index = 0; start >= firstWeek; start -= 7 * DAY_MS, index += 1) {
    const end = start + (7 * DAY_MS);
    activityWeeks.push({ start, end });
    const label = index === 0
      ? `Bu Hafta (${formatWeekDate(start)} – ${formatWeekDate(end - 1)})`
      : `Hafta ${index} (${formatWeekDate(start)} – ${formatWeekDate(end - 1)})`;
    weekSelect.add(new Option(label, String(start)));
  }

  weekSelect.disabled = false;
  weekSelect.value = activityWeeks.some(week => String(week.start) === previousWeek)
    ? previousWeek
    : String(activityWeeks[0].start);
  renderActivity();
}

function selectedActivity() {
  const server = document.getElementById('activityServer').value;
  const weekStart = Number(document.getElementById('activityWeekSelect').value);
  if (!server || !Number.isFinite(weekStart)) return { server, week: null, players: [], sessionCount: 0 };

  const week = { start: weekStart, end: weekStart + (7 * DAY_MS) };
  const players = new Map();
  let sessionCount = 0;

  activitySessions.forEach(session => {
    if (sessionServer(session) !== server) return;
    const startedAt = Number(session.startedAt);
    const endedAt = sessionEnd(session);
    if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt <= week.start || startedAt >= week.end) return;
    const overlapSeconds = Math.max(0, Math.floor((Math.min(endedAt, week.end) - Math.max(startedAt, week.start)) / 1000));
    if (!overlapSeconds) return;

    const key = String(session.userId || session.username || 'Bilinmeyen');
    const player = players.get(key) || {
      userId: session.userId || '', username: session.username || session.userId || 'Bilinmeyen',
      totalSeconds: 0, sessions: 0, lastSeenAt: 0
    };
    player.totalSeconds += overlapSeconds;
    player.sessions += 1;
    player.lastSeenAt = Math.max(player.lastSeenAt, Math.min(endedAt, week.end));
    if (session.username) player.username = session.username;
    players.set(key, player);
    sessionCount += 1;
  });

  return {
    server, week, sessionCount,
    players: [...players.values()].sort((a, b) => b.totalSeconds - a.totalSeconds || a.username.localeCompare(b.username, 'tr'))
  };
}

function renderActivity() {
  const query = document.getElementById('activitySearch').value.trim().toLocaleLowerCase('tr-TR');
  const activity = selectedActivity();
  const filtered = activity.players.filter(player => {
    const searchable = `${player.username} ${player.userId}`.toLocaleLowerCase('tr-TR');
    return searchable.includes(query);
  });

  const rows = document.getElementById('activityRows');
  rows.textContent = '';

  if (!filtered.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'activity-empty';
    cell.textContent = !activity.server
      ? 'Önce bir sunucu seçin.'
      : query ? 'Aramanıza uygun oyuncu bulunamadı.' : 'Bu sunucu ve haftada aktivite kaydı yok.';
    row.appendChild(cell);
    rows.appendChild(row);
  } else {
    filtered.forEach((player, index) => {
      const row = document.createElement('tr');
      const rankCell = document.createElement('td');
      rankCell.className = index < 3 ? 'activity-rank is-top' : 'activity-rank';
      rankCell.textContent = `#${index + 1}`;
      const userCell = document.createElement('td');
      const user = document.createElement('div');
      user.className = 'activity-user';
      const avatar = document.createElement('span');
      avatar.className = 'activity-avatar';
      avatar.textContent = (player.username || '?').charAt(0).toUpperCase();
      const identity = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = player.username;
      const id = document.createElement('small');
      id.textContent = player.userId;
      identity.append(name, id);
      user.append(avatar, identity);
      userCell.appendChild(user);

      const durationCell = document.createElement('td');
      durationCell.className = 'activity-duration';
      durationCell.textContent = activityDuration(player.totalSeconds);
      const sessionsCell = document.createElement('td');
      sessionsCell.textContent = player.sessions;
      const lastSeenCell = document.createElement('td');
      lastSeenCell.textContent = activityDate(player.lastSeenAt);
      row.append(rankCell, userCell, durationCell, sessionsCell, lastSeenCell);
      rows.appendChild(row);
    });
  }

  const totalSeconds = activity.players.reduce((sum, player) => sum + player.totalSeconds, 0);
  document.getElementById('activityWeek').textContent = activityDuration(totalSeconds);
  document.getElementById('activityPlayers').textContent = activity.players.length;
  document.getElementById('activityTopPlayer').textContent = activity.players[0]?.username || '—';
  document.getElementById('activityTotal').textContent = activity.sessionCount;
  document.getElementById('activityShown').textContent = `${filtered.length} oyuncu`;
  document.getElementById('activityTitle').textContent = activity.server ? `${activity.server} · Haftalık Aktivite` : 'Haftalık Oyuncu Aktivitesi';
  document.getElementById('activityPeriod').textContent = activity.week
    ? `${formatWeekDate(activity.week.start)} – ${formatWeekDate(activity.week.end - 1)} · İstanbul saati`
    : 'Sonuçları görmek için sunucu ve hafta seçin.';
}

document.getElementById('activitySearch').addEventListener('input', renderActivity);
document.getElementById('activityServer').addEventListener('change', buildWeekOptions);
document.getElementById('activityWeekSelect').addEventListener('change', renderActivity);

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
    document.getElementById('activityCount').textContent = activitySessions.length;
    buildActivityFilters();

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
