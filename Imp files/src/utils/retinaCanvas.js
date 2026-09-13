// Retina Canvas & Grad-CAM Image Generator Engine

/**
 * Draws a realistic ophthalmic fundus image onto a canvas
 */
export function drawFundusOnCanvas(canvas, options = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width || 400;
  const height = canvas.height || 400;
  const grade = options.grade ?? 2;
  const eye = options.eye || 'OD'; // OD (Right eye) or OS (Left eye)
  const isRedFree = options.isRedFree || false;

  ctx.clearRect(0, 0, width, height);

  // 1. Circular Mask
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.47;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  // 2. Base Fundus Background
  if (isRedFree) {
    // Green Red-free Filter Mode (standard ophthalmic exam mode)
    const bgGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius);
    bgGrad.addColorStop(0, '#5ea876');
    bgGrad.addColorStop(0.7, '#3c7952');
    bgGrad.addColorStop(1, '#1b3e27');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Color Fundus Photography (CFP)
    const bgGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius);
    bgGrad.addColorStop(0, '#ea580c');
    bgGrad.addColorStop(0.5, '#c2410c');
    bgGrad.addColorStop(0.85, '#9a3412');
    bgGrad.addColorStop(1, '#501705');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Optic Disc Position (OD is nasal/on right side, OS is nasal/on left side)
  const opticDiscX = eye === 'OD' ? centerX + radius * 0.45 : centerX - radius * 0.45;
  const opticDiscY = centerY - radius * 0.05;
  const opticDiscRadius = radius * 0.22;

  // 4. Draw Macula & Fovea (Temporal to optic disc)
  const maculaX = eye === 'OD' ? centerX - radius * 0.18 : centerX + radius * 0.18;
  const maculaY = centerY + radius * 0.02;
  const maculaRadius = radius * 0.25;

  // Draw Macular lutea glow
  const maculaGrad = ctx.createRadialGradient(maculaX, maculaY, 2, maculaX, maculaY, maculaRadius);
  if (isRedFree) {
    maculaGrad.addColorStop(0, 'rgba(15, 45, 25, 0.7)');
    maculaGrad.addColorStop(1, 'rgba(15, 45, 25, 0)');
  } else {
    maculaGrad.addColorStop(0, 'rgba(67, 20, 7, 0.7)');
    maculaGrad.addColorStop(0.5, 'rgba(154, 52, 18, 0.3)');
    maculaGrad.addColorStop(1, 'rgba(194, 65, 12, 0)');
  }
  ctx.fillStyle = maculaGrad;
  ctx.beginPath();
  ctx.arc(maculaX, maculaY, maculaRadius, 0, Math.PI * 2);
  ctx.fill();

  // Foveal reflex (tiny center highlight)
  ctx.fillStyle = isRedFree ? 'rgba(255,255,255,0.4)' : 'rgba(254, 215, 170, 0.6)';
  ctx.beginPath();
  ctx.arc(maculaX, maculaY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 5. Draw Optic Disc
  const discGrad = ctx.createRadialGradient(opticDiscX, opticDiscY, opticDiscRadius * 0.2, opticDiscX, opticDiscY, opticDiscRadius);
  if (isRedFree) {
    discGrad.addColorStop(0, '#e2e8f0');
    discGrad.addColorStop(0.6, '#cbd5e1');
    discGrad.addColorStop(1, '#94a3b8');
  } else {
    discGrad.addColorStop(0, '#fef08a');
    discGrad.addColorStop(0.5, '#fde047');
    discGrad.addColorStop(0.85, '#fb923c');
    discGrad.addColorStop(1, '#ea580c');
  }
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(opticDiscX, opticDiscY, opticDiscRadius, 0, Math.PI * 2);
  ctx.fill();

  // Optic Cup (central pale area)
  ctx.fillStyle = isRedFree ? '#f8fafc' : '#fef9c3';
  ctx.beginPath();
  ctx.arc(opticDiscX, opticDiscY, opticDiscRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // 6. Draw Retinal Blood Vessels (Superior & Inferior Arcades)
  const vesselColor = isRedFree ? '#0f172a' : '#7f1d1d';
  const arterioleColor = isRedFree ? '#1e293b' : '#991b1b';

  function drawVesselBranch(startX, startY, controlX1, controlY1, controlX2, controlY2, endX, endY, strokeWidth, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
    ctx.stroke();
  }

  // Superior temporal arcade
  const dir = eye === 'OD' ? -1 : 1;
  drawVesselBranch(
    opticDiscX, opticDiscY,
    opticDiscX + dir * radius * 0.3, opticDiscY - radius * 0.55,
    maculaX + dir * radius * 0.1, opticDiscY - radius * 0.65,
    maculaX + dir * radius * 0.65, centerY - radius * 0.35,
    5, vesselColor
  );
  drawVesselBranch(
    opticDiscX + 2, opticDiscY - 2,
    opticDiscX + dir * radius * 0.35, opticDiscY - radius * 0.48,
    maculaX, opticDiscY - radius * 0.55,
    maculaX + dir * radius * 0.55, centerY - radius * 0.3,
    3.5, arterioleColor
  );

  // Inferior temporal arcade
  drawVesselBranch(
    opticDiscX, opticDiscY,
    opticDiscX + dir * radius * 0.3, opticDiscY + radius * 0.55,
    maculaX + dir * radius * 0.1, opticDiscY + radius * 0.65,
    maculaX + dir * radius * 0.65, centerY + radius * 0.35,
    5.5, vesselColor
  );
  drawVesselBranch(
    opticDiscX - 2, opticDiscY + 2,
    opticDiscX + dir * radius * 0.35, opticDiscY + radius * 0.48,
    maculaX, opticDiscY + radius * 0.55,
    maculaX + dir * radius * 0.55, centerY + radius * 0.3,
    3.5, arterioleColor
  );

  // Nasal branches
  drawVesselBranch(
    opticDiscX, opticDiscY,
    opticDiscX - dir * radius * 0.2, opticDiscY - radius * 0.4,
    opticDiscX - dir * radius * 0.35, opticDiscY - radius * 0.45,
    opticDiscX - dir * radius * 0.45, opticDiscY - radius * 0.35,
    3.5, vesselColor
  );
  drawVesselBranch(
    opticDiscX, opticDiscY,
    opticDiscX - dir * radius * 0.2, opticDiscY + radius * 0.4,
    opticDiscX - dir * radius * 0.35, opticDiscY + radius * 0.45,
    opticDiscX - dir * radius * 0.45, opticDiscY + radius * 0.35,
    3.5, vesselColor
  );

  // 7. Draw Pathology / Lesions based on DR Grade
  if (grade >= 1) {
    // Grade 1+: Microaneurysms (Tiny red dots)
    const maColor = isRedFree ? '#020617' : '#991b1b';
    const maCount = grade === 1 ? 6 : grade === 2 ? 18 : grade === 3 ? 35 : 55;
    
    // Seeded locations around macula and arcades
    for (let i = 0; i < maCount; i++) {
      const angle = (i * 137.5) * (Math.PI / 180);
      const dist = (0.2 + (i % 7) * 0.08) * radius;
      const maX = maculaX + Math.cos(angle) * dist;
      const maY = maculaY + Math.sin(angle) * dist;
      
      ctx.fillStyle = maColor;
      ctx.beginPath();
      ctx.arc(maX, maY, 1.8 + (i % 3) * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (grade >= 2) {
    // Grade 2+: Hard Exudates (Waxy yellow lipid deposits) & Blot Hemorrhages
    const exudateColor = isRedFree ? '#ffffff' : '#fef08a';
    const exudateBorder = isRedFree ? '#cbd5e1' : '#eab308';
    
    // Circinate ring around macula
    const exudatePoints = [
      { x: maculaX + 35, y: maculaY - 25, r: 4 },
      { x: maculaX + 48, y: maculaY - 15, r: 6 },
      { x: maculaX + 52, y: maculaY + 5, r: 5 },
      { x: maculaX + 42, y: maculaY + 28, r: 6.5 },
      { x: maculaX + 22, y: maculaY + 36, r: 4.5 },
      { x: maculaX - 30, y: maculaY + 28, r: 5 },
      { x: maculaX - 45, y: maculaY + 5, r: 7 },
      { x: maculaX - 35, y: maculaY - 20, r: 4 },
    ];

    exudatePoints.forEach(pt => {
      ctx.fillStyle = exudateColor;
      ctx.strokeStyle = exudateBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Blot hemorrhages (Larger dark red spots)
    const blotColor = isRedFree ? '#000000' : '#7f1d1d';
    const blots = [
      { x: maculaX - 25, y: maculaY - 45, rx: 7, ry: 5 },
      { x: maculaX + 60, y: maculaY + 45, rx: 9, ry: 6 },
      { x: opticDiscX - dir * 40, y: opticDiscY + 60, rx: 8, ry: 6 },
    ];

    blots.forEach(b => {
      ctx.fillStyle = blotColor;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (grade >= 3) {
    // Grade 3+: Cotton Wool Spots (Fluffy whitish ischemic nerve fiber infarcts)
    const cwsColor = isRedFree ? 'rgba(255, 255, 255, 0.9)' : 'rgba(248, 250, 252, 0.85)';
    const cws = [
      { x: maculaX - 55, y: maculaY - 35, r: 14 },
      { x: maculaX + 65, y: maculaY - 50, r: 12 },
      { x: opticDiscX - dir * 25, y: opticDiscY - 55, r: 16 },
    ];

    cws.forEach(c => {
      const grad = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, c.r);
      grad.addColorStop(0, cwsColor);
      grad.addColorStop(0.7, isRedFree ? 'rgba(255,255,255,0.4)' : 'rgba(254, 240, 138, 0.4)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Extensive flame hemorrhages
    ctx.strokeStyle = isRedFree ? '#000000' : '#991b1b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(maculaX + 40, maculaY - 60);
    ctx.lineTo(maculaX + 65, maculaY - 75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(maculaX - 40, maculaY + 60);
    ctx.lineTo(maculaX - 70, maculaY + 80);
    ctx.stroke();
  }

  if (grade === 4) {
    // Grade 4: Proliferative DR - Neovascularization fronds at optic disc (NVD) & elsewhere (NVE)
    const neoColor = isRedFree ? '#090d16' : '#f43f5e';
    ctx.strokeStyle = neoColor;
    ctx.lineWidth = 2.2;
    
    // NVD vessel tangles
    for (let k = 0; k < 6; k++) {
      const angle = k * 1.0;
      ctx.beginPath();
      ctx.moveTo(opticDiscX, opticDiscY);
      ctx.bezierCurveTo(
        opticDiscX + Math.cos(angle) * 20, opticDiscY + Math.sin(angle) * 20,
        opticDiscX + Math.sin(angle) * 35, opticDiscY + Math.cos(angle) * 35,
        opticDiscX + Math.cos(angle) * 45, opticDiscY + Math.sin(angle) * 45
      );
      ctx.stroke();
    }

    // Preretinal vitreous bleed
    const bleedGrad = ctx.createRadialGradient(opticDiscX - dir * 20, opticDiscY + 45, 5, opticDiscX - dir * 20, opticDiscY + 45, 30);
    bleedGrad.addColorStop(0, isRedFree ? '#000' : 'rgba(127, 29, 29, 0.95)');
    bleedGrad.addColorStop(0.8, isRedFree ? '#1e293b' : 'rgba(153, 27, 27, 0.8)');
    bleedGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bleedGrad;
    ctx.beginPath();
    ctx.arc(opticDiscX - dir * 20, opticDiscY + 45, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Renders a Grad-CAM Heatmap overlay onto a canvas
 */
export function drawGradcamOnCanvas(canvas, hotspots = [], opacity = 0.65) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width || 400;
  const height = canvas.height || 400;

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.47;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.globalAlpha = opacity;

  hotspots.forEach(spot => {
    const x = (spot.x / 100) * width;
    const y = (spot.y / 100) * height;
    const r = ((spot.radius || 25) / 100) * width;
    const intensity = spot.intensity || 0.8;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    // Grad-CAM Jet/Turbo Color palette
    if (intensity > 0.8) {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)'); // Red peak
      grad.addColorStop(0.35, 'rgba(249, 115, 22, 0.8)'); // Orange
      grad.addColorStop(0.65, 'rgba(234, 179, 8, 0.6)'); // Yellow
      grad.addColorStop(0.85, 'rgba(6, 182, 212, 0.3)'); // Cyan
      grad.addColorStop(1, 'rgba(59, 130, 246, 0)'); // Blue / transparent
    } else if (intensity > 0.5) {
      grad.addColorStop(0, 'rgba(249, 115, 22, 0.85)');
      grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.7)');
      grad.addColorStop(0.75, 'rgba(16, 185, 129, 0.4)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    } else {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.7)');
      grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.5)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
