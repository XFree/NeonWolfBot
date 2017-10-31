import {compose, Extra, Markup} from "Telegraf";

export class Mappings {
  public static interpolate(str: string, message: any): string {
    return (new Function("message", "return `" + str + "`"))(Object.assign({}, message));
  }

  public static _action(actions, page) {
    const handlers = [];

    actions.forEach((topAction) => {
      Object.keys(topAction)
        .forEach((key) => {
          const action = topAction[key],
            options = Object.keys(action)
              .filter((item) => {
                return item !== "text";
              })
              .map((optionKey) => {
                return Mappings[optionKey] ? Mappings[optionKey](action[optionKey])(page) : action[optionKey];
              });

          if (Mappings[key]) {
            handlers.push(Mappings[key](action));
          } else {
            handlers.push((ctx) => {
              let text = action.text;

              if (text) {
                if (/\${.*?}/.test(text)) {
                  text = Mappings.interpolate(text, ctx.update.message);
                }
                ctx[key](text, ...options);
              } else {
                ctx[key](...options);
              }
            });
          }
        });
    });

    return compose(handlers);
  }

  public static goTo(id: string) {
    return (ctx) => {
      ctx.router.goTo(id);
    };
  }

  public static keyboard(keyboardMarkup) {
    const mapper = (buttons, page) => {
      let result;

      if (Array.isArray(buttons)) {
        result = buttons.map((button) => {
          return mapper(button, page);
        });
      } else {
        if (buttons.tap) {
          page.hears(buttons.label, Mappings._action([buttons.tap], page));
        }
        result = buttons.label;
      }

      return result;
    };

    return (page) => {
      return Markup.keyboard(mapper(keyboardMarkup, page)).extra();
    };
  }
}
