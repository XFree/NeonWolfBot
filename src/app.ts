#!/usr/bin/env node

import * as TelegramBot from 'node-telegram-bot-api';
import "reflect-metadata";

let tg;


function create() {
    let token = "467853890:AAHBekLC6TOracF7k3Fzf3x8ZIHSKF4hyQw";

    tg = new TelegramBot(token, {
        polling: true
    });

    tg.on('message', onMessage);
    tg.on('callback_query', onCallbackQuery);
}
function onMessage(message) {
    console.log('message:', message);
    if (message.text && message.text.toLowerCase() == 'ping') {
        tg.sendMessage(message.chat.id, '<pre>pong</pre>', {
            parse_mode:'HTML'
        });
        return;
    }
    //
    if (message.text && message.text.toLowerCase() == '/start') {
        sendStartMessage(message);
        return;
    }
}
function sendStartMessage(message) {
    var text = 'Добро пожаловать в нашу супер-пупер игру';
    //
    var helpButton = {
        text:"Об игре",
        callback_data:'helpCmd'
    }
    //
    var gameButton = {
        text:"Начать игру",
        callback_data:'gameCmd',
        request_location: true
    }
    //
    var options = {};
    options.reply_markup = {};
    options.reply_markup.inline_keyboard = [];
    options.reply_markup.keyboard = [];
    options.reply_markup.inline_keyboard.push([helpButton, gameButton]);
    options.reply_markup.keyboard.push([{ text:"Начать игру", request_location: true}]);
    tg.sendMessage(message.chat.id, text, options);
}

function onCallbackQuery(callbackQuery) {
    console.log('callbackQuery:', callbackQuery);
    if (callbackQuery.data == 'helpCmd' || callbackQuery.data == 'gameCmd') {
        var helpText = "какой то текст об игре!!!";
        tg.sendMessage(callbackQuery.message.chat.id, helpText);
        tg.answerCallbackQuery({callback_query_id: callbackQuery.id});
    }
}
/*

process.title = "NeonWolfBot";
process.on('uncaughtException', function(error) {
    log.add('Упс, произошла непредвиденная ошибка: '+error.stack);
    console.error(error.stack);
    return false;
});
*/

create();