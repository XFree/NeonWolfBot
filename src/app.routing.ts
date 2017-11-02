import {Composer, safePassThru} from "telegraf";
import * as Flow from "telegraf-flow";
import * as FlowContext from "telegraf-flow/lib/context";
import {Mappings} from "./services/mappings";

const {Scene} = Flow;

class RouterContext {
  constructor(public ctx) {
    // Test
  }

  public goTo(id: string, addHistory: boolean = true) {

    const flow      = this.ctx.flow,
          currentId = flow.current ? flow.current.id : null,
          history   = flow.state.history || [];

    const handler = Composer.compose([
      async (ctx) => {
        if (addHistory && currentId) {
          history.push(currentId);
        }
        await ctx.flow.leave();
        await ctx.flow.enter(id, {history});
        return ctx;
      }
    ]);

    return id && currentId !== id ? handler(this.ctx) : safePassThru();
  }

  public goToBack() {
    const flow   = this.ctx.flow,
          backId = flow.state.history.pop();

    return this.goTo(backId, false);
  }
}

export class Router extends Flow {
  constructor(pages?: any[]) {
    super();
    this.register(pages);
  }

  public register(pages) {
    if (pages) {
      Object.keys(pages)
        .forEach((pageId) => {
          const command = pageId,
                page    = new Scene(pageId);

          super.register(page);
          page.enter(Mappings.actions(pages[pageId], page));

          this.command(command, (ctx) => {
            ctx.router.goTo(command);
          });
        });
    }
  }

  public middleware() {
    return Composer.compose([
      (ctx, next) => {
        ctx.router = new RouterContext(ctx);
        return next();
      },
      (ctx) => {
        super.middleware()(ctx);
      }
    ]);
  }
}
