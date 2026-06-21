// src/scripts/leaderboard.ts

export function initLeaderboard() {
  const containers = document.querySelectorAll('.autoscroll-container');
  const boardWrappers = document.querySelectorAll('.bowling-leaderboard-wrapper');

  containers.forEach((container, index) => {
    const scrollContainer = container as HTMLElement;
    const baseSpeed = Number(scrollContainer.dataset.baseSpeed) || 35; 
    
    // Type cast the generic Element to an HTMLElement to satisfy TypeScript
    const parentWrapper = boardWrappers[index] as HTMLElement;
    
    // Read the remote target CSV URL passed from the template prop attribute
    const remoteCsvUrl = scrollContainer.getAttribute('data-csv-url');

    let currentScrollTop = 0;
    let lastTimestamp: number | null = null;
    let animationFrameId: number;
    let isHovered = false;
    let speedMultiplier = 1; 

    // Handle user control panel actions (Speed, High Score Threshold, Themes)
    if (parentWrapper) {
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

      const thresholdInput = parentWrapper.querySelector('#high-score-input') as HTMLInputElement;
      if (thresholdInput) {
        thresholdInput.addEventListener('input', () => updateHighScoreVisuals(parentWrapper, Number(thresholdInput.value)));
      }

      const themeButtons = parentWrapper.querySelectorAll('.theme-btn');
      themeButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const target = e.currentTarget as HTMLButtonElement;
          themeButtons.forEach(b => b.classList.remove('active'));
          target.classList.add('active');
          parentWrapper.className = `bowling-leaderboard-wrapper theme-${target.dataset.theme}`;
          lastTimestamp = null;
        });
      });
    }

    // ----------------------------------------------------
    // LIVE STATIC HOST POLLING ENGINE
    // ----------------------------------------------------
    async function pollLiveScores() {
      if (!remoteCsvUrl || isHovered) return;

      try {
        // Fetch raw URL using clean cache-control headers to prevent Google 307 redirects
        const response = await fetch(remoteCsvUrl, {
          method: 'GET',
          cache: 'no-store', 
          redirect: 'follow',
          headers: {
            'Accept': 'text/csv, text/plain, */*'
          }
        });

        if (!response.ok) {
          console.warn(`Google Sheets connection throttled. Code: ${response.status}`);
          return;
        }
        
        const csvText = await response.text();
        
        // Safety lock: Verify the response isn't a login screen html error panel
        if (csvText.trim().startsWith('<!DOCTYPE html>')) {
          console.error("CORS Fault: Verify your Google Sheet is still set to 'Public' and Published to Web.");
          return;
        }

        const freshTeams = parseCsvOnClient(csvText);
        if (freshTeams.length === 0) return;

        // Mirror data to account for the duplicated infinite scrolling row track canvas
        const loopingTeams = [...freshTeams, ...freshTeams];
        const uiRows = scrollContainer.querySelectorAll('.autoscroll-row');
        const thresholdInput = parentWrapper?.querySelector('#high-score-input') as HTMLInputElement;
        const currentThreshold = thresholdInput ? Number(thresholdInput.value) : 250;

        loopingTeams.forEach((teamData, rowIndex) => {
          const rowEl = uiRows[rowIndex] as HTMLElement;
          if (!rowEl) return;

          const titleEl = rowEl.querySelector('.row-team-text');
          if (titleEl && titleEl.textContent !== teamData.team) titleEl.textContent = teamData.team;

          const rankEl = rowEl.querySelector('.rank-tag');
          if (rankEl && rankEl.textContent !== `#${teamData.rank}`) rankEl.textContent = `#${teamData.rank}`;

          const scratchEl = rowEl.querySelector('.scratch-total');
          if (scratchEl && scratchEl.textContent !== String(teamData.scratchTotal)) scratchEl.textContent = String(teamData.scratchTotal);

          const handicapEl = rowEl.querySelector('.handicap-total');
          if (handicapEl && handicapEl.textContent !== String(teamData.handicapTotal)) handicapEl.textContent = String(teamData.handicapTotal);

          // Loop over individual games dynamically (g1 to g9)
          Object.keys(teamData).forEach((key) => {
            if (!['team', 'rank', 'scratchTotal', 'handicapTotal'].includes(key)) {
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

        if (parentWrapper) updateHighScoreVisuals(parentWrapper, currentThreshold);
      } catch (err) {
        console.warn("Background refresh throttled:", err);
      }
    }

    // Zero-dependency client-side CSV parser
    function parseCsvOnClient(text: string) {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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

      // Keep rows properly ordered mathematically by rank
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

    // Poll the raw data source every 30 seconds
    const pollingInterval = setInterval(pollLiveScores, 30000);

    // Continuous Animation Loops Frame Engine Tracking
    scrollContainer.addEventListener('mouseenter', () => { isHovered = true; lastTimestamp = null; });
    scrollContainer.addEventListener('mouseleave', () => { isHovered = false; });

    function step(timestamp: number) {
      // Freeze calculations if row hover condition is active or if tracker is manually paused
      if (isHovered || speedMultiplier === 0) {
        animationFrameId = requestAnimationFrame(step);
        return;
      }

      // 5-SECOND INCEPTION DELAY LOCK
      // Keeps scrolling frozen at top ranks until 5000 milliseconds have elapsed since load
      if (timestamp < 5000) {
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

    // Initialize animation engine
    animationFrameId = requestAnimationFrame(step);
    
    // Component lifecycle unmounting cleanup
    scrollContainer.addEventListener('destroy', () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(pollingInterval);
    });
  });
}
