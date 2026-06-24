// src/scripts/leaderboard.ts

export function initLeaderboard() {
  const containers = document.querySelectorAll('.autoscroll-container');
  const boardWrappers = document.querySelectorAll(
    '.bowling-leaderboard-wrapper',
  );

  containers.forEach((container, index) => {
    const scrollContainer = container as HTMLElement;
    const baseSpeed = Number(scrollContainer.dataset.baseSpeed) || 35;
    const parentWrapper = boardWrappers[index] as HTMLElement;
    const remoteCsvUrl = scrollContainer.getAttribute('data-csv-url');

    let currentScrollTop = 0;
    let lastTimestamp: number | null = null;
    let animationFrameId: number;
    let isHovered = false;

    // INITIAL STATE FALLBACK PARSING FROM LOCAL STORAGE
    let speedMultiplier =
      localStorage.getItem('tickerSpeed') !== null
        ? Number(localStorage.getItem('tickerSpeed'))
        : 1;

    const savedTheme = localStorage.getItem('tickerTheme') || 'neon';

    // ----------------------------------------------------
    // STORAGE RETRIEVAL & BUTTON UI SYNCHRONIZATION
    // ----------------------------------------------------
    if (parentWrapper) {
      // 1. Initialize Saved Theme Setup configurations
      parentWrapper.className = `bowling-leaderboard-wrapper theme-${savedTheme}`;
      const themeButtons = parentWrapper.querySelectorAll('.theme-btn');
      themeButtons.forEach((btn) => {
        const el = btn as HTMLButtonElement;
        if (el.dataset.theme === savedTheme) el.classList.add('active');

        el.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          themeButtons.forEach((b) => b.classList.remove('active'));
          target.classList.add('active');

          const newTheme = target.dataset.theme || 'neon';
          parentWrapper.className = `bowling-leaderboard-wrapper theme-${newTheme}`;
          localStorage.setItem('tickerTheme', newTheme); // Persistence Save
          lastTimestamp = null;
        });
      });

      // 2. Initialize Saved Speed Buttons Setup configurations
      const speedButtons = parentWrapper.querySelectorAll('.speed-btn');
      speedButtons.forEach((btn) => {
        const el = btn as HTMLButtonElement;
        if (Number(el.dataset.multiplier) === speedMultiplier)
          el.classList.add('active');

        el.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          speedButtons.forEach((b) => b.classList.remove('active'));
          target.classList.add('active');

          speedMultiplier = Number(target.dataset.multiplier);
          localStorage.setItem('tickerSpeed', String(speedMultiplier)); // Persistence Save
          lastTimestamp = null;
        });
      });

      // 3. Initialize High Score Alert Threshold Field Configs
      const thresholdInput = parentWrapper.querySelector(
        '#high-score-input',
      ) as HTMLInputElement;
      if (thresholdInput) {
        const defaultFallback =
          Number(thresholdInput.getAttribute('data-default-threshold')) || 250;
        const savedThreshold =
          localStorage.getItem('tickerHighScore') !== null
            ? Number(localStorage.getItem('tickerHighScore'))
            : defaultFallback;

        thresholdInput.value = String(savedThreshold);
        updateHighScoreVisuals(parentWrapper, savedThreshold);

        thresholdInput.addEventListener('input', () => {
          const currentVal = Number(thresholdInput.value) || 0;
          updateHighScoreVisuals(parentWrapper, currentVal);
          localStorage.setItem('tickerHighScore', String(currentVal)); // Persistence Save
        });
      }
    }

    // ----------------------------------------------------
    // BACKGROUND LIVE POLLING ENGINE
    // ----------------------------------------------------
    async function pollLiveScores() {
      if (!remoteCsvUrl || isHovered) return;

      try {
        const response = await fetch(remoteCsvUrl, {
          method: 'GET',
          cache: 'no-store',
          redirect: 'follow',
          headers: { Accept: 'text/csv, text/plain, */*' },
        });

        if (!response.ok) return;
        const csvText = await response.text();

        if (csvText.trim().startsWith('<!DOCTYPE html>')) return;

        const freshTeams = parseCsvOnClient(csvText);
        if (freshTeams.length === 0) return;

        const loopingTeams = [...freshTeams, ...freshTeams];
        const uiRows = scrollContainer.querySelectorAll('.autoscroll-row');

        const thresholdInput = parentWrapper?.querySelector(
          '#high-score-input',
        ) as HTMLInputElement;
        const currentThreshold = thresholdInput
          ? Number(thresholdInput.value)
          : 250;

        loopingTeams.forEach((teamData, rowIndex) => {
          const rowEl = uiRows[rowIndex] as HTMLElement;
          if (!rowEl) return;

          const titleEl = rowEl.querySelector('.row-team-text');
          if (titleEl && titleEl.textContent !== teamData.team)
            titleEl.textContent = teamData.team;

          const rankEl = rowEl.querySelector('.rank-tag');
          if (rankEl && rankEl.textContent !== `#${teamData.rank}`)
            rankEl.textContent = `#${teamData.rank}`;

          const scratchEl = rowEl.querySelector('.scratch-total');
          if (
            scratchEl &&
            scratchEl.textContent !== String(teamData.scratchTotal)
          )
            scratchEl.textContent = String(teamData.scratchTotal);

          const handicapEl = rowEl.querySelector('.handicap-total');
          if (
            handicapEl &&
            handicapEl.textContent !== String(teamData.handicapTotal)
          )
            handicapEl.textContent = String(teamData.handicapTotal);

          Object.keys(teamData).forEach((key) => {
            if (
              !['team', 'rank', 'scratchTotal', 'handicapTotal'].includes(key)
            ) {
              const cell = rowEl.querySelector(`.game-${key}`);
              if (cell) {
                const currentScore = teamData[key];
                if (cell.textContent !== String(currentScore)) {
                  cell.textContent = String(currentScore);
                  cell.setAttribute('data-score', String(currentScore));
                }
              }
            }
          });
        });

        if (parentWrapper)
          updateHighScoreVisuals(parentWrapper, currentThreshold);
      } catch (err) {
        console.warn('Background refresh throttled:', err);
      }
    }

    function parseCsvOnClient(text: string) {
      const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length < 2) return [];

      const headers = lines[0].split(',');
      const records: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(',');
        const obj: any = {};

        headers.forEach((header, colIndex) => {
          const val = columns[colIndex];
          if (header === 'team') {
            obj[header] = val;
          } else {
            obj[header] = Number(val) || 0;
          }
        });
        records.push(obj);
      }
      return records.sort((a, b) => a.rank - b.rank);
    }

    function updateHighScoreVisuals(wrapper: HTMLElement, threshold: number) {
      const scoreBadges = wrapper.querySelectorAll('.game-score');
      scoreBadges.forEach((badge) => {
        const el = badge as HTMLElement;
        const scoreVal = Number(el.dataset.score) || 0;
        if (scoreVal >= threshold) {
          el.classList.add('high-score-flash');
        } else {
          el.classList.remove('high-score-flash');
        }
      });
    }

    const pollingInterval = setInterval(pollLiveScores, 30000);

    // Continuous Animation Frame Mechanics
    scrollContainer.addEventListener('mouseenter', () => {
      isHovered = true;
      lastTimestamp = null;
    });
    scrollContainer.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    // Tracking variables for handling the page scroll pause mechanics
    let isPagePaused = false;
    let pagePauseStartTime: number | null = null;
    let nextPauseScrollTop = scrollContainer.clientHeight;

    function step(timestamp: number) {
      // Freeze calculations if row hover condition is active or if tracker is manually paused
      if (isHovered || speedMultiplier === 0) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      // 1. INITIAL 5-SECOND INCEPTION DELAY LOCK
      // Keeps scrolling frozen at top ranks until 5000 milliseconds have elapsed since load
      if (timestamp < 5000) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      // 2. PAGE BREAK 5-SECOND PAUSE ENGAGEMENT
      if (isPagePaused) {
        if (!pagePauseStartTime) pagePauseStartTime = timestamp;

        const pausedElapsed = timestamp - pagePauseStartTime;
        if (pausedElapsed < 2000) {
          animationFrameId = requestAnimationFrame(step);
          return;
        } else {
          isPagePaused = false;
          pagePauseStartTime = null;
          lastTimestamp = timestamp; // Reset delta timeline to avoid a speed jump

          // Calculate the next target scroll checkpoint
          const halfHeight = scrollContainer.scrollHeight / 2;
          nextPauseScrollTop =
            scrollContainer.scrollTop + scrollContainer.clientHeight;

          // If the next calculated checkpoint steps past the loop boundary, clip it precisely to the midpoint
          if (nextPauseScrollTop >= halfHeight) {
            nextPauseScrollTop = halfHeight;
          }
        }
      }

      if (!lastTimestamp) lastTimestamp = timestamp;
      const elapsedSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const halfHeight = scrollContainer.scrollHeight / 2;
      currentScrollTop += baseSpeed * speedMultiplier * elapsedSeconds;

      // 3. PAGE CHECKPOINT & WRAP-AROUND DETECTOR HOOK
      if (currentScrollTop >= nextPauseScrollTop) {
        // Check if this specific checkpoint matches the actual mirror loop midpoint boundary
        if (nextPauseScrollTop >= halfHeight) {
          // REMOVED PAUSE FLAGS HERE: Teleport container tracking back to 0 instantly
          currentScrollTop -= halfHeight;
          scrollContainer.scrollTop = currentScrollTop;

          // Set the next checkpoint for the first page of the new loop, and continue scrolling immediately
          nextPauseScrollTop = scrollContainer.clientHeight;
          lastTimestamp = timestamp;
        } else {
          // Standard page break: snap to checkpoint and engage the 5-second pause frame
          currentScrollTop = nextPauseScrollTop;
          scrollContainer.scrollTop = currentScrollTop;

          isPagePaused = true;
          pagePauseStartTime = timestamp;
        }

        animationFrameId = requestAnimationFrame(step);
        return;
      }

      // 4. MIDPOINT SAFETY CLEANUP DRIFT EMERGENCIES
      if (currentScrollTop >= halfHeight) {
        currentScrollTop -= halfHeight;
        nextPauseScrollTop = scrollContainer.clientHeight;
        lastTimestamp = timestamp;
      }

      scrollContainer.scrollTop = currentScrollTop;
      animationFrameId = requestAnimationFrame(step);
    }

    animationFrameId = requestAnimationFrame(step);

    scrollContainer.addEventListener('destroy', () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pollingInterval);
    });
  });
}
