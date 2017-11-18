module.exports = {
  getHref: (href) => {
    const dataList = href.split('/');
    return dataList[dataList.length - 2];
  }
}
