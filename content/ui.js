(function(App) {
  const { Utils, SELECTORS: SEL } = App;  
  const SVGS = {
    CHECK: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
        <path d="M14.83 14.83a4 4 0 1 1 0-5.66" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>`,
    ALERT: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" x2="12" y1="8" y2="12"/>
        <line x1="12" x2="12.01" y1="16" y2="16"/>
      </svg>`,
    CLEAN: `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>`,
    EMPTY: `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
      </svg>`,
    OFFLINE: `
      <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 14.5c0 1.6.9 3.1 2.2 3.9l-.9.9c-.4.4-.4 1 0 1.4.2.2.4.3.7.3s.5-.1.7-.3l14-14c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-1.8 1.8c-.6-.1-1.2-.1-1.7-.1-.1-.2-.3-.3-.4-.4-1-1-2.4-1.6-3.9-1.6s-2.9.6-3.9 1.6S4 9 4 10.5v.3c-.2.2-.5.3-.7.6-.8.8-1.3 1.9-1.3 3.1zm2.7-1.8c.2-.2.5-.4.7-.5.4-.2.7-.6.6-1.1v-.6c0-.9.4-1.8 1-2.5 1.3-1.3 3.6-1.3 4.9 0 .2.2.4.4.5.7.2.3.6.5 1 .4l-7.7 7.7c-1-.3-1.7-1.3-1.7-2.4 0-.6.3-1.2.7-1.7zm14.9-2.1L19 9.4c-.3-.5-.9-.6-1.4-.3-.5.3-.6.9-.3 1.4.2.3.4.7.5 1 .1.3.3.5.6.7.9.4 1.5 1.3 1.5 2.3 0 .7-.3 1.3-.7 1.8-.5.5-1.1.7-1.8.7H10c-.6 0-1 .4-1 1s.4 1 1 1h7.5c1.2 0 2.3-.5 3.2-1.3.9-.8 1.3-2 1.3-3.2 0-1.7-.9-3.2-2.4-3.9z"/>
      </svg>`
  };

  // Regex to detect if text starts with characters from:
  // Arabic/Persian/Urdu/Kurdish/Azeri (0600-06FF, 0750-077F, 08A0-08FF, FB50-FDFF, FE70-FEFF)
  // Hebrew (0590-05FF)
  // Aramaic/Syriac (0700-074F)
  // Dhivehi/Thaana (0780-07BF)
  const RTL_REGEX = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF\u0700-\u074F\u0780-\u07BF]/;

  const UI = {
    getPopover: () => {
      if (App.State.globalPopover && document.body.contains(App.State.globalPopover)) {
        return App.State.globalPopover;
      }
      
      const popover = document.createElement('div');
      popover.id = 'ghapoo-global-popover';
      
      popover.addEventListener('mouseenter', () => { 
        if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout); 
      });

      popover.addEventListener('mouseleave', () => { 
        UI.scheduleHidePopover(); 
      });

      document.body.appendChild(popover);
      App.State.globalPopover = popover;
      return popover;
    },

    hidePopoverImmediate: () => {
      if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout);
      if (App.State.globalPopover) {
        App.State.globalPopover.remove();
        App.State.globalPopover = null;
      }
    },

    scheduleHidePopover: () => {
      if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout);
      App.State.popoverTimeout = setTimeout(() => {
        UI.hidePopoverImmediate();
      }, 300);
    },

    positionPopover: (targetElement, popover) => {
      const rect = targetElement.getBoundingClientRect();
      const popoverHeight = popover.offsetHeight || 100;
      const popoverWidth = popover.offsetWidth || (popover.classList.contains('popover-compact') ? 280 : 360);
      
      let left = rect.left + (rect.width / 2) - (popoverWidth / 2);
      let top = rect.top - popoverHeight - 10; 

      if (top < 10) {
        top = rect.bottom + 15;
      }

      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    },

    showPopover: (targetElement, matches, mainTweetDate, autoHide = false) => {
      const popover = UI.getPopover();
      popover.innerHTML = ''; 

      if (matches.length === 0) {
        popover.classList.add('popover-compact');
        popover.innerHTML = `
          <div class="ghapoo-empty-state">
            <div class="ghapoo-empty-icon">${SVGS.EMPTY}</div>
            <div>No older similar tweets found.</div>
          </div>`;
      } else {
        popover.classList.remove('popover-compact');
        const headerDiv = document.createElement('div');
        headerDiv.className = 'ghapoo-popover-header';
        headerDiv.textContent = 'Possible older sources';
        popover.appendChild(headerDiv);

        matches.forEach(m => {
          const item = document.createElement('div');
          item.className = 'found-tweet';
          item.addEventListener('click', () => window.open(m.tweetUrl, '_blank'));

          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'found-avatar';
          const avatarLink = document.createElement('a');
          avatarLink.href = m.profileUrl;
          avatarLink.target = '_blank';
          avatarLink.className = 'found-profile-link';
          avatarLink.addEventListener('click', (e) => e.stopPropagation());
          
          const img = document.createElement('img');
          img.src = m.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
          img.onerror = function() { this.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'; };
          
          avatarLink.appendChild(img);
          avatarDiv.appendChild(avatarLink);

          const contentDiv = document.createElement('div');
          contentDiv.className = 'found-content';

          const headerTop = document.createElement('div');
          headerTop.className = 'found-header-top';
          const headerLink = document.createElement('a');
          headerLink.href = m.profileUrl;
          headerLink.target = '_blank';
          headerLink.className = 'found-profile-link';
          headerLink.addEventListener('click', (e) => e.stopPropagation());
          
          const nameSpan = document.createElement('span');
          nameSpan.className = 'found-name';
          nameSpan.textContent = m.name;
          
          const handleSpan = document.createElement('span');
          handleSpan.className = 'found-handle';
          handleSpan.textContent = m.handle;

          headerLink.appendChild(nameSpan);
          headerLink.appendChild(handleSpan);
          headerTop.appendChild(headerLink);

          const headerBottom = document.createElement('div');
          headerBottom.className = 'found-header-bottom';
          const dateSpan = document.createElement('span');
          dateSpan.className = 'found-date';
          const dateObj = new Date(m.date);
          dateSpan.textContent = Utils.getTimeAgo(dateObj, mainTweetDate);
          dateSpan.title = dateObj.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' });
          
          headerBottom.appendChild(dateSpan);

          const textDiv = document.createElement('div');
          textDiv.className = 'found-text';
          
          // Apply RTL only if text starts with defined RTL characters
          textDiv.dir = RTL_REGEX.test(m.text) ? 'rtl' : 'ltr';
          
          textDiv.textContent = m.text;

          contentDiv.appendChild(headerTop);
          contentDiv.appendChild(headerBottom);
          contentDiv.appendChild(textDiv);

          item.appendChild(avatarDiv);
          item.appendChild(contentDiv);
          popover.appendChild(item);
        });
      }

      popover.classList.add('visible');
      UI.positionPopover(targetElement, popover);

      if (autoHide) {
        if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout);
        App.State.popoverTimeout = setTimeout(() => {
          UI.scheduleHidePopover();
        }, 3000);
      }
    },

    createBaseButton: () => {
      const btn = document.createElement('div');
      btn.className = 'ghapoo-icon-base ghapoo-check-btn';
      btn.title = 'Check content originality';
      btn.innerHTML = SVGS.CHECK;
      return btn;
    },

    replaceWithAlertIcon: (oldBtn, matches, originalText, mainTweetDate, triggerAutoShow) => {
      const alertBtn = document.createElement('div');
      alertBtn.className = 'ghapoo-icon-base ghapoo-alert-icon';
      alertBtn.innerHTML = SVGS.ALERT;
      
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(`"${originalText}"`)}`;

      alertBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(searchUrl, '_blank');
      });

      alertBtn.addEventListener('mouseenter', () => {
        if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout);
        UI.showPopover(alertBtn, matches, mainTweetDate);
      });
      alertBtn.addEventListener('mouseleave', UI.scheduleHidePopover);

      if (oldBtn.parentNode) {
        oldBtn.parentNode.replaceChild(alertBtn, oldBtn);
      }
      
      if (triggerAutoShow) {
        requestAnimationFrame(() => {
          UI.showPopover(alertBtn, matches, mainTweetDate, true);
        });
      }
    },

    replaceWithCleanIcon: (oldBtn, originalText) => {
      const cleanBtn = document.createElement('div');
      cleanBtn.className = 'ghapoo-icon-base ghapoo-clean-icon';
      cleanBtn.innerHTML = SVGS.CLEAN;
      
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(`"${originalText}"`)}`;

      cleanBtn.addEventListener('mouseenter', () => {
        if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout);
        UI.showPopover(cleanBtn, []); 
      });

      cleanBtn.addEventListener('mouseleave', UI.scheduleHidePopover);
      
      cleanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(searchUrl, '_blank');
      });

      if (oldBtn.parentNode) {
        oldBtn.parentNode.replaceChild(cleanBtn, oldBtn);
      }
    },

    replaceWithOfflineIcon: (oldBtn) => {
      const offlineBtn = document.createElement('div');
      offlineBtn.className = 'ghapoo-icon-base ghapoo-offline-icon';
      offlineBtn.innerHTML = SVGS.OFFLINE;
      
      offlineBtn.addEventListener('mouseenter', () => {
        if (App.State.popoverTimeout) clearTimeout(App.State.popoverTimeout);
        
        const popover = UI.getPopover();
        popover.classList.add('popover-compact');
        popover.innerHTML = `
          <div class="ghapoo-popover-message">
            Please try again later.
          </div>`;
        
        popover.classList.add('visible');
        UI.positionPopover(offlineBtn, popover);
      });

      offlineBtn.addEventListener('mouseleave', UI.scheduleHidePopover);
      
      offlineBtn.style.cursor = 'help'; 

      if (oldBtn.parentNode) {
        oldBtn.parentNode.replaceChild(offlineBtn, oldBtn);
      }
    },

    insertButtonInToolbar: (actionGroup, btnElement) => {
      const shareBtn = actionGroup.querySelector(SEL.SHARE_BTN);
      if (shareBtn) {
        let targetNode = shareBtn;
        while (targetNode.parentElement && targetNode.parentElement !== actionGroup) {
          targetNode = targetNode.parentElement;
        }
        if (targetNode.parentElement === actionGroup) {
          actionGroup.insertBefore(btnElement, targetNode);
        } else {
          actionGroup.appendChild(btnElement);
        }
      } else {
        actionGroup.appendChild(btnElement);
      }
    }
  };

  App.UI = UI;
})(window.Ghapoo);