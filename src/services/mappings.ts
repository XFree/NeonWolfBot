import {compose, Extra, Markup} from "Telegraf";

export class Mappings {
  public static interpolate(str: string, message: any): string {
    const isNeeded = /\${.*?}/.test(str);

    return isNeeded ? (new Function("message", "return `" + str + "`"))(message) : str;
  }

  public static actions(actions: object[] | object, page) {
    const handlers = [];

    if (!Array.isArray(actions)) {
      actions = Array.of(actions);
    }

    (actions as object[])
      .forEach((topAction) => {
        Object.keys(topAction)
          .forEach((key) => {
            const action = topAction[key];
            const options = (typeof action === "string") ? [action] : Object.keys(action)
              .filter((item) => {
                return item !== "text";
              })
              .map((optionKey) => {
                return Mappings[optionKey] ? Mappings[optionKey](action[optionKey], page) : action[optionKey];
              });

            handlers.push((ctx) => {
              const executor = ctx.router[key] ? ctx.router : ctx;
              let text = action.text;

              if (text) {
                text = Mappings.interpolate(text, ctx.update.message);

                executor[key](text, ...options);
              } else {
                executor[key](...options);
              }
            });
          });
      });

    return compose(handlers);
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
                  return /^on[A-Z].*/.test(prop) || (Markup[prop] && /button$/i.test(prop));
                })
                .forEach((eventName) => {
                  if (eventName === "onTap") {
                    page.hears(buttons.button, Mappings.actions(buttons[eventName], page));
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

    return new Extra().markup((markup) => {
      markup
        .resize(true)
        .keyboard(mapper(buttonsMarkup));

      extra
        .forEach((extraOpts) => {
          markup[extraOpts.method](extraOpts.args);
        });

      return markup;
    });

  }
}
