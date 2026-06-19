export function initLeaderboard() {
  const containers = document.querySelectorAll('.autoscroll-container');
  const boardWrappers = document.querySelectorAll('.bowling-leaderboard-wrapper');

  containers.forEach((container, index) => {
    const scrollContainer = container as HTMLElement;
    const baseSpeed = Number(scrollContainer.dataset.baseSpeed) || 35; 
    const parentWrapper = boardWrappers[index];
    
    let currentScrollTop = 0;
    let lastTimestamp: number | null = null;
    let animationFrameId: number;
    let isHovered = false;
    let speedMultiplier = 1; 

    if (parentWrapper) {
      // 1. SPEED BUTTON LOGIC
      const speedButtons = parentWrapper.querySelectorAll('.speed-btn');
      speedButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          speedButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          
          speedMultiplier = Number(target.dataset.multiplier);
          lastTimestamp = null; 
        });
      });

      // 2. THEME BUTTON LOGIC
      const themeButtons = parentWrapper.querySelectorAll('.theme-btn');
      themeButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          themeButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          
          const newTheme = target.dataset.theme;
          parentWrapper.className = `bowling-leaderboard-wrapper theme-${newTheme}`;
          lastTimestamp = null;
        });
      });
    }

    // Freeze track loops on row hover
    scrollContainer.addEventListener('mouseenter', () => {
      isHovered = true;
      lastTimestamp = null; 
    });
    
    scrollContainer.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    function step(timestamp: number) {
      if (isHovered || speedMultiplier === 0) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsedSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const halfHeight = scrollContainer.scrollHeight / 2;
      currentScrollTop += (baseSpeed * speedMultiplier) * elapsedSeconds;

      if (currentScrollTop >= halfHeight) {
        currentScrollTop -= halfHeight;
      }

      scrollContainer.scrollTop = currentScrollTop;
      animationFrameId = requestAnimationFrame(step);
    }

    animationFrameId = requestAnimationFrame(step);
    scrollContainer.addEventListener('destroy', () => cancelAnimationFrame(animationFrameId));
  });
}
