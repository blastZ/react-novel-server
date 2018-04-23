module.exports = {
  getHref: (href) => {
    const dataList = href.split('/');
    return dataList[dataList.length - 2];
  },
  getBookIdFromChapterHref: (href) => {
    const dataList = href.split('/');
    const bookId = dataList[dataList.length - 2];
    return bookId;
  },
  getChapterIdFromChapterHref: (href) => {
    const dataList = href.split('/');
    const chapterId = dataList[dataList.length - 1];
    return chapterId;
  }
}
