window.Ghapoo = window.Ghapoo || {};

(function (App) {

  const toFa = (num) => num.toLocaleString('fa-IR');
  const SUFFIX = "قبل از این توییت";
  const SEL = App.SELECTORS;

  App.Utils = {
    getPersianTimeAgo: (foundDate, mainDate) => {
      if (!(foundDate instanceof Date) || isNaN(foundDate)) return "تاریخ نامعتبر";

      const baseDate = (mainDate instanceof Date && !isNaN(mainDate)) ? mainDate : new Date();

      const diff = baseDate - foundDate;

      if (diff < 0) return "لحظاتی پیش";

      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      const week = 7 * day;
      const month = 30 * day;
      const year = 365 * day;

      if (diff < minute) return `لحظاتی ${SUFFIX}`;
      if (diff < hour) return `${toFa(Math.floor(diff / minute))} دقیقه ${SUFFIX}`;
      if (diff < day) return `${toFa(Math.floor(diff / hour))} ساعت ${SUFFIX}`;
      if (diff < week) return `${toFa(Math.floor(diff / day))} روز ${SUFFIX}`;
      if (diff < month) return `${toFa(Math.floor(diff / week))} هفته ${SUFFIX}`;
      if (diff < year) return `${toFa(Math.floor(diff / month))} ماه ${SUFFIX}`;

      return `${toFa(Math.floor(diff / year))} سال ${SUFFIX}`;
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