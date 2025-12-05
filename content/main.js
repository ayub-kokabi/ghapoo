(function (App) {
  const { UI, Parsers, Utils, Cache, SELECTORS: SEL } = App;


  let scrollTimeout = null;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      if (App.State.globalPopover) UI.hidePopoverImmediate();
      scrollTimeout = null;
    }, 50);
  }, { passive: true });

  function isAd(tweetEl) {
    const headerParts = tweetEl.querySelectorAll(SEL.HEADER_PARTS);
    for (const span of headerParts) {
      if (span.innerText === 'Ad' || span.innerText === 'تبلیغ') return true;
    }
    return false;
  }

  function isRepost(tweetEl) {
    const socialContext = tweetEl.querySelector(SEL.SOCIAL_CONTEXT);
    return !!socialContext;
  }

  function handleCheckClick(btnElement, tweetEl, tweetData) {
    const { trimmedText, userHandle, tweetDate, uniqueId } = tweetData;

    if (!trimmedText) return;

    btnElement.innerHTML = '<div class="ghapoo-loading-icon"></div>';
    btnElement.style.cursor = 'wait';

    const clone = btnElement.cloneNode(true);
    btnElement.parentNode.replaceChild(clone, btnElement);
    btnElement = clone;

    chrome.runtime.sendMessage(
      { action: "searchNitter", text: trimmedText },
      (response) => {
        if (response && response.success) {
          let matches = Parsers.parseNitterHtml(
            response.html,
            tweetEl,
            userHandle,
            response.instance,
            trimmedText
          );

          Cache.set(uniqueId, matches);

          if (matches.length > 0) {
            UI.replaceWithAlertIcon(btnElement, matches, trimmedText, tweetDate, true);
          } else {
            UI.replaceWithCleanIcon(btnElement, trimmedText);
          }
        } else {
          UI.replaceWithOfflineIcon(btnElement);
          console.warn("[Ghapoo] Search failed.");
        }
      }
    );
  }

  function injectTweetCheckButton(tweetEl) {
    const tweetData = Utils.extractTweetData(tweetEl);
    const { actionGroup, textEl, trimmedText, uniqueId, tweetDate } = tweetData;

    if (!actionGroup) return;
    if (actionGroup.querySelector('.ghapoo-icon-base')) return;
    if (isAd(tweetEl) || isRepost(tweetEl)) return;
    if (!textEl || !trimmedText) return;

    if (Cache.has(uniqueId)) {
      const cachedMatches = Cache.get(uniqueId);
      const placeholderBtn = document.createElement('div');
      UI.insertButtonInToolbar(actionGroup, placeholderBtn);

      if (cachedMatches.length > 0) {
        UI.replaceWithAlertIcon(placeholderBtn, cachedMatches, trimmedText, tweetDate, false);
      } else {
        UI.replaceWithCleanIcon(placeholderBtn, trimmedText);
      }
      return;
    }

    const checkBtn = UI.createBaseButton();
    checkBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleCheckClick(checkBtn, tweetEl, tweetData);
    });

    UI.insertButtonInToolbar(actionGroup, checkBtn);
  }

  let pendingTweets = new Set();
  let debounceTimer = null;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;

        if (node.getAttribute?.('data-testid') === 'tweet') {
          pendingTweets.add(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('article[data-testid="tweet"]')
            .forEach(t => pendingTweets.add(t));
        }
      });
    });

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pendingTweets.forEach(injectTweetCheckButton);
      pendingTweets.clear();
    }, 100);
  });

  function startObserving() {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function scanAllTweets() {
    document.querySelectorAll(SEL.TWEET).forEach(injectTweetCheckButton);
  }

  setTimeout(scanAllTweets, 2000);
  startObserving();

})(window.Ghapoo);