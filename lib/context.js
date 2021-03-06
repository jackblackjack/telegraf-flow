const debug = require('debug')('telegraf:flow:context')
const { compose, safePassThru } = require('telegraf')

const noop = () => {}

class FlowContext {
  constructor (ctx, scenes, options) {
    this.ctx = ctx
    this.scenes = scenes
    this.options = options
  }

  get session () {
    const sessionName = this.options.sessionName
    this.ctx[sessionName]._flow = this.ctx[sessionName]._flow || {}
    return this.ctx[sessionName]._flow
  }

  get state () {
    this.session._state = this.session._state || {}
    return this.session._state
  }

  set state (value) {
    this.session._state = Object.assign({}, value)
  }

  get current () {
    return (this.session.id && this.scenes.has(this.session.id)) ? this.scenes.get(this.session.id) : null
  }

  enter (sceneId, initialState, silent = false) {
    if (!sceneId || !this.scenes.has(sceneId)) {
      throw new Error(`Can't find scene: ${sceneId}`)
    }

    // Save current scene id.
    this.session.id = sceneId

    // Init flow context state.
    this.state = initialState

    // Define a list handlers.
    let enter_handlers = []

    if (! silent) {
      // Check if current has enterMiddleware handler.
      if ('[object Function]' === Object.prototype.toString.call(this.current.enterMiddleware)) {
        enter_handlers.push(this.current.enterMiddleware())
      }
    }

    // Register handler if middleware handler is exists.
    if ('[object Function]' === Object.prototype.toString.call(this.current.middleware)) {
        enter_handlers.push(this.current.middleware())
    }

    return compose(enter_handlers)(this.ctx, noop)
  }

  reenter () {
    return this.enter(this.session.id, this.state)
  }

  leave () {
    debug('leave')
    const handler = this.current && this.current.leaveMiddleware
      ? this.current.leaveMiddleware()
      : safePassThru()
    return handler(this.ctx, noop).then(() => delete this.ctx.session._flow)
  }
}

module.exports = FlowContext
