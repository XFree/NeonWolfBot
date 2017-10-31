import {Composer, safePassThru} from "telegraf";
import * as Flow from "telegraf-flow";
import * as FlowContext from "telegraf-flow/lib/context";
import {Mappings} from "./services/mappings";

const {Scene} = Flow;

class RouterContext {
  constructor(public ctx) {
    // Test
  }

  public goTo(id: string) {
    const handler = Composer.compose([
      async (ctx, next) => {
        await ctx.flow.leave();
        return next(ctx);
      },
      async (ctx, next) => {
        await ctx.flow.enter(id);
        return next(ctx);
      }
    ]);

    return Reflect.get(this, "ctx.flow.current.id") !== id ? handler(this.ctx) : safePassThru();
  }
}

export class Router extends Flow {
  constructor(pages: any[]) {
    super();
    this.register(pages);
  }

  public register(pages) {
    if (pages) {
      Object.keys(pages).forEach((pageId) => {
        const command = pageId,
              page = new Scene(pageId);

        super.register(page);
        page.enter(Mappings._action(pages[pageId], page));


        this.command(command, (ctx) => {
          ctx.router.goTo(command);
        })
      });
    }
  }


  public middleware() {
    const handler = Composer.compose([
      (ctx, next) => {
        ctx.flow = new FlowContext(ctx, this.scenes, this.options);
        ctx.router = new RouterContext(ctx);

        return next();
      },
      Composer.lazy(() => {
        return this.handler;
      }),
      Composer.lazy((ctx) => {
        return ctx.flow.current || Composer.safePassThru()
      })
    ]);

    return Composer.optional((ctx) => ctx[this.options.sessionName], handler);
  }

}
