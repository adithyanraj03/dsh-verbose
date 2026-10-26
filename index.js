/**
 * dsh-verbose — host half.
 *
 * Most behaviour is in the browser (`client.js`): a 3-dots menu in the session
 * header carrying "Session log", "Transcript view → Normal / Verbose", and the
 * two settings popups. The row also exists because a profile bundle mounts a
 * Loader row, and the row is what carries the package into the composition so
 * its client half is served.
 *
 * The one host-side job is bridging `context-governor` to the browser. That
 * plugin publishes a plain cordis service — `ctx.get('contextGovernorCore')` with
 * `status` / `getSettings` / `setSettings` — but a plain service is not
 * reachable from a browser plugin. This file republishes it over a Typert
 * Remote namespace so the Compact settings panel can read the live budget and
 * move the per-session compaction threshold.
 *
 * The bridge lives HERE rather than in context-governor because the governor is
 * a TypeScript package with a build step and no browser half; adding the
 * protocol dependency and a bundle to it would be a lot of machinery for three
 * pass-through methods. The plugin that owns the menu owns the plumbing its
 * menu needs, and if the governor is absent every method answers `available:
 * false` and the client hides the item.
 */
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

export const name = 'dsh-verbose'

/** Set by `apply`, read by the remote — the runtime constructs the service. */
let governorCtx = null

/**
 * The governor's in-process service, or undefined when it is not mounted.
 *
 * `contextGovernorCore`, not `contextGovernor`: the remote below registers a
 * cordis Service under ITS key, and cordis rejects a duplicate name outright.
 * When both used `contextGovernor` the remote lost the race, its construction
 * threw, no HTTP route was registered, and the settings panel answered
 * "transport failure … HTTP 404" while the underlying service was perfectly
 * healthy. The wire name stays `contextGovernor`; the in-process one is Core.
 */
function governor() {
  if (governorCtx === null) return undefined
  try {
    const service = governorCtx.get('contextGovernorCore')
    return service === null ? undefined : service
  } catch (error) {
    return undefined
  }
}

class ContextGovernorRemote extends TypertRemoteService {
  constructor(ownerCtx) {
    super(ownerCtx, 'contextGovernor')
  }

  /**
   * The live budget reading plus this session's overrides.
   *
   * `available: false` rather than a throw when the governor is absent: the
   * menu asks on every open, and a missing optional plugin is not an error
   * worth surfacing as one — the client simply omits the item.
   */
  status(sessionId) {
    const service = governor()
    if (service === undefined || typeof service.status !== 'function') return { available: false }
    return { available: true, ...service.status(String(sessionId)) }
  }

  setSettings(sessionId, patch) {
    const service = governor()
    if (service === undefined || typeof service.setSettings !== 'function') {
      throw new Error('context-governor is not mounted')
    }
    return { available: true, settings: service.setSettings(String(sessionId), patch ?? {}) }
  }

  /** Write the values every chat inherits: the "default for all chats" action. */
  setDefaults(patch) {
    const service = governor()
    if (service === undefined || typeof service.setDefaults !== 'function') {
      throw new Error('context-governor is not mounted')
    }
    return { available: true, globals: service.setDefaults(patch ?? {}) }
  }

  /**
   * Compact this chat now — the panel's "Compact now" button.
   *
   * Runs the host's own compactor, the same one `/compact` uses. It runs
   * immediately when the session has a live agent, and otherwise arms for the
   * next message; the reply says which happened, so the label can be honest.
   *
   * Throws when the governor is absent, unlike `status`: this one is a direct
   * response to a click, so silence would read as a button that does nothing.
   */
  compactNow(sessionId) {
    const service = governor()
    if (service === undefined || typeof service.compactNow !== 'function') {
      throw new Error('context-governor is not mounted')
    }
    return { available: true, ...service.compactNow(String(sessionId)) }
  }

  /**
   * Every routable provider/model, for the compression picker.
   *
   * Answers an empty list rather than throwing when the governor is absent, so
   * a picker with nothing in it degrades to "no routes" instead of an error.
   */
  async listRoutes() {
    const service = governor()
    if (service === undefined || typeof service.listRoutes !== 'function') return { available: false, routes: [] }
    return { available: true, routes: await service.listRoutes() }
  }
}

/** Emulate the @Remote decorator without decorator syntax. */
function markRemoteMethod(prototype, method) {
  Remote(method)(prototype[method], {
    kind: 'method',
    name: method,
    static: false,
    private: false,
    access: {
      has() {
        return false
      },
      get() {
        return undefined
      },
    },
    addInitializer(fn) {
      fn.call(Object.create(prototype))
    },
  })
}
markRemoteMethod(ContextGovernorRemote.prototype, 'status')
markRemoteMethod(ContextGovernorRemote.prototype, 'setSettings')
markRemoteMethod(ContextGovernorRemote.prototype, 'setDefaults')
markRemoteMethod(ContextGovernorRemote.prototype, 'compactNow')
markRemoteMethod(ContextGovernorRemote.prototype, 'listRoutes')

export function apply(ctx) {
  governorCtx = ctx
  ctx.effect(() => () => {
    governorCtx = null
  }, 'dsh-verbose: governor bridge lifetime')

  try {
    new ContextGovernorRemote(ctx)
  } catch (error) {
    // The menu's other items do not depend on this, so a bridge that cannot
    // mount costs the Compact settings panel and nothing else.
    ctx.logger?.warn?.(`dsh-verbose: context-governor bridge unavailable: ${error?.message ?? error}`)
  }

  ctx.logger?.info?.('dsh-verbose: header menu mounted (client half)')
}
