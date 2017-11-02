import {compose, Extra, Markup} from "Telegraf";

interface IButton {
  label: string;

  onTab?(): void;
}

export class Mappings {
  public static interpolate(str: string, message: any, state: any): string {
    const isNeeded = /\${.*?}/.test(str);

    return isNeeded ? (new Function("message, state", "return `" + str + "`"))(message, state) : str;
  }

  public static action(actions: object[] | object, page) {
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
                return Mappings[optionKey] ? Mappings[optionKey](action[optionKey])(page) : action[optionKey];
              });

            handlers.push((ctx) => {
              const executor = ctx.router[key] ? ctx.router : ctx;
              let text = action.text;

              if (options.length === 1 && typeof (options[0]) === "string") {
                options[0] = Mappings.interpolate(options[0], ctx.update.message, ctx.flow.state);
              }

              if (text) {
                text = Mappings.interpolate(text, ctx.update.message, ctx.flow.state);

                executor[key](text, ...options);
              } else {
                executor[key](...options);
              }
            });

          });
      });

    return compose(handlers);
  }

  public static keyboard(keyboardMarkup) {
    const mapper = (buttons, page) => {
      let result;

      if (Array.isArray(buttons)) {
        result = buttons.map((button) => {
          return mapper(button, page);
        });
      } else {
        Object.keys(buttons)
          .filter((key) => /^onTap$/.test(key))
          .forEach((eventName) => {
            page.hears(buttons.label, Mappings.action(buttons[eventName], page));
          });

        result = buttons.label;
      }

      return result;
    };

    return (page) => {
      return Markup.keyboard(mapper(keyboardMarkup, page)).resize().extra();
    };
  }
}
