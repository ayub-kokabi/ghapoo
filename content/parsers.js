(function(App) {
  App.Parsers = {
    parseNitterHtml: (htmlString, tweetEl, currentHandle, instanceUrl, targetText) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");
      const items = doc.querySelectorAll('.timeline-item');
      let olderMatches = [];
      
      const tweetDateEl = tweetEl.querySelector('time');
      if (!tweetDateEl) return [];
      const currentTweetDate = new Date(tweetDateEl.getAttribute('datetime'));

      const normalizedTarget = App.Utils.normalizeForMatch(targetText);

      items.forEach((item) => {
        if (item.querySelector('.retweet-header')) return;
        if (item.classList.contains('show-more')) return; 
        
        const usernameLink = item.querySelector('.username');
        if (!usernameLink) return;
        
        const username = usernameLink.innerText.trim();
        
        const contentDiv = item.querySelector('.tweet-content');
        const rawFoundText = contentDiv ? contentDiv.innerText : "";
        
        const normalizedFound = App.Utils.normalizeForMatch(rawFoundText);

        if (normalizedFound !== normalizedTarget) return;

        if (username.toLowerCase() === currentHandle.toLowerCase()) return;
          
        const dateLink = item.querySelector('.tweet-date a');
        const dateTitle = dateLink ? dateLink.getAttribute('title') : ""; 
        
        let cleanDateStr = dateTitle.replace(/·/g, '').replace('UTC', '').trim();
        let itemDate = new Date(cleanDateStr);
        
        if (isNaN(itemDate.getTime())) return;

        if (itemDate.getTime() < currentTweetDate.getTime()) {
            
            let avatarSrc = item.querySelector('.tweet-avatar img')?.getAttribute('src');
            if (avatarSrc && !avatarSrc.startsWith('http')) {
                const baseUrl = instanceUrl.endsWith('/') ? instanceUrl.slice(0, -1) : instanceUrl;
                const path = avatarSrc.startsWith('/') ? avatarSrc : '/' + avatarSrc;
                avatarSrc = baseUrl + path;
            }
            
            const displayName = item.querySelector('.fullname')?.innerText || username;
            
            const cleanUser = username.replace('@', '');
            const tweetIdPath = dateLink.getAttribute('href');
            const tweetUrl = `https://x.com${tweetIdPath}`;
            const profileUrl = `https://x.com/${cleanUser}`;

            olderMatches.push({
              handle: username,
              name: displayName,
              text: rawFoundText,
              date: itemDate.toISOString(),
              avatar: avatarSrc,
              tweetUrl: tweetUrl,
              profileUrl: profileUrl
            });
        }
      });
      olderMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
      return olderMatches.slice(0, 3);
    }
  };
})(window.Ghapoo);