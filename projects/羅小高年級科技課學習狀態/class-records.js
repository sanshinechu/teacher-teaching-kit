// 點名以實際日期與學生 ID 保存；座位上的 present/absent 只供既有畫面讀寫。
function taipeiAttendanceDate() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());
}
let attendanceDate = taipeiAttendanceDate();

function isRosterlessSeatActive(cls, seatNo) {
  const n = Number(seatNo);
  return n >= 1 && n <= getClassMaxSeat(cls) &&
    !(cls.disabledSeatNos || []).some(value => Number(value) === n);
}

function toggleRosterlessSeat(cls, seatNo) {
  if (classHasRoster(cls)) return;
  prepareAttendance(cls);
  captureAttendance(cls);
  const n = Number(seatNo);
  const disabled = (cls.disabledSeatNos || []).some(value => Number(value) === n);
  if (!confirm(disabled
    ? `恢復 ${pad2(n)} 號？這會恢復原座號的資料，並重新列入點名與抽籤。`
    : `停用 ${pad2(n)} 號（轉出）？該位置將顯示空席，不列入點名、抽籤及人數統計。原紀錄保留，可隨時恢復。`)) return;
  cls.disabledSeatNos = (cls.disabledSeatNos || []).filter(value => Number(value) !== n);
  if (!disabled) cls.disabledSeatNos.push(n);
  delete cls.attendanceLoadedDate;
  prepareAttendance(cls);
  saveAppState();
  renderAll();
  openRosterModal();
}

function ensureStudentId(student) {
  if (!student.id) student.id = `student_${crypto.randomUUID()}`;
  return student.id;
}

function attendanceMembers(cls) {
  if (classHasRoster(cls)) {
    return Object.values(cls.seats).filter(Boolean).map(s => [ensureStudentId(s), s]);
  }
  return ALL_PC_NUMBERS.filter(n => isRosterlessSeatActive(cls, n))
    .map(n => [`seat_${pad2(n)}`, seatStatusOf(cls, String(n), true)]);
}

function captureAttendance(cls) {
  if (!cls.attendanceLoadedDate || !cls.attendanceByDate) return;
  const record = cls.attendanceByDate[cls.attendanceLoadedDate] ||= {};
  attendanceMembers(cls).forEach(([id, s]) => {
    record[id] = { seatNo: s.seatNo || id.slice(5), name: s.name || '',
      present: !!s.present, absent: !!s.absent };
  });
}

function prepareAttendance(cls) {
  if (!cls.attendanceByDate) {
    cls.attendanceByDate = {};
    const legacy = {};
    attendanceMembers(cls).forEach(([id, s]) => {
      if (s.present || s.absent) legacy[id] = {
        seatNo: s.seatNo || id.slice(5), name: s.name || '', present: !!s.present, absent: !!s.absent
      };
    });
    if (Object.keys(legacy).length) cls.undatedAttendance = legacy;
  }
  if (cls.attendanceLoadedDate !== attendanceDate) {
    const record = cls.attendanceByDate[attendanceDate] || {};
    attendanceMembers(cls).forEach(([id, s]) => {
      s.present = !!record[id]?.present;
      s.absent = !!record[id]?.absent;
    });
    cls.attendanceLoadedDate = attendanceDate;
  }
  const input = document.getElementById('attendanceDate');
  if (input) input.value = attendanceDate;
  const note = document.getElementById('attendanceDateNote');
  if (note) note.textContent = attendanceDate === taipeiAttendanceDate() ? '正在點名：今天' : `正在查看／補登：${attendanceDate}`;
  const legacyButton = document.getElementById('assignUndatedAttendanceBtn');
  if (legacyButton) legacyButton.hidden = !cls.undatedAttendance;
  const dates = document.getElementById('attendanceRecordedDates');
  if (dates) {
    dates.innerHTML = '<option value="">查看已記錄日期</option>' + Object.keys(cls.attendanceByDate)
      .sort().reverse().map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    dates.value = Object.hasOwn(cls.attendanceByDate, attendanceDate) ? attendanceDate : '';
  }
}

function changeAttendanceDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) return;
  appState.classes.forEach(captureAttendance);
  attendanceDate = value;
  renderClassroomGrid();
  saveAppState(false);
}

