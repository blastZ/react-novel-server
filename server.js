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
  request({
    url: `${defaultURL}/book/${req.params.bookId}`,
    encoding: null
  }, (error, response, body) => {
    const html = iconv.decode(body, 'gbk');
    const $ = cheerio.load(html);
    const chapterList = [];
    $('#list dd a').each((index, chapter) => {
      chapterList.push({
        name: $(chapter).text(),
        href: $(chapter).attr('href')
      })
    })
    res.json({
      chapterList
    });
  })
})

app.get('/book/:bookId/:chapter', (req, res) => {
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
    res.send({
      name,
      html: $chapter.html()
    })
  })
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
      const updateTime = $(result).find($('.result-game-item-detail .result-game-item-info p')).eq(2).find($('span')).eq(1).text();
      resultList.push({
        url,
        name,
        href: helper.getHref(href),
        description,
        author: author.trim(),
        updateTime
      })
    })
    res.json(resultList);
  })
})

app.listen(5001, () => {
  console.log('app is listening at port 5001');
});
