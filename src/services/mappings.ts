import {compose, Extra, Markup} from "Telegraf";

export class BEvent {
  public static isEvent(prop): boolean {
    return /^on[A-Z].*/.test(prop);
  }

  public static onAnswer(answerText, value, page) {

    page.hears((text, ctx) => {
      const replayToMessage = ctx.update.message.reply_to_message;
      if (replayToMessage && replayToMessage.text === answerText) {
        BMappings.actions(value, page)(ctx);
      }
    });
  }
}

export class BMappings {
  /* Интерполяция строк */
  public static interpolate(str: string) {
    const isNeeded = /\${.*?}/.test(str);

    return isNeeded ? (new Function("message", "return `" + str + "`")) : (message) => str;
  }

  public static actions(actions: object[] | object, page) {
    const handlers = [];

    if (!Array.isArray(actions)) {
      actions = Array.of(actions);
    }

    (actions as object[])
      .forEach((topAction, index) => {
        Object.keys(topAction)
          .forEach((key) => {
            const action = topAction[key];
            const options = (typeof action === "string") ? [action] : Object.keys(action)
              .filter((item) => {
                return item !== "text";
              })
              .map((optionKey) => {
                let result;

                if (BEvent.isEvent(optionKey)) {
                  BEvent[optionKey](action.text, action[optionKey], page);
                } else if (BMappings[optionKey]) {
                  result = BMappings[optionKey](action[optionKey], page);
                } else if (Markup[optionKey]) {
                  result = Markup[optionKey](action[optionKey]).extra();
                } else {
                  result = action[optionKey];
                }

                return result;
              })
              .filter((item) => item);

            handlers.push((ctx) => {
              const executor = ctx.router[key] ? ctx.router : ctx;
              const text = action.text;
              let args;

              if (text) {
                args = [text, ...options];
              } else {
                args = options;
              }

              args = args.map((option) => {
                return typeof option === "string" ? BMappings.interpolate(option)(ctx.update.message) : option;
              });

              return executor[key](...args);
            });
          });
      });

    return (ctx) => {
      return compose(handlers.map((handler) => {
        return handler(ctx);
      }));
    };
  }

  public static keyboard(keyboardMarkup, page) {
    const mapper      = (buttons) => {
            let result;

            if (Array.isArray(buttons)) {
              result = buttons.map((button) => {
                return mapper(button);
              });
            } else {
              Object.keys(buttons)
                .filter((prop) => {
                  return BEvent.isEvent(prop) || (Markup[prop] && /button$/i.test(prop));
                })
                .forEach((eventName) => {
                  if (eventName === "onTap") {
                    page.hears(buttons.button, BMappings.actions(buttons[eventName], page));
                  } else if (buttons[eventName] && Markup[eventName]) {
                    result = Markup[eventName](buttons[eventName], !!buttons.hide);
                  }
                });
            }

            return result;
          },
          isExtMarkup = keyboardMarkup.hasOwnProperty("buttons"),
          options     = {},
          extra       = [];

    let buttonsMarkup;

    if (isExtMarkup) {
      Object.keys(keyboardMarkup)
        .forEach((option) => {
          if (option === "buttons") {
            buttonsMarkup = keyboardMarkup[option];
          } else if (Markup[option]) {
            extra.push({method: option, args: keyboardMarkup[option]});
          } else {
            options[option] = keyboardMarkup[option];
          }

        });
    } else {
      buttonsMarkup = keyboardMarkup;
    }

    return new Extra()
      .markup((markup) => {
        markup
          .resize(true)
          .keyboard(mapper(buttonsMarkup), options);

        extra
          .forEach((extraOpts) => {
            markup[extraOpts.method](extraOpts.args);
          });

        return markup;
      });

  }

  constructor(public page: any) {

  }

  public actions(actions: object[] | object) {
    BMappings.actions(actions, this.page);
  }

  public keyboard(keyboardMarkup) {
    BMappings.keyboard(keyboardMarkup, this.page);
  }
}