function showAttendanceRecord() {
  const cls = getActiveClass();
  if (!cls) return;
  captureAttendance(cls);
  const currentIds = new Set(attendanceMembers(cls).map(([id]) => id));
  const entries = Object.entries(cls.attendanceByDate[attendanceDate] || {})
    .sort((a, b) => Number(a[1].seatNo) - Number(b[1].seatNo));
  const dialog = document.getElementById('attendanceRecordDialog');
  document.getElementById('attendanceRecordTitle').textContent = `${cls.code} 班 ${attendanceDate} 點名紀錄`;
  document.getElementById('attendanceRecordRows').innerHTML = entries.map(([id, s]) =>
    `<tr><td>${escapeHtml(s.seatNo)}</td><td>${escapeHtml(s.name || '未登錄姓名')}${currentIds.has(id) ? '' : '（已轉出／停用／原名單）'}</td><td>${s.absent ? '請假' : s.present ? '出席' : '未點名'}</td></tr>`).join('');
  dialog.showModal();
}

function archiveSeatStudent(cls, pcKey) {
  const s = cls.seats[pcKey];
  if (!s) return;
  captureAttendance(cls);
  const links = [];
  (cls.assignments || []).forEach(a => {
    if (a.links?.[s.seatNo]) {
      links.push({ assignmentId: a.id, title: a.title, url: a.links[s.seatNo] });
      delete a.links[s.seatNo];
    }
  });
  (cls.retiredStudents ||= []).push({ student: { ...s }, links, date: taipeiAttendanceDate() });
  cls.seats[pcKey] = null;
  // 最後一名轉出時，不讓舊的無姓名座號標記復活。
  if (!classHasRoster(cls)) cls.seatMarks = {};
}

function replaceClassRoster(cls, seats) {
  captureAttendance(cls);
  const next = Object.values(seats).filter(Boolean);
  const old = Object.values(cls.seats || {}).filter(Boolean);
  const keptIds = new Set(next.map(s => s.id));
  const savedLinks = new Map(old.map(s => [s.id, (cls.assignments || [])
    .filter(a => a.links?.[s.seatNo]).map(a => ({ assignmentId: a.id, title: a.title, url: a.links[s.seatNo] }))]));
  old.forEach(s => {
    if (!keptIds.has(s.id)) (cls.retiredStudents ||= []).push({ student: { ...s },
      links: savedLinks.get(s.id), date: taipeiAttendanceDate() });
  });
  (cls.assignments || []).forEach(a => {
    old.forEach(s => { if (a.links) delete a.links[s.seatNo]; });
    next.forEach(s => {
      if (a.links?.[s.seatNo]) {
        (cls.retiredStudents ||= []).push({ student: { seatNo: s.seatNo, name: '原座號作品（身分未確認）' },
          links: [{ assignmentId: a.id, title: a.title, url: a.links[s.seatNo] }], date: taipeiAttendanceDate() });
        delete a.links[s.seatNo];
      }
    });
    next.forEach(s => {
      const link = savedLinks.get(s.id)?.find(l => l.assignmentId === a.id);
      if (link) (a.links ||= {})[s.seatNo] = link.url;
    });
  });
  cls.seats = seats;
  if (!next.length) cls.seatMarks = {};
}

function renderIndividualRoster() {
  const cls = getActiveClass();
  const box = document.getElementById('individualRoster');
  if (!box || !cls) return;
  box.innerHTML = '';
  ALL_PC_NUMBERS.forEach(pc => {
    const s = cls.seats[String(pc)];
    const row = document.createElement('div');
    row.className = 'individual-roster-row';
    const label = document.createElement('span');
    label.textContent = `PC-${pad2(pc)}　${s ? `${s.seatNo} 號 ${s.name}` : '空席'}`;
    row.append(label);
    if (!classHasRoster(cls) && pc <= getClassMaxSeat(cls)) {
      const active = isRosterlessSeatActive(cls, pc);
      label.textContent = `PC-${pad2(pc)}　${pad2(pc)} 號${active ? '（使用中）' : '（已停用・空席）'}`;
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = active ? 'danger-btn' : 'secondary-btn';
      toggle.textContent = active ? '停用座號（轉出）' : '恢復座號';
      toggle.onclick = () => toggleRosterlessSeat(cls, pc);
      row.append(toggle);
      box.append(row);
      return;
    }
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary-btn';
    edit.textContent = s ? '編輯' : '新增';
    edit.onclick = () => { promptEditSingleSeat(String(pc)); openRosterModal(); };
    row.append(edit);
    if (s) {
      const retire = document.createElement('button');
      retire.type = 'button';
      retire.className = 'danger-btn';
      retire.textContent = '轉出';
      retire.onclick = () => {
        if (!confirm(`將 ${s.seatNo} 號 ${s.name} 轉出？\n歷次點名、星星及作品連結會封存，不會交給下一位學生。`)) return;
        archiveSeatStudent(cls, String(pc));
        saveAppState();
        renderAll();
        openRosterModal();
      };
      row.append(retire);
    }
    box.append(row);
  });
}

