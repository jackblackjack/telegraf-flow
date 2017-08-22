const { compose, optional } = require('telegraf')
const GenericScene = require('./generic-scene')

class WizardContext {
  constructor (ctx, steps) {
    this.ctx = ctx
    this.steps = steps
    this.state = ctx.flow.state
    this.state._pos = this.state._pos || 0
  }

  get step() {
    return this.state._pos >= 0 && this.steps[this.state._pos]
  }

    selectStep (index) {
        let i_step = parseInt(index)
   
        this.state._pos = i_step
        return this
    }

  next () {
    return this.selectStep(this.state._pos + 1)
  }

  back () {
    return this.selectStep(this.state._pos - 1)
  }
}

class WizardScene extends GenericScene {
    constructor (id, options, ...steps) {
        super(id, options)
        this.steps = steps
    }
  
    middleware () {

        let self = this
        
        const handler = compose([
            (ctx, next) => {
                ctx.flow.wizard = new WizardContext(ctx, self.steps)
                return next()
            },
            super.middleware(),
            (ctx, next) => {
                
                // Check if flow ahs active step.
                if (!ctx.flow.wizard.step) {
                    ctx.flow.wizard.selectStep(0)
                    return ctx.flow.leave()
                }
                
                ctx.flow.wizard.step(ctx)
                return next()
            }/*,
            lazy((ctx) => {
                return ctx.flow.wizard.next() || safePassThru()
            })*/
        ])
 
        return optional((ctx) => ctx.session, handler)
    }
}
  
module.exports = WizardScene
