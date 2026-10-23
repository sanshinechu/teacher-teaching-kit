// 羅東國小 3D 校園主應用程式：介面互動、搜尋、點選校舍、導覽巡航與彈窗綁定
import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { BUILDINGS, TOUR_STATIONS } from '../data/buildings.js';
import { SCHOOL_INFO, DEPARTMENTS, GRADE_DISTRIBUTION } from '../data/offices.js';
import { CampusScene } from './scene.js';
import { CampusBuilder } from './builder.js';
import { ViewController } from './controls.js';

class App {
  constructor() {
    this.container = document.getElementById('scene');
    this.sceneManager = new CampusScene(this.container);
    this.builder = new CampusBuilder(this.sceneManager.scene, this.sceneManager.materials);
    this.interactiveObjects = this.builder.buildAll();
    this.viewController = new ViewController(this.sceneManager, BUILDINGS);
    // 預設切換為 3D 鳥瞰全景視角，主角羅小東依舊站在大門前迎賓
    this.viewController.setMode('orbit');
    document.querySelectorAll('.view-switch button').forEach(b => b.classList.remove('active'));
    document.querySelector('.view-switch button[data-mode="orbit"]')?.classList.add('active');
    const walkHelp = document.getElementById('walk-controls');
    if (walkHelp) {
      walkHelp.hidden = true;
    }

    this.selectedBuilding = null;
    this.tourIndex = 0;
    this.isTourRunning = false;
    this.tourTimer = null;
    this.currentCategory = 'all';

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initUI();
    this.setupEvents();
    this.animate();

    const loader = document.getElementById('loading');
    if (loader) loader.remove();
  }

  initUI() {
    this.renderBuildingList();
    this.renderOfficesDialog();
    this.renderGradesDialog();
  }

