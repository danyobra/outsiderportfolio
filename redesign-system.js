(function () {
  'use strict';

  const isStaticMode = document.documentElement.classList.contains('flat') || 
                       location.search.includes('static') || 
                       false;

  // Make controller available globally
  const redesignApi = Object.freeze({
    openStatic: function () {
      localStorage.setItem('view_mode', 'static');
      if (!location.search.includes('static')) {
        location.href = location.pathname + '?static=1';
      } else {
        location.reload();
      }
    },
    open3D: function () {
      localStorage.setItem('view_mode', '3d');
      location.href = location.pathname.split('?')[0];
    }
  });

  // If in static mode, inject a header button to return to 3D room
  if (isStaticMode) {
    document.addEventListener('DOMContentLoaded', () => {
      injectStaticReturnButton();
    });
    return;
  }

  // Hook called by desk-room.js once the 3D scene is added
  const shared = { scene: null, three: null };
  let additionsInstalled = false;
  Object.defineProperty(window, '__initRedesign', { value: () => initRedesign(), configurable: true });
  const initRedesign = function () {
    if (additionsInstalled) return;
    if (!window.__scene || !window.__three) return;
    additionsInstalled = true;
    const sceneRef = window.__scene, threeRef = window.__three;
    try { delete window.__scene; delete window.__three; } catch (e) {}
    shared.scene = sceneRef; shared.three = threeRef;
    initSceneAdditions();
    initStaticViewControl();
  };

  // On slower connections the baked-room readiness hook may fire before or after
  // this module. Try initializing both when this script executes and once loading settles.
  if (window.__scene && window.__three) initRedesign();
  window.addEventListener('load', () => initRedesign(), { once: true });

  /* =========================================================================
   * 1. 3D SCENE ADDITIONS & WALL ART REPLACEMENT
   * ========================================================================= */
  function initSceneAdditions() {
    const scene = shared.scene;
    const T = shared.three;
    if (!scene || !T) {
      return;
    }

    // -------------------------------------------------------------
    // A. 3D COFFEE CUP WITH "OUTSIDER" ENGRAVING (ON DESK)
    // Location: Desk top at Y = 1.585, X = -1.15, Z = -0.12
    // -------------------------------------------------------------
    try {
      const cupGroup = new T.Group();
      cupGroup.name = 'desk-coffee-cup';
      cupGroup.position.set(-1.15, 1.585, -0.12);

      // 1. Saucer / Coaster underneath
      const coasterGeo = new T.Cylinder(0.135, 0.145, 0.014, 32);
      const coasterMat = new T.Material({
        color: 0x181a24,
        roughness: 0.35,
        metalness: 0.5
      });
      const coaster = new T.Mesh(coasterGeo, coasterMat);
      coaster.position.y = 0.007;
      coaster.receiveShadow = true;
      cupGroup.add(coaster);

      // 2. Texture for "Outsider" on the Cup
      const cupCanvas = document.createElement('canvas');
      cupCanvas.width = 1024;
      cupCanvas.height = 512;
      const ctx = cupCanvas.getContext('2d');

      // Matte dark ceramic background matching purple room lighting
      ctx.fillStyle = '#14141e';
      ctx.fillRect(0, 0, cupCanvas.width, cupCanvas.height);

      // Subtle tech accent frame
      ctx.strokeStyle = 'rgba(255, 158, 187, 0.18)';
      ctx.lineWidth = 2;
      ctx.strokeRect(36, 36, cupCanvas.width - 72, cupCanvas.height - 72);

      // Bold, clean, embossed "OUTSIDER" text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 86px "Space Grotesk", -apple-system, monospace';

      // Soft coral-purple glow matching room lighting
      ctx.shadowColor = 'rgba(255, 158, 187, 0.85)';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffffff';
      ctx.fillText('OUTSIDER', cupCanvas.width / 2, cupCanvas.height / 2 - 12);

      // Tagline
      ctx.shadowBlur = 0;
      ctx.font = '600 24px "Space Mono", monospace';
      ctx.letterSpacing = '6px';
      ctx.fillStyle = 'rgba(255, 180, 203, 0.85)';
      ctx.fillText('[ COFFEE · CODE · SHIPS ]', cupCanvas.width / 2, cupCanvas.height / 2 + 56);

      const cupTexture = new T.CanvasTexture(cupCanvas);
      cupTexture.colorSpace = 'srgb';

      // 3. Cup Ceramic Body
      const cupBodyGeo = new T.Cylinder(0.102, 0.082, 0.20, 36);
      cupBodyGeo.rotateY(-Math.PI / 2); // align texture toward camera viewpoint
      const cupBodyMat = new T.Material({
        map: cupTexture,
        roughness: 0.28,
        metalness: 0.12
      });
      const cupMesh = new T.Mesh(cupBodyGeo, cupBodyMat);
      cupMesh.position.y = 0.108;
      cupMesh.castShadow = true;
      cupMesh.receiveShadow = true;
      cupGroup.add(cupMesh);

      // 4. Coffee liquid surface inside cup
      const coffeeGeo = new T.Cylinder(0.095, 0.095, 0.008, 32);
      const coffeeMat = new T.Material({
        color: 0x160c07,
        roughness: 0.08,
        metalness: 0.1
      });
      const coffee = new T.Mesh(coffeeGeo, coffeeMat);
      coffee.position.y = 0.188;
      cupGroup.add(coffee);

      // 5. Cup 3D Handle
      const handleGeo = new T.Torus(0.055, 0.014, 16, 32, Math.PI * 1.2);
      const handleMat = new T.Material({
        color: 0x14141e,
        roughness: 0.3,
        metalness: 0.12
      });
      const handle = new T.Mesh(handleGeo, handleMat);
      handle.position.set(-0.088, 0.11, 0);
      handle.rotation.z = Math.PI / 2;
      handle.castShadow = true;
      cupGroup.add(handle);

      scene.add(cupGroup);
    } catch (err) {
    }

    // -------------------------------------------------------------
    // B. 4TH 3D PICTURE FRAME ON THE WALL (NON-CYLINDRICAL ART)
    // Location: Next to Frame 3 at X = -6.46, Y = 5.70, Z = 3.36
    // -------------------------------------------------------------
    try {
      const frameGroup = new T.Group();
      frameGroup.name = 'wall-picture-frame-4';
      frameGroup.position.set(-6.46, 5.70, 3.36);
      frameGroup.rotation.y = Math.PI / 2;

      const frameWidth = 1.25;
      const frameHeight = 1.55;

      // Dark outer moulding
      const frameMouldingGeo = new T.Box(frameWidth, frameHeight, 0.06);
      const frameMouldingMat = new T.Material({
        color: 0x121318,
        roughness: 0.45,
        metalness: 0.2
      });
      const moulding = new T.Mesh(frameMouldingGeo, frameMouldingMat);
      moulding.receiveShadow = true;
      moulding.castShadow = true;
      frameGroup.add(moulding);

      // White inner matting border
      const mattingGeo = new T.Box(frameWidth - 0.12, frameHeight - 0.12, 0.065);
      const mattingMat = new T.Material({
        color: 0xf6f4ef,
        roughness: 0.85,
        metalness: 0.0
      });
      const matting = new T.Mesh(mattingGeo, mattingMat);
      frameGroup.add(matting);

      // Modern Geometric AI Artwork (Zero Cylinders / Zero Circles)
      // Features sharp isometric grids, diagonal facet architecture, and clean tech polygons
      const artCanvas = document.createElement('canvas');
      artCanvas.width = 512;
      artCanvas.height = 680;
      const actx = artCanvas.getContext('2d');

      // Gradient background matching purple room aesthetic
      const bgGrad = actx.createLinearGradient(0, 0, 0, artCanvas.height);
      bgGrad.addColorStop(0, '#10111d');
      bgGrad.addColorStop(1, '#1e1428');
      actx.fillStyle = bgGrad;
      actx.fillRect(0, 0, artCanvas.width, artCanvas.height);

      const cx = artCanvas.width / 2;
      const cy = artCanvas.height / 2 - 30;

      // Draw Isometric / Diamond Angular Facets (No Cylinders, No Circles)
      const colors = ['#ff9ebb', '#b3a6ff', '#f0a35e', '#cfc8da'];
      for (let s = 160; s >= 30; s -= 32) {
        actx.save();
        actx.translate(cx, cy);
        actx.rotate(Math.PI / 4);
        actx.strokeStyle = colors[(s / 32) % colors.length];
        actx.lineWidth = 10;
        actx.strokeRect(-s / 2, -s / 2, s, s);
        actx.restore();
      }

      // Diagonal cross-cutting angular lines
      actx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      actx.lineWidth = 3;
      actx.beginPath();
      actx.moveTo(cx - 140, cy - 140);
      actx.lineTo(cx + 140, cy + 140);
      actx.moveTo(cx - 140, cy + 140);
      actx.lineTo(cx + 140, cy - 140);
      actx.stroke();

      // Sharp corner tech brackets
      actx.strokeStyle = '#ff9ebb';
      actx.lineWidth = 4;
      const bSize = 24;
      // Top left
      actx.strokeRect(50, 50, bSize, 0);
      actx.strokeRect(50, 50, 0, bSize);
      // Top right
      actx.strokeRect(artCanvas.width - 50 - bSize, 50, bSize, 0);
      actx.strokeRect(artCanvas.width - 50, 50, 0, bSize);

      // Artwork Typography
      actx.textAlign = 'center';
      actx.font = '700 22px "Space Grotesk", sans-serif';
      actx.fillStyle = '#ffffff';
      actx.fillText('NEURAL ARCHITECTURE', cx, artCanvas.height - 70);

      actx.font = '500 15px "Space Mono", monospace';
      actx.letterSpacing = '3px';
      actx.fillStyle = '#ff9ebb';
      actx.fillText('AI · AGENTS · REPLICAS', cx, artCanvas.height - 40);

      const artTexture = new T.CanvasTexture(artCanvas);
      artTexture.colorSpace = 'srgb';

      const artGeo = new T.Box(frameWidth - 0.28, frameHeight - 0.28, 0.07);
      const artMat = new T.Material({
        map: artTexture,
        roughness: 0.35,
        metalness: 0.1
      });
      const artMesh = new T.Mesh(artGeo, artMat);
      frameGroup.add(artMesh);

      scene.add(frameGroup);
    } catch (err) {
    }

    // -------------------------------------------------------------
    // C. REPLACE CYLINDRICAL/CIRCULAR SHAPES ON WALL FRAME 1
    // The original Frame 1 at [-6.46, 5.70, -2.13] had concentric circle shapes.
    // We overlay a matching geometric angular piece over Frame 1 canvas.
    // -------------------------------------------------------------
    try {
      const overlayGeo = new T.Box(0.04, 1.30, 1.05);
      const canvas1 = document.createElement('canvas');
      canvas1.width = 512;
      canvas1.height = 640;
      const octx = canvas1.getContext('2d');

      // Dark purple gallery background
      octx.fillStyle = '#111222';
      octx.fillRect(0, 0, canvas1.width, canvas1.height);

      // Draw angular geometric diamonds & isometric polygons (No circles, No cylinders)
      const ocx = canvas1.width / 2;
      const ocy = canvas1.height / 2;

      const palette = ['#b3a6ff', '#ff9ebb', '#cfc8da', '#f0a35e'];
      for (let w = 180; w >= 20; w -= 30) {
        octx.save();
        octx.translate(ocx, ocy);
        octx.rotate(Math.PI / 4);
        octx.strokeStyle = palette[(w / 30) % palette.length];
        octx.lineWidth = 8;
        octx.strokeRect(-w / 2, -w / 2, w, w);
        octx.restore();
      }

      // Title
      octx.textAlign = 'center';
      octx.font = '700 20px "Space Grotesk", sans-serif';
      octx.fillStyle = '#ffffff';
      octx.fillText('ISOMETRIC MATRIX', ocx, canvas1.height - 50);

      const overlayTex = new T.CanvasTexture(canvas1);
      overlayTex.colorSpace = 'srgb';

      const overlayMat = new T.Material({
        map: overlayTex,
        roughness: 0.35,
        metalness: 0.1
      });
      const overlayMesh = new T.Mesh(overlayGeo, overlayMat);
      // Position right over Frame 1 face
      overlayMesh.position.set(-6.44, 5.70, -2.13);
      scene.add(overlayMesh);
    } catch (err) {
    }
  }

  /* =========================================================================
   * 2. STATIC VERSION BUTTON
   * ========================================================================= */
  function initStaticViewControl() {
    // Avoid double injection
    if (document.getElementById('static-view-container')) return;

    const staticCtrl = document.createElement('div');
    staticCtrl.id = 'static-view-container';
    staticCtrl.className = 'static-view-container';

    staticCtrl.innerHTML = `
      <button type="button" id="static-view-btn" class="static-view-btn" title="Open fast 2D static version of the website">
        <span>Static Version</span>
      </button>
    `;
    document.body.appendChild(staticCtrl);

    document.getElementById('static-view-btn').addEventListener('click', () => {
      redesignApi.openStatic();
    });

    // Desktop: match the nav's exact height and bottom edge so the two sit on
    // one shared baseline (below 860px the CSS stacks the button above the nav).
    const nav = document.querySelector('nav.index');
    const wide = window.matchMedia('(min-width: 860px)');
    const syncToNav = () => {
      if (!nav || !wide.matches) {
        staticCtrl.style.height = '';
        staticCtrl.style.bottom = '';
        return;
      }
      // offsetHeight + computed bottom ignore the nav's opening transform.
      const h = nav.offsetHeight;
      if (!h) return;
      staticCtrl.style.height = h + 'px';
      staticCtrl.style.bottom = getComputedStyle(nav).bottom;
    };
    syncToNav();
    window.addEventListener('resize', syncToNav);
    if (nav && 'ResizeObserver' in window) new ResizeObserver(syncToNav).observe(nav);
  }

  /* =========================================================================
   * 3. STATIC VIEW: RETURN TO 3D ROOM BUTTON
   * ========================================================================= */
  function injectStaticReturnButton() {
    if (document.getElementById('static-return-btn')) return;

    const returnBar = document.createElement('div');
    returnBar.className = 'static-return-bar';
    returnBar.innerHTML = `
      <div class="static-return-inner">
        <span class="static-badge">Static 2D Mode</span>
        <button type="button" id="static-return-btn" class="static-return-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
          <span>Enter 3D Interactive Room</span>
        </button>
      </div>
    `;
    document.body.prepend(returnBar);

    document.getElementById('static-return-btn').addEventListener('click', () => {
      redesignApi.open3D();
    });
  }

})();
