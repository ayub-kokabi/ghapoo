window.Ghapoo = window.Ghapoo || {};

(function (App) {

  const SUFFIX = "before this tweet";
  const SEL = App.SELECTORS;

  App.Utils = {
    getTimeAgo: (foundDate, mainDate) => {
      if (!(foundDate instanceof Date) || isNaN(foundDate)) return "Invalid date";

      const baseDate = (mainDate instanceof Date && !isNaN(mainDate)) ? mainDate : new Date();

      const diff = baseDate - foundDate;

      if (diff < 0) return "Just now";

      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const week = 7 * day;
      const month = 30 * day;
      const year = 365 * day;

      if (diff < minute) return `Just ${SUFFIX}`;
      
      if (diff < hour) {
        const val = Math.floor(diff / minute);
        return `${val} minute${val > 1 ? 's' : ''} ${SUFFIX}`;
      }
      if (diff < day) {
        const val = Math.floor(diff / hour);
        return `${val} hour${val > 1 ? 's' : ''} ${SUFFIX}`;
      }
      if (diff < week) {
        const val = Math.floor(diff / day);
        return `${val} day${val > 1 ? 's' : ''} ${SUFFIX}`;
      }
      if (diff < month) {
        const val = Math.floor(diff / week);
        return `${val} week${val > 1 ? 's' : ''} ${SUFFIX}`;
      }
      if (diff < year) {
        const val = Math.floor(diff / month);
        return `${val} month${val > 1 ? 's' : ''} ${SUFFIX}`;
      }

      const val = Math.floor(diff / year);
      return `${val} year${val > 1 ? 's' : ''} ${SUFFIX}`;
    },

    extractTweetData: (tweetEl) => {
      const textEl = tweetEl.querySelector(SEL.TWEET_TEXT);
      const userLink = tweetEl.querySelector(SEL.USER_NAME);
      const timeEl = tweetEl.querySelector(SEL.TIME);
      const actionGroup = tweetEl.querySelector(SEL.ACTION_GROUP);

      const rawText = textEl?.innerText || '';
      const userHandle = userLink
        ? userLink.getAttribute('href').replace('/', '@')
        : 'unknown';

      return {
        textEl,
        rawText,
        trimmedText: rawText.trim(),
        userHandle,
        tweetDate: timeEl ? new Date(timeEl.getAttribute('datetime')) : new Date(),
        actionGroup,
        uniqueId: userHandle + '_' + rawText.substring(0, 30)
      };
    },

    normalizeForMatch: (str) => {
      if (!str) return "";
      return str
        .replace(/[^\p{L}\p{N}]/gu, "")
        .toLowerCase();
    }
  };

})(window.Ghapoo);