  renderBuildingList() {
    const listEl = document.getElementById('place-list');
    const searchVal = (document.getElementById('place-search')?.value || '').trim().toLowerCase();

    const filtered = BUILDINGS.filter(b => {
      const matchCat = this.currentCategory === 'all' || b.category === this.currentCategory;
      const matchSearch = !searchVal ||
        b.name.toLowerCase().includes(searchVal) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(searchVal))) ||
        (b.description && b.description.toLowerCase().includes(searchVal));
      return matchCat && matchSearch;
    });

    const countEl = document.getElementById('list-count');
    if (countEl) countEl.textContent = `${filtered.length} 個校園地點`;

    if (!listEl) return;
    if (filtered.length === 0) {
      listEl.innerHTML = `<p class="no-results">查無相關校舍或地點，請嘗試搜尋「涵育樓」、「操場」或「孔雀門」。</p>`;
      return;
    }

    listEl.innerHTML = filtered.map(b => `
      <button class="place-item ${this.selectedBuilding?.id === b.id ? 'selected' : ''}" data-id="${b.id}">
        <span class="place-symbol"><i data-lucide="${this.getCategoryIcon(b.category)}"></i></span>
        <span class="place-info">
          <span class="place-name">${b.name}</span>
          <span class="place-type">${b.categoryName || '校園設施'}</span>
        </span>
        <i data-lucide="chevron-right" class="chevron"></i>
      </button>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  getCategoryIcon(cat) {
    switch (cat) {
      case 'admin': return 'landmark';
      case 'teaching': return 'graduation-cap';
      case 'sports': return 'dribbble';
      case 'life': return 'coffee';
      case 'gate': return 'door-open';
      case 'landscape': return 'trees';
      default: return 'building-2';
    }
  }

  selectBuilding(buildingId, triggerFlight = true) {
    const b = BUILDINGS.find(item => item.id === buildingId);
    if (!b) return;

    this.selectedBuilding = b;
    const card = document.getElementById('detail-card');
    const title = document.getElementById('detail-title');
    const cat = document.getElementById('detail-category');
    const desc = document.getElementById('detail-description');
    const tagsContainer = document.getElementById('detail-tags');

    if (card) card.classList.add('has-selection');
    if (title) title.textContent = b.name;
    if (cat) cat.textContent = `${b.categoryName || '校園空間'} · 羅東國小`;
    if (desc) desc.textContent = b.description || '暫無詳細說明。';

    if (tagsContainer) {
      tagsContainer.innerHTML = (b.tags || []).map(t => `<span class="tag-chip">${t}</span>`).join('');
    }

    if (triggerFlight) {
      this.viewController.flyTo(b.x, b.z, Math.max(35, Math.max(b.w, b.d) * 1.5));
    }

    this.renderBuildingList();
  }

  setupEvents() {
    // 側邊欄收合與展開
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('sidebar-open-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');

    closeBtn?.addEventListener('click', () => {
      sidebar?.classList.add('collapsed');
      if (openBtn) openBtn.style.display = 'flex';
    });

    openBtn?.addEventListener('click', () => {
      sidebar?.classList.remove('collapsed');
      if (openBtn) openBtn.style.display = 'none';
    });

    // 點選清單項目
    document.getElementById('place-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.place-item');
      if (btn && btn.dataset.id) {
        this.selectBuilding(btn.dataset.id);
      }
    });

    // 搜尋輸入
    document.getElementById('place-search')?.addEventListener('input', () => {
      this.renderBuildingList();
    });

    // 分類頁籤切換
    document.getElementById('categories')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      document.querySelectorAll('#categories button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.currentCategory = btn.dataset.cat;
      this.renderBuildingList();
    });

    // 3D 畫布滑鼠點選建築物（拖曳旋轉畫面時不觸發點選，只有純點擊才觸發）
    let pointerDownPos = { x: 0, y: 0 };
    this.sceneManager.renderer.domElement.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    this.sceneManager.renderer.domElement.addEventListener('pointerup', (e) => {
      if (this.viewController.mode === 'walk') return;
      // 若滑鼠移動距離超過 6 像素，代表是旋轉視角而非點擊，不跳出解說
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

      const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.id && hit.parent) {
          hit = hit.parent;
        }
        if (hit?.userData?.id) {
          this.selectBuilding(hit.userData.id, true);
        }
      } else {
        // 點擊空白處時自動收合右下角解說卡
        document.getElementById('detail-card')?.classList.remove('has-selection');
        this.selectedBuilding = null;
        this.renderBuildingList();
      }
    });

    // 視角切換按鈕
    document.querySelectorAll('.view-switch button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-switch button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        this.viewController.setMode(mode);

        const walkHelp = document.getElementById('walk-controls');
        if (walkHelp) {
          walkHelp.hidden = (mode !== 'walk');
          if (mode === 'walk') {
            walkHelp.textContent = '按 WASD 行走 · 滑鼠拖曳環顧轉向 · 點擊右下切換「羅小東 / 蘿絲」 · Esc 返回鳥瞰';
          }
        }
      });
    });

    // 切換主角按鈕
    document.getElementById('switch-mascot-btn')?.addEventListener('click', () => {
      const nextType = this.viewController.toggleMascot();
      const nameSpan = document.getElementById('mascot-name');
      if (nameSpan) {
        nameSpan.textContent = nextType === 'luodong' ? '主角：羅小東' : '主角：蘿絲';
      }
    });

    // 地圖工具按鈕
    document.getElementById('reset-view')?.addEventListener('click', () => {
      this.sceneManager.resetView();
    });

    document.getElementById('day-btn')?.addEventListener('click', () => {
      const isNight = this.sceneManager.toggleDayNight();
      const btn = document.getElementById('day-btn');
      if (btn) btn.classList.toggle('night', isNight);
    });

    document.getElementById('rotate-btn')?.addEventListener('click', () => {
      const active = this.sceneManager.controls.autoRotate = !this.sceneManager.controls.autoRotate;
      document.getElementById('rotate-btn')?.classList.toggle('active', active);
    });

    document.getElementById('fullscreen-btn')?.addEventListener('click', () => {
      // 在 Google 協作平台 iframe 內部，若被瀏覽器安全性原則阻擋 Fullscreen API，則自動開新視窗滿版開啟
      const tryFullscreen = async () => {
        try {
          if (!document.fullscreenElement) {
            await (document.documentElement.requestFullscreen?.() || 
                   document.documentElement.webkitRequestFullscreen?.() || 
                   document.body.requestFullscreen?.());
          } else {
            await (document.exitFullscreen?.() || document.webkitExitFullscreen?.());
          }
        } catch (err) {
          console.warn("Iframe blocked fullscreen, opening in standalone tab:", err);
          window.open(window.location.href, '_blank', 'noopener,noreferrer');
        }
      };

      // 檢查是否處於被限制 full-screen 的 iframe 中
      const inIframe = window.self !== window.top;
      if (inIframe && !document.fullscreenEnabled) {
        window.open(window.location.href, '_blank', 'noopener,noreferrer');
      } else {
        tryFullscreen();
      }
    });

    // 關閉介紹卡
    document.getElementById('close-detail')?.addEventListener('click', () => {
      document.getElementById('detail-card')?.classList.remove('has-selection');
      this.selectedBuilding = null;
      this.renderBuildingList();
    });

    // 精選導覽按鈕
    document.getElementById('tour-btn')?.addEventListener('click', () => {
      this.startTour();
    });

    document.getElementById('tour-close')?.addEventListener('click', () => {
      this.stopTour();
    });

    document.getElementById('tour-next')?.addEventListener('click', () => {
      this.nextTourStation();
    });

    document.getElementById('tour-prev')?.addEventListener('click', () => {
      this.prevTourStation();
    });

    // 彈出對話框
    document.getElementById('offices-btn')?.addEventListener('click', () => {
      document.getElementById('offices-dialog')?.showModal();
    });

    document.getElementById('grades-btn')?.addEventListener('click', () => {
      document.getElementById('grades-dialog')?.showModal();
    });

    document.getElementById('map-btn')?.addEventListener('click', () => {
      document.getElementById('map-dialog')?.showModal();
    });

    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('dialog')?.close();
      });
    });
  }

  startTour() {
    this.isTourRunning = true;
    this.tourIndex = 0;
    const tourBar = document.getElementById('tourbar');
    if (tourBar) tourBar.hidden = false;
    this.runTourStep();
  }

  stopTour() {
    this.isTourRunning = false;
    clearTimeout(this.tourTimer);
    const tourBar = document.getElementById('tourbar');
    if (tourBar) tourBar.hidden = true;
  }

  runTourStep() {
    if (!this.isTourRunning) return;
    const id = TOUR_STATIONS[this.tourIndex];
    this.selectBuilding(id, true);

    const counter = document.getElementById('tour-counter');
    const nameEl = document.getElementById('tour-name');
    const progress = document.getElementById('tour-progress');

    if (counter) counter.textContent = `${String(this.tourIndex + 1).padStart(2, '0')} / ${TOUR_STATIONS.length}`;
    if (nameEl) nameEl.textContent = this.selectedBuilding?.name || '';
    if (progress) progress.style.width = `${((this.tourIndex + 1) / TOUR_STATIONS.length) * 100}%`;

    clearTimeout(this.tourTimer);
    this.tourTimer = setTimeout(() => {
      if (this.tourIndex < TOUR_STATIONS.length - 1) {
        this.tourIndex++;
        this.runTourStep();
      } else {
        this.stopTour();
      }
    }, 7000);
  }

  nextTourStation() {
    if (this.tourIndex < TOUR_STATIONS.length - 1) {
      this.tourIndex++;
      this.runTourStep();
    }
  }

  prevTourStation() {
    if (this.tourIndex > 0) {
      this.tourIndex--;
      this.runTourStep();
    }
  }

  renderOfficesDialog() {
    const container = document.getElementById('offices-content');
    if (!container) return;

    container.innerHTML = DEPARTMENTS.map(dept => `
      <div class="office-group">
        <h3><i data-lucide="building-2"></i> ${dept.name} <small>(${dept.location})</small></h3>
        <div class="office-grid">
          ${dept.items.map(item => `
            <div class="office-item">
              <span class="office-floor">${item.floor}</span>
              <div>
                <strong>${item.name}</strong>
                <p>${item.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  renderGradesDialog() {
    const container = document.getElementById('grades-content');
    if (!container) return;

    container.innerHTML = `
      <table class="grade-table">
        <thead>
          <tr>
            <th>年級別</th>
            <th>座落校舍與樓層</th>
            <th>班級配置</th>
          </tr>
        </thead>
        <tbody>
          ${GRADE_DISTRIBUTION.map(g => `
            <tr>
              <td><strong>${g.grade}</strong></td>
              <td>${g.building}</td>
              <td>${g.classrooms}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const deltaTime = 0.016;
    this.viewController.update(deltaTime);
    this.sceneManager.render();

    // 指北針旋轉
    const compassSvg = document.querySelector('#compass svg');
    if (compassSvg && this.sceneManager.camera) {
      const dir = new THREE.Vector3();
      this.sceneManager.camera.getWorldDirection(dir);
      const angleDeg = (Math.atan2(dir.x, dir.z) * 180) / Math.PI;
      compassSvg.style.transform = `rotate(${-angleDeg}deg)`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
  } catch (err) {
    console.error('App init error:', err);
    const loader = document.getElementById('loading');
    if (loader) {
      loader.innerHTML = `
        <div class="spinner" style="border-top-color:#e63946;"></div>
        <p style="color:#e63946;font-weight:700;margin-top:12px;">載入發生問題，請按 Ctrl + F5 強制重新整理</p>
        <p style="color:#888;font-size:12px;margin-top:6px;">${err.message}</p>
      `;
    }
  }
});

