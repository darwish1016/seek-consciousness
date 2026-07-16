// Four full-screen chapters share one sticky portal background.
  // Four equal scroll chapters give every hero message exactly one viewport
  // to arrive, hold, and leave. Scroll position drives clean text crossfades,
  // gentle vertical drift, camera push, glow,
  // and the moment when the navigation returns.
  const header = document.getElementById('siteHeader');
  const invitationHero = document.querySelector('.hero-invitation');
  const heroStage = document.querySelector('.hero-stage');
  const heroImage = document.querySelector('.hero-invitation .hero-background-video');
  const heroPanels = [...document.querySelectorAll('.hero-panel')];
  const heroScrollCue = document.querySelector('[data-hero-scroll-cue]');
  const recognitionExperience =
    document.querySelector('.recognition-experience');
  const recognitionHeadline =
    document.querySelector('.recognition-headline');
  const recognitionQuestionLineOne =
    document.querySelector('.recognition-question-line-one');
  const recognitionQuestionLineTwo =
    document.querySelector('.recognition-question-line-two');
  const recognitionQuestionMark =
    document.querySelector('.recognition-question-mark');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let heroTicking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smoothstep = value => {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  };

  // One-message-at-a-time cinematic sequence.
  // The current message fades out completely, the artwork holds alone for a
  // brief beat, and only then does the next message fade in. This guarantees
  // that two phrases never appear on screen at the same time.
  function chapterState(progress, index){
    const chapterCount = Math.max(1, heroPanels.length);

    /*
      The hero has four scrollable viewports and four messages.
      Therefore every message owns one identical viewport interval.
    */
    const chapterPosition = clamp(progress) * chapterCount;
    const local = chapterPosition - index;

    if (local < 0 || local > 1){
      return { opacity:0, travel:0, scale:1 };
    }

    const fadeInEnd = 0.16;
    const fadeOutStart = 0.78;
    const fadeOutEnd = 0.94;

    const enter = index === 0
      ? 1
      : smoothstep(local / fadeInEnd);

    const exit = local <= fadeOutStart
      ? 1
      : 1 - smoothstep(
          (local - fadeOutStart) /
          (fadeOutEnd - fadeOutStart)
        );

    const opacity = clamp(Math.min(enter, exit));

    let travel = 0;
    let scale = 1.006;

    if (local < fadeInEnd && index !== 0){
      const entering = smoothstep(local / fadeInEnd);
      travel = 16 * (1 - entering);
      scale = 1 + 0.006 * entering;
    } else if (local > fadeOutStart){
      const leaving = smoothstep(
        (local - fadeOutStart) /
        (fadeOutEnd - fadeOutStart)
      );
      travel = -14 * leaving;
      scale = 1.006 - 0.006 * leaving;
    }

    return { opacity, travel, scale };
  }

  function updateHeroCinematic(){
    if (!invitationHero || !heroStage) return;

    const sectionTop = invitationHero.offsetTop;
    const scrollable = Math.max(1, invitationHero.offsetHeight - window.innerHeight);
    const progress = clamp((window.scrollY - sectionTop) / scrollable);
    const eased = smoothstep(progress);

    invitationHero.style.setProperty('--hero-progress', progress.toFixed(4));
    invitationHero.style.setProperty('--hero-glow', (0.67 + Math.sin(progress * Math.PI) * 0.24).toFixed(3));

    if (heroScrollCue){
      /*
        Keep the cue clearly visible on arrival, then fade it away
        during the first small portion of the hero journey.
      */
      const cueVisibility = 1 - smoothstep(progress / 0.022);
      heroScrollCue.style.opacity = cueVisibility.toFixed(3);
      heroScrollCue.style.visibility =
        cueVisibility > 0.015 ? 'visible' : 'hidden';
      heroScrollCue.style.transform =
        `translate3d(0, ${(8 * (1 - cueVisibility)).toFixed(2)}px, 0)`;
    }

    let mostVisibleIndex = 0;
    let highestOpacity = -1;
    const panelStates = heroPanels.map((panel, index) => {
      const state = chapterState(progress, index);
      if (state.opacity > highestOpacity){
        highestOpacity = state.opacity;
        mostVisibleIndex = index;
      }
      return state;
    });

    heroPanels.forEach((panel, index) => {
      const state = panelStates[index];
      panel.style.opacity = state.opacity.toFixed(3);
      panel.style.transform = reduceMotion.matches
        ? 'translate3d(0,0,0) scale(1)'
        : `translate3d(0, ${state.travel.toFixed(2)}px, 0) scale(${state.scale.toFixed(4)})`;
      panel.style.filter = 'none';
      panel.style.pointerEvents =
        index === heroPanels.length - 1 && index === mostVisibleIndex && state.opacity > 0.72
          ? 'auto'
          : 'none';
      panel.setAttribute(
        'aria-hidden',
        index === mostVisibleIndex && state.opacity > 0.5 ? 'false' : 'true'
      );
    });

    if (heroImage){
      heroImage.style.transform = 'none';
      heroImage.style.filter =
        'saturate(.84) contrast(1.05) brightness(.74)';
    }

    /*
      EXPERIENCE 1 → EXPERIENCE 2:
      Hold “Step Inside / What you seek… is seeking you.” longer,
      then fade the portal away while
      “Does any of this sound familiar?” fades in.
    */
    const crossfade = reduceMotion.matches
      ? (progress >= .99 ? 1 : 0)
      : smoothstep((progress - .955) / .045);

    heroStage.style.opacity = (1 - crossfade).toFixed(4);

    if (recognitionHeadline){
      /*
        Question reveal:
        1. “Does any of this” arrives first.
        2. “sound familiar” follows after a reflective beat.
        3. The question mark settles in last.
      */
      recognitionHeadline.style.opacity = crossfade.toFixed(4);
      recognitionHeadline.style.visibility =
        crossfade > .002 ? 'visible' : 'hidden';

      const questionLineOneProgress =
        smoothstep(crossfade / .42);
      const questionLineTwoProgress =
        smoothstep((crossfade - .24) / .48);
      const questionMarkProgress =
        smoothstep((crossfade - .68) / .28);

      if (recognitionQuestionLineOne){
        recognitionQuestionLineOne.style.opacity =
          questionLineOneProgress.toFixed(4);
        recognitionQuestionLineOne.style.transform =
          reduceMotion.matches
            ? 'none'
            : `translate3d(0, ${(18 * (1 - questionLineOneProgress)).toFixed(2)}px, 0)`;
        recognitionQuestionLineOne.style.letterSpacing =
          `${(.045 * (1 - questionLineOneProgress)).toFixed(4)}em`;
      }

      if (recognitionQuestionLineTwo){
        recognitionQuestionLineTwo.style.opacity =
          questionLineTwoProgress.toFixed(4);
        recognitionQuestionLineTwo.style.transform =
          reduceMotion.matches
            ? 'none'
            : `translate3d(0, ${(22 * (1 - questionLineTwoProgress)).toFixed(2)}px, 0)`;
        recognitionQuestionLineTwo.style.letterSpacing =
          `${(.055 * (1 - questionLineTwoProgress)).toFixed(4)}em`;
      }

      if (recognitionQuestionMark){
        recognitionQuestionMark.style.opacity =
          questionMarkProgress.toFixed(4);
        recognitionQuestionMark.style.transform =
          reduceMotion.matches
            ? 'none'
            : `translate3d(0, ${(-8 * (1 - questionMarkProgress)).toFixed(2)}px, 0) rotate(${(-7 * (1 - questionMarkProgress)).toFixed(2)}deg)`;
      }
    }

    if (recognitionExperience){
      recognitionExperience.style.setProperty(
        '--hero-recognition-fade',
        crossfade.toFixed(4)
      );
    }

    /* The final Step Inside panel participates in the section crossfade. */
    const finalPanel = heroPanels[heroPanels.length - 1];
    if (finalPanel){
      const baseOpacity =
        parseFloat(finalPanel.style.opacity || '0');
      finalPanel.style.opacity =
        (baseOpacity * (1 - crossfade)).toFixed(4);
    }

    const heroEnd = sectionTop + invitationHero.offsetHeight - window.innerHeight * 0.18;
    const heroPassed = window.scrollY >= heroEnd;
    header.classList.toggle('hero-passed', heroPassed);
    header.classList.toggle('scrolled', heroPassed);

    heroTicking = false;
  }

  function requestHeroUpdate(){
    if (!heroTicking){
      requestAnimationFrame(updateHeroCinematic);
      heroTicking = true;
    }
  }

  document.addEventListener('scroll', requestHeroUpdate, { passive:true });
  window.addEventListener('resize', requestHeroUpdate);
  reduceMotion.addEventListener?.('change', requestHeroUpdate);
  updateHeroCinematic();


  // Mobile navigation
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.getElementById('primaryNav');
  if (navToggle && primaryNav){
    const closeMenu = () => {
      navToggle.classList.remove('open');
      primaryNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded','false');
      navToggle.setAttribute('aria-label','Open navigation');
    };
    navToggle.addEventListener('click', () => {
      const opening = !primaryNav.classList.contains('open');
      navToggle.classList.toggle('open', opening);
      primaryNav.classList.toggle('open', opening);
      navToggle.setAttribute('aria-expanded', String(opening));
      navToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    });
    primaryNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });
  }

  // Parallax
  const parallaxEls = document.querySelectorAll('.image-break .parallax-img');
  let ticking = false;
  function updateParallax(){
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const rect = el.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const speed = parseFloat(el.dataset.speed || 0.2);
      const offset = (rect.top) * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  }
  document.addEventListener('scroll', () => {
    if(!ticking){
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
  updateParallax();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));


  // Experience 2 — subtle quest progress and slow camera movement.
  const questPanFrames = document.querySelectorAll(
    '[data-quest-pan], .recognition-personal-break .parallax-img'
  );
  let questTicking = false;

  function clampQuest(value, min = 0, max = 1){
    return Math.min(max, Math.max(min, value));
  }

  function updateRecognitionQuest(){
    const vh = window.innerHeight;


    questPanFrames.forEach((frame,index) => {
      const image = frame.querySelector('img');
      if (!image) return;

      const rect = frame.getBoundingClientRect();
      if (rect.bottom < -vh * .3 || rect.top > vh * 1.3) return;

      const progress = clampQuest((vh - rect.top) / (vh + rect.height));
      const eased = progress * progress * (3 - (2 * progress));
      const centered = progress - .5;
      const direction = index % 2 === 0 ? 1 : -1;
      const mobile = window.innerWidth <= 760;

      const isSideImage =
        frame.classList.contains('recognition-list-image') ||
        frame.classList.contains('recognition-final-image');

      const isPersonalImage =
        frame.closest('.recognition-personal-break');

      /*
        Visible but restrained motion:
        - desktop zooms from about 1.035 to 1.105
        - mobile zooms from about 1.025 to 1.075
        - only a very small camera drift is added
      */
      const baseScale = mobile ? 1.025 : 1.035;
      const zoomAmount = mobile ? .050 : .070;
      const scale = baseScale + (eased * zoomAmount);

      const baseY = isSideImage ? -5 : 0;
      const verticalRange = isPersonalImage ? 1.1 : 2.4;
      const y = baseY + centered * verticalRange;
      const x = centered * .75 * direction;

      image.style.transform =
        `translate3d(${x.toFixed(3)}%, ${y.toFixed(3)}%, 0) ` +
        `scale(${scale.toFixed(4)})`;
    });

    questTicking = false;
  }

  function requestRecognitionQuest(){
    if (!questTicking){
      requestAnimationFrame(updateRecognitionQuest);
      questTicking = true;
    }
  }

  document.addEventListener('scroll', requestRecognitionQuest, { passive:true });
  window.addEventListener('resize', requestRecognitionQuest);
  updateRecognitionQuest();


  // Quiet camera movement as the teaching enters the viewport.
  const teachingPan = document.querySelector('[data-teaching-pan]');
  let teachingTicking = false;

  function updateTeachingPan(){
    if (!teachingPan){
      teachingTicking = false;
      return;
    }

    const poster = teachingPan.querySelector('.video-poster');
    if (!poster){
      teachingTicking = false;
      return;
    }

    const rect = teachingPan.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = clampQuest((vh - rect.top) / (vh + rect.height));
    const y = (progress - .5) * 4.5;
    const scale = 1.04 + Math.sin(progress * Math.PI) * .025;

    poster.style.transform =
      `translate3d(0, ${y.toFixed(2)}%, 0) scale(${scale.toFixed(4)})`;

    teachingTicking = false;
  }

  function requestTeachingPan(){
    if (!teachingTicking){
      requestAnimationFrame(updateTeachingPan);
      teachingTicking = true;
    }
  }

  document.addEventListener('scroll', requestTeachingPan, { passive:true });
  window.addEventListener('resize', requestTeachingPan);
  updateTeachingPan();

  // Load and play the YouTube teaching when the cinematic poster is selected.
  const featuredVideoButton = document.getElementById('featuredVideoButton');

  function playFeaturedTeaching(){
    if (!featuredVideoButton) return;

    const teachingFrame = featuredVideoButton.closest('.teaching-frame');
    const frame = teachingFrame
      ? teachingFrame.querySelector('iframe')
      : null;
    const videoSrc = frame?.dataset.src || '';

    if (!frame || !videoSrc || videoSrc.includes('VIDEO_ID')){
      const label = featuredVideoButton.querySelector('small');
      if (label) label.textContent = 'Video unavailable';
      return;
    }

    featuredVideoButton.disabled = true;
    featuredVideoButton.setAttribute('aria-busy', 'true');
    teachingFrame.classList.add('is-loading');

    const separator = videoSrc.includes('?') ? '&' : '?';
    frame.src =
      `${videoSrc}${separator}autoplay=1&rel=0&playsinline=1&modestbranding=1`;

    frame.addEventListener('load', () => {
      teachingFrame.classList.remove('is-loading');
      teachingFrame.classList.add('is-playing');
      featuredVideoButton.remove();
      frame.focus();
    }, { once:true });

    window.setTimeout(() => {
      if (document.body.contains(featuredVideoButton)){
        teachingFrame.classList.remove('is-loading');
        teachingFrame.classList.add('is-playing');
        featuredVideoButton.remove();
      }
    }, 1800);
  }

  featuredVideoButton?.addEventListener('click', playFeaturedTeaching);

  // FAQ accordion (keyboard + pointer accessible via native button)
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    q.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q').setAttribute('aria-expanded','false');
      });
      if(!wasOpen){
        item.classList.add('open');
        q.setAttribute('aria-expanded','true');
      }
    });
  });

  // Newsletter form — loading / success / error states
  const form = document.getElementById('newsletterForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('nlEmail');
    const btn = form.querySelector('button');
    if(!email.checkValidity()){
      status.textContent = 'Please enter a valid email address.';
      status.style.color = '#c9573f';
      email.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Subscribing…';
    status.textContent = '';
    setTimeout(() => {
      btn.textContent = 'Subscribed ✓';
      status.style.color = 'var(--accent)';
      status.textContent = 'Thank you — this mockup form is ready to connect to a mailing platform.';
    }, 700);
  });

  document.getElementById('year').textContent = new Date().getFullYear();