function editIndividualStudent(pcKey) {
  const cls = getActiveClass();
  if (!cls) return;
  prepareAttendance(cls);
  const current = cls.seats[pcKey];
  const input = prompt(current
    ? '修改同一位學生的座號／姓名（格式：座號,姓名）。若是換成另一位學生，請先使用「轉出」，再新增。'
    : '新增學生（格式：座號,姓名）：', current ? `${current.seatNo},${current.name}` : `${pad2(pcKey)},`);
  if (input === null) return;
  const match = input.trim().match(/^(\d+)\s*[,，\s]\s*(.+)$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 99 || !match[2].trim()) {
    alert('請輸入 1～99 的座號與姓名，例如：09,王小明。轉出請使用名單中的「轉出」按鈕。');
    return;
  }
  const seatNo = pad2(Number(match[1]));
  if (Object.entries(cls.seats).some(([pc, s]) => pc !== pcKey && s && Number(s.seatNo) === Number(seatNo))) {
    alert('這個座號已有學生，請先確認座號。');
    return;
  }
  captureAttendance(cls);
  const changingNumber = !current || current.seatNo !== seatNo;
  const conflicts = (cls.assignments || []).filter(a => a.links?.[seatNo]);
  if (changingNumber && conflicts.length) {
    if (!confirm(`座號 ${seatNo} 有 ${conflicts.length} 份既有作品連結。要先封存這些連結再繼續嗎？`)) return;
    (cls.retiredStudents ||= []).push({ student: { seatNo, name: '原座號作品（身分未確認）' },
      links: conflicts.map(a => ({ assignmentId: a.id, title: a.title, url: a.links[seatNo] })), date: taipeiAttendanceDate() });
    conflicts.forEach(a => delete a.links[seatNo]);
  }
  if (current && changingNumber) {
    (cls.assignments || []).forEach(a => {
      if (a.links?.[current.seatNo]) {
        a.links[seatNo] = a.links[current.seatNo];
        delete a.links[current.seatNo];
      }
    });
  }
  cls.seats[pcKey] = { ...(current || { id: `student_${crypto.randomUUID()}`,
    avatar: AVATAR_POOL[Number(pcKey) % AVATAR_POOL.length], stars: 0, done: false,
    help: false, present: false, absent: false }), seatNo, name: match[2].trim() };
  if (cls.classSize < Number(seatNo) && Number(seatNo) <= 29) cls.classSize = Number(seatNo);
  saveAppState();
  renderAll();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('viewAttendanceRecordBtn').addEventListener('click', showAttendanceRecord);
  document.getElementById('attendanceDate').addEventListener('change', e => changeAttendanceDate(e.target.value));
  document.getElementById('attendanceTodayBtn').addEventListener('click', () => changeAttendanceDate(taipeiAttendanceDate()));
  document.getElementById('attendanceRecordedDates').addEventListener('change', e => changeAttendanceDate(e.target.value));
  document.getElementById('assignUndatedAttendanceBtn').addEventListener('click', () => {
    const cls = getActiveClass();
    if (!cls?.undatedAttendance || !confirm(`將舊版未標日期的點名歸入 ${attendanceDate}？同一位學生在該日期的標記會被取代。`)) return;
    captureAttendance(cls);
    Object.assign(cls.attendanceByDate[attendanceDate] ||= {}, cls.undatedAttendance);
    delete cls.undatedAttendance;
    delete cls.attendanceLoadedDate;
    renderClassroomGrid();
    saveAppState();
  });
});
