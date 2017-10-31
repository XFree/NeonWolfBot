#!/usr/bin/env node

import Telegraf = require("telegraf");
import {Router} from "./app.routing";
import {MeetupsPage, StartPage} from "./pages/";
const pages = require("./pages/pages.json");


class NeonWolfBot {
  constructor(private token: string) {

  }

  public start() {
    const bot = new Telegraf(this.token);
    const router = new Router(pages);
    bot.catch((err) => {
      console.log("Ooops", err);
    });

    bot.use(Telegraf.memorySession());
    bot.use(router.middleware());
    router.register(pages);

    bot.startPolling();
  }
}

let app = new NeonWolfBot(process.env.BOT_TOKEN);

app.start();


process.title = "NeonWolfBot";
process.on('uncaughtException', function (error) {
  //log.add('Упс, произошла непредвиденная ошибка: '+error.stack);
  console.error(error.stack);
  return false;
});

function latlng2distance(lat1, long1, lat2, long2) {
  //радиус Земли
  const R = 6372795;
  //перевод коордитат в радианы
  lat1 *= Math.PI / 180;
  lat2 *= Math.PI / 180;
  long1 *= Math.PI / 180;
  long2 *= Math.PI / 180;
  //вычисление косинусов и синусов широт и разницы долгот
  const cl1 = Math.cos(lat1);
  const cl2 = Math.cos(lat2);
  const sl1 = Math.sin(lat1);
  const sl2 = Math.sin(lat2);
  const delta = long2 - long1;
  const cdelta = Math.cos(delta);
  const sdelta = Math.sin(delta);
  //вычисления длины большого круга
  const y = Math.sqrt(Math.pow(cl2 * sdelta, 2) + Math.pow(cl1 * sl2 - sl1 * cl2 * cdelta, 2));
  const x = sl1 * sl2 + cl1 * cl2 * cdelta;
  const ad = Math.atan2(y, x);
  const dist = ad * R; //расстояние между двумя координатами в метрах
  return dist;
}