/* ------------------------------------------------------------ */

(function(){
  const section = document.querySelector('[data-tree-bridge]');
  if (!section) return;

  const image = section.querySelector('[data-tree-bridge-image]');
  const shade = section.querySelector('[data-tree-bridge-shade]');
  const warmth = section.querySelector('[data-tree-bridge-warmth]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let ticking = false;

  function clamp(value, min = 0, max = 1){
    return Math.min(max, Math.max(min, value));
  }

  function renderTreeBridge(){
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const distance = Math.max(1, section.offsetHeight - viewport);
    const progress = clamp(-rect.top / distance);

    const pullback = reducedMotion.matches ? 1 : progress;
    const scale = 1.09 - (.095 * pullback);
    const brightness = .59 + (.19 * pullback);
    const saturation = .76 + (.08 * pullback);
    const objectX = 61 - (4 * pullback);

    if (image){
      image.style.transform = `scale(${scale.toFixed(4)})`;
      image.style.objectPosition = `${objectX.toFixed(2)}% center`;
      image.style.filter =
        `saturate(${saturation.toFixed(3)}) sepia(.07) brightness(${brightness.toFixed(3)}) contrast(1.04)`;
    }

    if (shade){
      shade.style.opacity = (1 - (.48 * progress)).toFixed(4);
    }

    if (warmth){
      warmth.style.opacity = (.72 * progress).toFixed(4);
    }

    ticking = false;
  }

  function requestTreeBridge(){
    if (!ticking){
      requestAnimationFrame(renderTreeBridge);
      ticking = true;
    }
  }

  renderTreeBridge();
  window.addEventListener('scroll', requestTreeBridge, {passive:true});
  window.addEventListener('resize', requestTreeBridge);
})();

/* ------------------------------------------------------------ */

(function scatteredPiecesOrientationFixed(){
  const section = document.querySelector('[data-scattered-pieces]');
  if (!section) return;

  const stage = section.querySelector('.scattered-pieces-inner');
  const intro = section.querySelector('[data-pieces-intro]');
  const words = Array.from(section.querySelectorAll('[data-piece]'));
  const summary = section.querySelector('[data-pieces-summary]');
  const frameworkMoments =
    Array.from(section.querySelectorAll('[data-framework-moment]'));

  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;

  const desktopStarts = [
    [-.34,-.29,-5], [.31,-.28,4], [-.15,-.17,-4], [.34,-.05,4],
    [-.35,.09,-3], [.25,.14,3], [-.17,.28,-3], [.31,.30,3]
  ];

  const mobileStarts = [
    [-.24,-.31,-4], [.22,-.25,4], [-.20,-.15,-3], [.22,-.05,3],
    [-.22,.06,-3], [.20,.16,3], [-.18,.27,-2], [.18,.35,2]
  ];

  function clamp(value,min = 0,max = 1){
    return Math.min(max,Math.max(min,value));
  }

  function smooth(value){
    const x = clamp(value);
    return x * x * (3 - (2 * x));
  }

  function lerp(start,end,amount){
    return start + ((end - start) * amount);
  }

  function phase(progress,start,end){
    return reducedMotion ? 1 : smooth((progress - start) / (end - start));
  }

  function momentOpacity(progress,start,holdEnd,end){
    const enter = phase(progress,start,start + .018);
    const leave = 1 - phase(progress,holdEnd,end);
    return enter * leave;
  }

  function render(){
    const rectangle = section.getBoundingClientRect();
    const viewport =
      window.innerHeight || document.documentElement.clientHeight;
    const distance = Math.max(1,section.offsetHeight - viewport);
    const progress = clamp(-rectangle.top / distance);

    const mobile = window.innerWidth <= 760;
    const starts = mobile ? mobileStarts : desktopStarts;
    const stageRectangle = stage.getBoundingClientRect();

    section.style.setProperty(
      '--pieces-warmth',
      clamp((progress - .08) / .78).toFixed(4)
    );

    const introIn = phase(progress,.00,.045);
    const introOut = 1 - phase(progress,.09,.125);

    if (intro){
      intro.style.opacity = (introIn * introOut).toFixed(4);
      intro.style.transform =
        `translate(-50%,calc(-50% + ${lerp(24,0,introIn).toFixed(2)}px))`;
    }

    words.forEach((word,index) => {
      const row = Math.floor(index / 2);
      const column = index % 2;

      const appearStart = .12 + (index * .025);
      const appear = phase(progress,appearStart,appearStart + .055);
      const align = phase(progress,.29 + (index * .005),.47 + (index * .004));
      const fade = 1 - phase(progress,.50,.56);

      let targetX;
      let targetY;

      if (mobile){
        targetX = 0;
        targetY =
          (-.285 + (row * .19) + (column * .095)) *
          stageRectangle.height;
      } else {
        targetX =
          (column === 0 ? -.275 : .275) *
          stageRectangle.width;
        targetY =
          (-.27 + (row * .18)) *
          stageRectangle.height;
      }

      const startX = starts[index][0] * stageRectangle.width;
      const startY = starts[index][1] * stageRectangle.height;
      const startRotation = starts[index][2];

      const x = lerp(startX,targetX,align);
      const y = lerp(startY,targetY,align);
      const rotation = lerp(startRotation,0,align);

      word.style.opacity = (appear * fade).toFixed(4);
      word.style.letterSpacing =
        `${lerp(.08,.015,align).toFixed(3)}em`;
      word.style.transform =
        `translate(calc(-50% + ${x.toFixed(2)}px),` +
        `calc(-50% + ${y.toFixed(2)}px)) ` +
        `rotate(${rotation.toFixed(2)}deg)`;
    });

    const summaryIn = phase(progress,.57,.61);
    const summaryOut = 1 - phase(progress,.66,.70);

    if (summary){
      summary.style.opacity = (summaryIn * summaryOut).toFixed(4);
      summary.style.transform =
        `translate(-50%,calc(-50% + ${lerp(24,0,summaryIn).toFixed(2)}px))`;
    }

    const timings = [
      [.705,.748,.772],
      [.765,.808,.832],
      [.825,.868,.892],
      [.885,.928,.952],
      [.942,.985,1.01]
    ];

    frameworkMoments.forEach((moment,index) => {
      const [start,holdEnd,end] = timings[index];
      const opacity = reducedMotion
        ? (index === frameworkMoments.length - 1 ? 1 : 0)
        : momentOpacity(progress,start,holdEnd,end);

      const enter = phase(progress,start,start + .018);

      moment.style.opacity = opacity.toFixed(4);
      moment.style.transform =
        `translate(-50%,calc(-50% + ${lerp(24,0,enter).toFixed(2)}px))`;
    });

    ticking = false;
  }

  function requestRender(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  render();
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',requestRender);
})();

/* ------------------------------------------------------------ */

(function pathQuestionTransition(){
  const section = document.querySelector('[data-path-question]');
  if (!section) return;

  const image = section.querySelector('[data-path-question-image]');
  const overlay = section.querySelector('[data-path-question-overlay]');
  const first = section.querySelector('[data-path-question-first]');
  const second = section.querySelector('[data-path-question-second]');
  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;

  function clamp(value,min = 0,max = 1){
    return Math.min(max,Math.max(min,value));
  }

  function smooth(value){
    const x = clamp(value);
    return x * x * (3 - (2 * x));
  }

  function phase(progress,start,end){
    return reducedMotion ? 1 : smooth((progress - start) / (end - start));
  }

  function render(){
    const rectangle = section.getBoundingClientRect();
    const viewport =
      window.innerHeight || document.documentElement.clientHeight;
    const distance = Math.max(1,section.offsetHeight - viewport);
    const progress = clamp(-rectangle.top / distance);

    const firstIn = phase(progress,.07,.19);
    const firstOut = 1 - phase(progress,.34,.46);
    const firstOpacity = firstIn * firstOut;

    const secondIn = phase(progress,.50,.65);
    const secondOpacity = secondIn;

    if (first){
      first.style.opacity = firstOpacity.toFixed(4);
      first.style.transform =
        `translate(-50%,calc(-50% + ${
          (26 * (1 - firstIn) - 20 * (1 - firstOut)).toFixed(2)
        }px))`;
    }

    if (second){
      second.style.opacity = secondOpacity.toFixed(4);
      second.style.transform =
        `translate(-50%,calc(-50% + ${
          (32 * (1 - secondIn)).toFixed(2)
        }px))`;
    }

    if (overlay){
      overlay.style.opacity =
        (1 - (.48 * phase(progress,.18,.86))).toFixed(4);
    }

    if (image){
      const movement = reducedMotion ? 0 : progress;
      const translateY = -2.4 + (4.8 * movement);
      const brightness = .58 + (.20 * phase(progress,.12,.88));

      image.style.transform =
        `translate3d(0,${translateY.toFixed(3)}%,0)`;
      image.style.filter =
        `saturate(.76) sepia(.04) ` +
        `brightness(${brightness.toFixed(3)}) contrast(1.04)`;
    }

    ticking = false;
  }

  function requestRender(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  render();
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',requestRender);
})();

/* ------------------------------------------------------------ */

(function experienceFive(){
  const intro = document.querySelector('[data-choose-path-intro]');
  const pathSections =
    Array.from(document.querySelectorAll('[data-path-portrait]'));
  const destination = document.querySelector('[data-path-destination]');

  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;

  function clamp(value,min = 0,max = 1){
    return Math.min(max,Math.max(min,value));
  }

  function smooth(value){
    const x = clamp(value);
    return x * x * (3 - (2 * x));
  }

  function phase(progress,start,end){
    return reducedMotion ? 1 : smooth((progress - start) / (end - start));
  }

  function sequentialOpacity(progress,start,hold,end){
    const enter = phase(progress,start,start + .055);
    const leave = 1 - phase(progress,hold,end);
    return enter * leave;
  }

  function sectionProgress(section){
    const rectangle = section.getBoundingClientRect();
    const viewport =
      window.innerHeight || document.documentElement.clientHeight;
    const distance = Math.max(1,section.offsetHeight - viewport);
    return clamp(-rectangle.top / distance);
  }

  function renderIntro(){
    if (!intro) return;

    const progress = sectionProgress(intro);
    const title = intro.querySelector('[data-choose-path-title]');
    const moments =
      Array.from(intro.querySelectorAll('[data-choose-intro-moment]'));

    const titleIn = phase(progress,.02,.09);
    const titleOut = 1 - phase(progress,.20,.28);

    if (title){
      title.style.opacity = (titleIn * titleOut).toFixed(4);
      title.style.transform =
        `translate(-50%,calc(-50% + ${
          (28 * (1 - titleIn) - 18 * (1 - titleOut)).toFixed(2)
        }px))`;
    }

    const timings = [
      [.25,.36,.43],
      [.41,.52,.59],
      [.57,.68,.75],
      [.73,.92,1.02]
    ];

    moments.forEach((moment,index) => {
      const [start,hold,end] = timings[index];
      const opacity = sequentialOpacity(progress,start,hold,end);
      const enter = phase(progress,start,start + .055);

      moment.style.opacity = opacity.toFixed(4);
      moment.style.transform =
        `translate(-50%,calc(-50% + ${
          (24 * (1 - enter)).toFixed(2)
        }px))`;
    });
  }

  function renderPaths(){
    pathSections.forEach(section => {
      const copy = section.querySelector('[data-path-copy]');
      if (!copy) return;

      const rectangle = section.getBoundingClientRect();
      const viewport =
        window.innerHeight || document.documentElement.clientHeight;

      const visible =
        clamp(
          1 -
          Math.abs(
            (rectangle.top + (rectangle.height / 2)) -
            (viewport / 2)
          ) /
          (viewport * .72)
        );

      const eased = smooth(visible);

      copy.style.opacity = eased.toFixed(4);
      copy.style.transform =
        `translateY(${(34 * (1 - eased)).toFixed(2)}px)`;
    });
  }

  function renderDestination(){
    if (!destination) return;

    const progress = sectionProgress(destination);
    const moments =
      Array.from(destination.querySelectorAll('[data-destination-moment]'));

    const timings = [
      [.06,.28,.37],
      [.34,.55,.64],
      [.62,.94,1.04]
    ];

    moments.forEach((moment,index) => {
      const [start,hold,end] = timings[index];
      const opacity = sequentialOpacity(progress,start,hold,end);
      const enter = phase(progress,start,start + .06);

      moment.style.opacity = opacity.toFixed(4);
      moment.style.transform =
        `translate(-50%,calc(-50% + ${
          (28 * (1 - enter)).toFixed(2)
        }px))`;
    });
  }

  function render(){
    renderIntro();
    renderPaths();
    renderDestination();
    ticking = false;
  }

  function requestRender(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  render();
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',requestRender);
})();

/* ------------------------------------------------------------ */

(function missionQuestionsNoteTransition(){
  const section = document.querySelector('[data-mission-questions]');
  const introCopy = section?.querySelector('[data-questions-intro-copy]');
  const note = section?.querySelector('[data-questions-note]');
  if (!section || !introCopy || !note) return;

  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let ticking = false;

  function clamp(value,min = 0,max = 1){
    return Math.min(max,Math.max(min,value));
  }

  function smooth(value){
    const x = clamp(value);
    return x * x * (3 - (2 * x));
  }

  function render(){
    if (reducedMotion || window.innerWidth <= 980){
      introCopy.style.opacity = "1";
      introCopy.style.transform = "none";
      note.style.opacity = "1";
      note.style.transform = "none";
      ticking = false;
      return;
    }

    const rectangle = section.getBoundingClientRect();
    const viewport =
      window.innerHeight || document.documentElement.clientHeight;

    /*
      LEFT PANEL BEHAVIOR:
      - stays fixed in place the whole time
      - only crossfades from the intro line to Kurt's note
      RIGHT PANEL BEHAVIOR:
      - questions keep scrolling naturally
    */
    const pixelsScrolled = Math.max(0,-rectangle.top);
    const transitionStart = viewport * 0.10;
    const transitionDistance = viewport * 0.36;
    const transition = smooth(
      (pixelsScrolled - transitionStart) / transitionDistance
    );

    introCopy.style.opacity = (1 - transition).toFixed(4);
    introCopy.style.transform = "none";

    note.style.opacity = transition.toFixed(4);
    note.style.transform = "none";

    ticking = false;
  }

  function requestRender(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(render);
  }

  render();
  window.addEventListener('scroll',requestRender,{passive:true});
  window.addEventListener('resize',requestRender);
})();

/* ------------------------------------------------------------ */

(function manageHeroBackgroundVideo(){
  const video = document.querySelector('.hero-background-video');
  if (!video) return;

  const reducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)');

  function syncPlayback(){
    if (reducedMotion.matches){
      video.pause();
      video.currentTime = 0;
      return;
    }

    const playback = video.play();
    if (playback && typeof playback.catch === 'function'){
      playback.catch(() => {
        /* The embedded poster remains visible if autoplay is blocked. */
      });
    }
  }

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted','');
  video.addEventListener('loadeddata',syncPlayback,{once:true});
  reducedMotion.addEventListener?.('change',syncPlayback);
  syncPlayback();
})();

/* ------------------------------------------------------------ */

/*
    Keep sections with sticky media below the real fixed-header height.
    The header changes size after the hero, so a hard-coded offset would
    not remain accurate across devices.
  */
  (() => {
    const siteHeader = document.getElementById('siteHeader');
    if (!siteHeader) return;

    let headerMeasureFrame = 0;

    const updateSiteHeaderHeight = () => {
      cancelAnimationFrame(headerMeasureFrame);

      headerMeasureFrame = requestAnimationFrame(() => {
        const height = Math.ceil(
          siteHeader.getBoundingClientRect().height
        );

        document.documentElement.style.setProperty(
          '--site-header-height',
          `${height}px`
        );
      });
    };

    updateSiteHeaderHeight();

    window.addEventListener(
      'resize',
      updateSiteHeaderHeight,
      { passive:true }
    );

    window.addEventListener(
      'scroll',
      updateSiteHeaderHeight,
      { passive:true }
    );

    if ('ResizeObserver' in window){
      const headerObserver = new ResizeObserver(updateSiteHeaderHeight);
      headerObserver.observe(siteHeader);
    }
  })();
