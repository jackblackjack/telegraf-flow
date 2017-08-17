const { Composer, compose, optional, lazy, safePassThru } = require('telegraf')

class WizardContext {
  constructor (ctx, steps) {
    this.ctx = ctx
    this.steps = steps
    this.state = ctx.flow.state
    this.state._pos = this.state._pos || 0
  }

  get step () {
    return this.state._pos >= 0 && this.steps[this.state._pos]
  }

  selectStep (index) {
    this.state._pos = index
    return this
  }

  next () {
    return this.selectStep(this.state._pos + 1)
  }

  back () {
    return this.selectStep(this.state._pos - 1)
  }
}

class WizardScene extends Composer {
  constructor (id, ...steps) {
    
    const opts = Object.assign({
      handlers: [],
      leaveHandlers: []
    }, {})
    super(...opts.handlers)

    this.id = id
    this.steps = steps

    this.leaveHandler = compose(opts.leaveHandlers)
  }

  leave (...fns) {
    this.leaveHandler = compose([this.leaveHandler, ...fns])
    return this
  }

  leaveMiddleware () {
    return this.leaveHandler
  } 

  middleware () {
    
    const handler = compose([
      super.middleware(),
      lazy((ctx) => ctx.flow.wizard || safePassThru()),
      (ctx, next) => {

        ctx.flow.wizard = new WizardContext(ctx, this.steps)
        
        if (!ctx.flow.wizard.step) {
          ctx.flow.wizard.selectStep(0)
          return ctx.flow.leave()
        }

        return ctx.flow.wizard.step(ctx, next)
      }
    ])
    
    return optional((ctx) => ctx['session'], handler)
  }
}

module.exports = WizardScene
