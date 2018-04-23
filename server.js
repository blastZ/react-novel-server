const express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const iconv = require('iconv-lite');
const helper = require('./utils/helper');
const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const books = {}; //{bookid: {chapterid: ''}}
const booksList = {}; //{bookid: [chapterList]}

const defaultURL = 'http://www.biqiuge.com';

app.get('/', (req, res, next) => {
  request({
    url: defaultURL,
    encoding: null
  }, (error, response, body) => {
    const html = iconv.decode(body, 'gbk');
    const $ = cheerio.load(html);
    const novelList = [];
    const $novels = $('.content').eq(0);
    const $topNovel = $novels.find($('.top dl dt a'));
    const topNovel = {
      name: $topNovel.text(),
      href: helper.getHref($topNovel.attr('href'))
    }
    novelList.push(topNovel);
    const $novelList = $novels.find($('ul li a'));
    $novelList.each((index, novel) => {
      novelList.push({
        name: $(novel).text(),
        href: helper.getHref($(novel).attr('href'))
      })
    })
    res.json({
      topNovel,
      novelList
    });
  })
})

app.get('/book/:bookId', (req, res) => {
  if(booksList[req.params.bookId]) {
    res.send(booksList[req.params.bookId]);
  } else {
    request({
      url: `${defaultURL}/book/${req.params.bookId}`,
      encoding: null
    }, (error, response, body) => {
      const html = iconv.decode(body, 'gbk');
      const $ = cheerio.load(html);
      const url = $('#fmimg img').attr('src');
      const $bookInfo = $('#info');
      const name = $bookInfo.children($('h1')).text();
      const author = $bookInfo.children($('p')).eq(0).find($('a')).text();
      const updateTime = $bookInfo.children($('p')).eq(2).text();
      const latestChapter = $bookInfo.children($('p')).eq(3).find($('a')).text();
      const description = $('#intro').text();
      const bookInfo = {
        id: req.params.bookId,
        url,
        name,
        author,
        updateTime: updateTime.trim(),
        latestChapter,
        description: description.trim()
      }
      const chapterList = [];
      $('#list dd a').each((index, chapter) => {
        chapterList.push({
          name: $(chapter).text(),
          href: $(chapter).attr('href')
        })
      })

      booksList[req.params.bookId] = JSON.stringify({bookInfo, chapterList}); // it will not update

      res.json({
        bookInfo,
        chapterList
      });
    })
  }
})

app.get('/book/:bookId/:chapter', (req, res) => {
  if(books[req.params.bookId] && books[req.params.bookId][req.params.chapter]) {
    res.send(books[req.params.bookId][req.params.chapter]);
  } else {
    request({
      url: `${defaultURL}/book/${req.params.bookId}/${req.params.chapter}`,
      encoding: null
    }, (error, response, body) => {
      const html = iconv.decode(body, 'gbk');
      const $ = cheerio.load(html, {
        decodeEntities: false
      });
      const $chapter = $('#content');
      const $name = $('.bookname h1');
      const name = $name.text();

      books[req.params.bookId] = {
        [req.params.chapter]: JSON.stringify({name, html: $chapter.html()}) // it will not update
      }

      res.json({
        name,
        html: $chapter.html()
      })
    })
  }
})

app.get('/search/:name', (req, res) => {
  let name = encodeURI(`${req.params.name}`);
  request({
    url: `http://zhannei.baidu.com/cse/search?q=${name}&s=17512219138159063592`,
    encoding: null
  }, (error, response, body) => {
    const $ = cheerio.load(body);
    const $resultList = $('#results .result-list');
    const resultList = [];
    $resultList.find($('.result-item')).each((index, result) => {
      const url = $(result).children($('.result-game-item-pic')).children($('a')).children($('img')).attr('src');
      const name = $(result).find($('.result-game-item-detail h3 a')).attr('title');
      const href = $(result).find($('.result-game-item-detail h3 a')).attr('href');
      const description = $(result).find($('.result-game-item-detail .result-game-item-desc')).text();
      const author = $(result).find($('.result-game-item-detail .result-game-item-info p')).eq(0).find($('span')).eq(1).text();
      const type = $(result).find($('.result-game-item-detail .result-game-item-info p')).eq(1).find($('span')).eq(1).text();
      const updateTime = $(result).find($('.result-game-item-detail .result-game-item-info p')).eq(2).find($('span')).eq(1).text();
      const latestChapter = {
        name: $(result).find($('.result-game-item-detail .result-game-item-info p')).eq(3).find($('a')).eq(0).text(),
        href: $(result).find($('.result-game-item-detail .result-game-item-info p')).eq(3).find($('a')).eq(0).attr('href')
      }; //href: {book, chapter}
      resultList.push({
        url,
        name,
        href: helper.getHref(href),
        description,
        author: author.trim(),
        type,
        updateTime,
        latestChapter: {
          name: latestChapter.name,
          bookId: helper.getBookIdFromChapterHref(latestChapter.href),
          chapterId: helper.getChapterIdFromChapterHref(latestChapter.href)
        }
      })
    })
    console.log(resultList);
    res.send(resultList);
  })
})

app.listen(5001, () => {
  console.log('app is listening at port 5001');
});
