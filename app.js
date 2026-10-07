/**
 * Amul Kool Rose - Pure Product Scroll Animation Engine
 * Seamless 204-frame sequence synchronized precisely with scroll position.
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 204;
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';

  const canvas = document.getElementById('bottleCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const scrollContainer = document.getElementById('scroll-container');

  const images = [];
  let currentFrame = 0;
  let targetFrame = 0;
  let lastRenderedIndex = -1;
  let firstFrameLoaded = false;
  let bgColor = '#f8bcd0';

  // Format filename: ezgif-frame-001.jpg -> ezgif-frame-204.jpg
  function getFrameSrc(index) {
    const num = String(index + 1).padStart(3, '0');
    return `${FRAME_PREFIX}${num}${FRAME_EXT}`;
  }

  // Sample exact background color from image corner to blend edges seamlessly
  function sampleBgColor(img) {
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 4;
      offscreen.height = 4;
      const offCtx = offscreen.getContext('2d');
      offCtx.drawImage(img, 0, 0, 4, 4);
      const pixel = offCtx.getImageData(0, 0, 1, 1).data;
      bgColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      document.body.style.backgroundColor = bgColor;
      document.documentElement.style.backgroundColor = bgColor;
    } catch (e) {
      bgColor = '#f8bcd0';
    }
  }

  // High-DPI canvas sizing & sharp rendering
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    render(Math.round(currentFrame));
  }

  // Render specific frame with centered proportions
  function render(frameIndex) {
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    let img = images[clampedIndex];

    // If frame is still downloading, use the closest loaded frame to avoid flickering
    if (!img || !img.complete || img.naturalWidth === 0) {
      if (lastRenderedIndex >= 0 && images[lastRenderedIndex] && images[lastRenderedIndex].complete) {
        img = images[lastRenderedIndex];
      } else {
        return;
      }
    } else {
      lastRenderedIndex = clampedIndex;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // High-impact full-cover scaling: completely covers viewport without leaving blank margins
    const scale = Math.max(cw / iw, ch / ih);

    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;
    const sy = (ch - sh) / 2;

    // Fill background with matching studio pink to prevent blank borders
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cw, ch);

    // Draw the high-resolution frame centered
    ctx.drawImage(img, 0, 0, iw, ih, sx, sy, sw, sh);
  }

  // Preload all 204 frames in background with immediate display of frame 1
  function preloadImages() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = 'async';

      img.onload = () => {
        if (i === 0 && !firstFrameLoaded) {
          firstFrameLoaded = true;
          sampleBgColor(img);
          resizeCanvas();
          render(0);
        }
      };

      img.src = getFrameSrc(i);
      images.push(img);
    }

    // In case first frame was already cached
    if (images[0] && images[0].complete && images[0].naturalWidth > 0 && !firstFrameLoaded) {
      firstFrameLoaded = true;
      sampleBgColor(images[0]);
      resizeCanvas();
      render(0);
    }
  }

  // Calculate current scroll progress from 0.0 to 1.0
  function getScrollProgress() {
    const scrollDistance = scrollContainer.offsetHeight - window.innerHeight;
    if (scrollDistance <= 0) return 0;
    const scrolled = window.pageYOffset || document.documentElement.scrollTop || 0;
    return Math.max(0, Math.min(1, scrolled / scrollDistance));
  }

  const heroTitleOverlay = document.getElementById('scroll-hero-title');

  // Fade headline and subheading away as user scrolls up to 30% of scroll section
  function updateHeroTitle(progress) {
    if (!heroTitleOverlay) return;
    const fadeThreshold = 0.30; // 30% of scroll animation section
    if (progress <= 0) {
      heroTitleOverlay.style.opacity = '1';
      heroTitleOverlay.style.transform = 'translateY(0px)';
      heroTitleOverlay.style.visibility = 'visible';
    } else if (progress >= fadeThreshold) {
      heroTitleOverlay.style.opacity = '0';
      heroTitleOverlay.style.transform = 'translateY(-24px)';
      heroTitleOverlay.style.visibility = 'hidden';
    } else {
      const remainingRatio = 1 - (progress / fadeThreshold);
      heroTitleOverlay.style.opacity = remainingRatio.toFixed(3);
      heroTitleOverlay.style.transform = `translateY(${-24 * (1 - remainingRatio)}px)`;
      heroTitleOverlay.style.visibility = 'visible';
    }
  }

  const navbar = document.getElementById('main-navbar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 40) {
      navbar.classList.add('bg-surface/85', 'shadow-sm', 'border-outline-variant/30');
      navbar.classList.remove('bg-surface/35', 'border-white/20');
    } else {
      navbar.classList.add('bg-surface/35', 'border-white/20');
      navbar.classList.remove('bg-surface/85', 'shadow-sm', 'border-outline-variant/30');
    }
  }

  // Update target frame based on user scroll
  function onScroll() {
    const progress = getScrollProgress();
    targetFrame = progress * (TOTAL_FRAMES - 1);
    updateHeroTitle(progress);
    updateNavbar();
  }

  // Smooth scroll handler for navigation menu links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
          if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
          }
        }
      }
    });
  });

  // Mobile drawer toggle
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Physics animation loop using requestAnimationFrame and lerp damping
  function animationLoop() {
    const delta = targetFrame - currentFrame;
    if (Math.abs(delta) > 0.001) {
      // 0.22 lerp provides an immediate, responsive, weighted product scrub
      currentFrame += delta * 0.22;
      render(Math.round(currentFrame));
    } else if (currentFrame !== targetFrame) {
      currentFrame = targetFrame;
      render(Math.round(currentFrame));
    }

    requestAnimationFrame(animationLoop);
  }

  // Event Listeners
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  // Initialize
  preloadImages();
  resizeCanvas();
  onScroll();
  requestAnimationFrame(animationLoop);
})();
