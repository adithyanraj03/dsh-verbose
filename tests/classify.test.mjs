/**
 * Regression test for the Verbose category classification.
 *
 *   node classify-test.mjs
 *
 * WHY A SHIM
 *
 * No DOM implementation ships anywhere in this install (no jsdom, linkedom or
 * happy-dom), so the tree below is built on a minimal Element that implements
 * `getAttribute`, `matches` for attribute selectors, `closest` and
 * `querySelectorAll` to spec. That is a real limitation: this proves the
 * CLASSIFICATION LOGIC, not the browser's selector engine. It is worth having
 * anyway, because the bug it pins was pure logic — a compound selector that
 * required two attributes to sit on one element when the markup puts them on an
 * ancestor and a descendant.
 *
 * THE MARKUP IS NOT INVENTED. It mirrors, element for element:
 *
 *   dsh-client-ui-primitives/lib/index.js  DisclosureRow (1331-1377)
 *     <div class=root data-open?>
 *       <div class=row data-disclosure-row data-expandable? aria-expanded?>
 *
 *   dsh-client-ui-conversation/lib/client.js  ReasoningRow (9003-9019)
 *     <div data-variant="think" data-state=…>   <- wrapper, NOT the row
 *       <DisclosureRow expandOnRowClick />
 *
 *   dsh-client-ui-tool/lib/client.js  bash sample row (1168-1180)
 *     <div data-sample="bash" data-variant="bash" data-expandable aria-expanded>
 */

let passed = 0
const failures = []

function check(label, condition, detail) {
  if (condition) passed += 1
  else failures.push(detail === undefined ? label : `${label} — ${detail}`)
}

function eq(label, actual, expected) {
  check(label, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

// ---------------------------------------------------------------------------
// Minimal DOM
// ---------------------------------------------------------------------------

/** Parse a selector made only of attribute clauses: [a], [a="v"]. */
function clausesOf(selector) {
  const clauses = []
  const pattern = /\[([A-Za-z-]+)(?:="([^"]*)")?\]/g
  let match
  let consumed = 0
  while ((match = pattern.exec(selector)) !== null) {
    clauses.push({ name: match[1], value: match[2] })
    consumed += match[0].length
  }
  if (consumed !== selector.length) throw new Error(`shim cannot parse selector ${JSON.stringify(selector)}`)
  return clauses
}

class Element {
  constructor(attributes = {}, children = []) {
    this.attributes = attributes
    this.parentElement = null
    this.children = []
    this.clicks = 0
    for (const child of children) this.append(child)
  }

  append(child) {
    child.parentElement = this
    this.children.push(child)
    return child
  }

  getAttribute(name) {
    const value = this.attributes[name]
    return value === undefined ? null : String(value)
  }

  setAttribute(name, value) {
    this.attributes[name] = value
  }

  matches(selector) {
    // dsh 0.2 needs a selector LIST for the row query (turn-process rows OR the
    // legacy expandable rows), so the shim understands commas.
    return selector.split(',').some((alternative) =>
      clausesOf(alternative.trim()).every((clause) => {
        const actual = this.getAttribute(clause.name)
        if (actual === null) return false
        return clause.value === undefined || actual === clause.value
      }),
    )
  }

  /** Per spec: start at self, walk up, return the first match or null. */
  closest(selector) {
    let node = this
    while (node !== null) {
      if (node.matches(selector)) return node
      node = node.parentElement
    }
    return null
  }

  querySelectorAll(selector) {
    const out = []
    const walk = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) out.push(child)
        walk(child)
      }
    }
    walk(this)
    return out
  }

  click() {
    this.clicks += 1
    // The real rows are controlled React state; a click flips aria-expanded.
    const current = this.getAttribute('aria-expanded')
    if (current === 'true' || current === 'false') this.setAttribute('aria-expanded', current === 'true' ? 'false' : 'true')
  }
}

/** dsh 0.2: the chat groups a turn's process rows into ONE disclosure button. */
function turnProcess(open) {
  return new Element({
    'data-turn-process': '3',
    'aria-expanded': open ? 'true' : 'false',
    role: 'button',
  })
}

/** A DisclosureRow with expandOnRowClick, as the transcript's rows all use. */
function disclosure(open, extraRowAttributes = {}) {
  const row = new Element({
    'data-disclosure-row': 'true',
    'data-expandable': 'true',
    role: 'button',
    'aria-expanded': open ? 'true' : 'false',
    ...extraRowAttributes,
  })
  const root = new Element(open ? { 'data-open': 'true' } : {}, [row])
  return { root, row }
}

// ---------------------------------------------------------------------------
// The code under test, transcribed from client.js
// ---------------------------------------------------------------------------

// dsh 0.2 does NOT use the 0.1.5 markup: the chat groups a turn's process rows
// into one `data-turn-process` button, and only the bash toolview still marks
// itself expandable (as data-variant="bash").
const ROW = '[data-turn-process][aria-expanded], [data-process-activity][aria-expanded], [data-expandable][aria-expanded]'
const THINK = '[data-variant="think"]'
const GROUPS = '[data-process-activity]'
const TERMINAL = '[data-variant="bash"], [data-sample="bash"]'

function categoryOf(row) {
  if (row.closest(THINK) !== null) return 'thinking'
  if (row.closest(TERMINAL) !== null) return 'terminal'
  if (row.matches(GROUPS) || row.closest(GROUPS) !== null) return 'groups'
  return 'tools'
}

function toggleMatching(root, expanded, prefs) {
  if (!['thinking', 'tools', 'terminal', 'groups'].some((key) => prefs[key] === true)) return
  const wanted = expanded ? 'true' : 'false'
  for (const row of root.querySelectorAll(ROW)) {
    if (row.getAttribute('aria-expanded') !== wanted) continue
    if (prefs[categoryOf(row)] !== true) continue
    row.click()
  }
}

/**
 * Viewport scope with hysteresis.
 *
 * `band` answers shouldOpen / shouldClose for a row; the gap between the two is
 * the dead zone that stops the boomerang. `settled` gates folding, because a
 * row must not fold while the reader is still scrolling.
 */
function syncViewport(root, prefs, band, settled = true) {
  if (!['thinking', 'tools', 'terminal', 'groups'].some((key) => prefs[key] === true)) return 0
  let clicked = 0
  for (const row of root.querySelectorAll(ROW)) {
    if (prefs[categoryOf(row)] !== true) continue
    const expanded = row.getAttribute('aria-expanded') === 'true'
    const wanted = expanded ? (settled && band.shouldClose(row) ? false : undefined) : band.shouldOpen(row) ? true : undefined
    if (wanted === undefined) continue
    row.click()
    clicked += 1
  }
  return clicked
}

/** The broken version, kept only to pin the regression. */
function oldSelectorsFor(prefs, expanded) {
  const base = '[data-expandable][aria-expanded="' + (expanded ? 'true' : 'false') + '"]'
  const out = []
  if (prefs.thinking) out.push(base + THINK)
  if (prefs.terminal) out.push(base + TERMINAL)
  if (prefs.tools) out.push(base + ':not(' + THINK + '):not(' + TERMINAL + ')')
  return out
}

// ---------------------------------------------------------------------------
// A transcript
// ---------------------------------------------------------------------------

function transcript() {
  const body = new Element()

  // ReasoningRow: data-variant on the WRAPPER, two levels above the row.
  const think = disclosure(false)
  const thinkWrapper = new Element({ 'data-variant': 'think', 'data-state': 'ok' }, [think.root])
  body.append(thinkWrapper)

  // A generic tool row.
  const tool = disclosure(false)
  body.append(tool.root)

  // The bash toolview: its own row, both attributes on ONE element.
  const bash = new Element({
    'data-sample': 'bash',
    'data-variant': 'bash',
    'data-state': 'ok',
    'data-expandable': 'true',
    role: 'button',
    'aria-expanded': 'false',
  })
  body.append(new Element({}, [bash]))

  // A second thinking block, already open — collapse must reach it.
  const think2 = disclosure(true)
  const thinkWrapper2 = new Element({ 'data-variant': 'think', 'data-state': 'ok' }, [think2.root])
  body.append(thinkWrapper2)

  // The turn-level group button: the disclosure dsh 0.2 actually renders.
  const turn = turnProcess(false)
  body.append(turn)

  // A nested step group ("Ran commands"), one level below the turn.
  const group = new Element({ 'data-process-activity': 'thinking', 'aria-expanded': 'false', role: 'button' })
  body.append(group)

  return {
    body,
    thinkRow: think.row,
    toolRow: tool.row,
    bashRow: bash,
    openThinkRow: think2.row,
    turnRow: turn,
    groupRow: group,
  }
}

// ---------------------------------------------------------------------------
// 1. Classification
// ---------------------------------------------------------------------------

const t = transcript()
eq('a reasoning row classifies as thinking', categoryOf(t.thinkRow), 'thinking')
eq('a generic tool row classifies as tools', categoryOf(t.toolRow), 'tools')
eq('a bash row classifies as terminal', categoryOf(t.bashRow), 'terminal')
eq('the row query finds every disclosure row', t.body.querySelectorAll(ROW).length, 6)

// ---------------------------------------------------------------------------
// 2. The regression this fixes
// ---------------------------------------------------------------------------

// The old thinking selector required both attributes on one element.
check(
  'the old thinking selector matched no reasoning row',
  !t.thinkRow.matches('[data-expandable][aria-expanded="false"]' + THINK),
  'the think row now carries data-variant itself — re-check the premise',
)
// ...and the old "everything else" clause therefore swallowed thinking.
const oldSelectors = oldSelectorsFor({ thinking: false, tools: true, terminal: false }, false)
eq('with Thinking off the old code still had one selector', oldSelectors.length, 1)
check(
  'and that selector was the catch-all that also matched thinking rows',
  oldSelectors[0].includes(':not(' + THINK + ')'),
)

// ---------------------------------------------------------------------------
// 3. Only the enabled categories are expanded
// ---------------------------------------------------------------------------

{
  const s = transcript()
  toggleMatching(s.body, false, { thinking: false, tools: true, terminal: true })
  eq('Thinking off: the reasoning row is NOT expanded', s.thinkRow.clicks, 0)
  eq('Thinking off: the tool row IS expanded', s.toolRow.clicks, 1)
  eq('Thinking off: the bash row IS expanded', s.bashRow.clicks, 1)
}

{
  const s = transcript()
  toggleMatching(s.body, false, { thinking: true, tools: false, terminal: false })
  eq('only Thinking: the reasoning row is expanded', s.thinkRow.clicks, 1)
  eq('only Thinking: the tool row is untouched', s.toolRow.clicks, 0)
  eq('only Thinking: the bash row is untouched', s.bashRow.clicks, 0)
}

{
  const s = transcript()
  toggleMatching(s.body, false, { thinking: false, tools: false, terminal: true })
  eq('only Terminal: only the bash row is expanded', s.bashRow.clicks, 1)
  eq('only Terminal: the tool row is untouched', s.toolRow.clicks, 0)
  eq('only Terminal: the reasoning row is untouched', s.thinkRow.clicks, 0)
}

{
  const s = transcript()
  toggleMatching(s.body, false, { thinking: false, tools: false, terminal: false })
  eq('all off is a no-op', s.thinkRow.clicks + s.toolRow.clicks + s.bashRow.clicks, 0)
}

// ---------------------------------------------------------------------------
// 4. Collapse is symmetric, and only touches open rows
// ---------------------------------------------------------------------------

{
  const s = transcript()
  const all = { thinking: true, tools: true, terminal: true }
  toggleMatching(s.body, false, all)
  eq('expand pass opened the three collapsed rows', s.thinkRow.getAttribute('aria-expanded'), 'true')
  eq('the already-open row was not clicked shut by the expand pass', s.openThinkRow.clicks, 0)

  toggleMatching(s.body, true, all)
  eq('collapse closes the reasoning row', s.thinkRow.getAttribute('aria-expanded'), 'false')
  eq('collapse closes the tool row', s.toolRow.getAttribute('aria-expanded'), 'false')
  eq('collapse closes the bash row', s.bashRow.getAttribute('aria-expanded'), 'false')
  eq('collapse also closes the pre-opened reasoning row', s.openThinkRow.getAttribute('aria-expanded'), 'false')
}

{
  // Disabling one category while Verbose is on collapses only that kind.
  const s = transcript()
  toggleMatching(s.body, false, { thinking: true, tools: true, terminal: true })
  toggleMatching(s.body, true, { thinking: false, tools: false, terminal: true })
  eq('turning Terminal off collapses the bash row', s.bashRow.getAttribute('aria-expanded'), 'false')
  eq('...and leaves the tool row open', s.toolRow.getAttribute('aria-expanded'), 'true')
  eq('...and leaves the reasoning row open', s.thinkRow.getAttribute('aria-expanded'), 'true')
}

// ---------------------------------------------------------------------------
// 5. A tool row nested inside a reasoning block counts as thinking
// ---------------------------------------------------------------------------

{
  const inner = disclosure(false)
  const wrapper = new Element({ 'data-variant': 'think' }, [inner.root])
  const body = new Element({}, [wrapper])
  eq('the enclosing kind wins', categoryOf(inner.row), 'thinking')
  toggleMatching(body, false, { thinking: false, tools: true, terminal: true })
  eq('so Thinking off leaves it alone', inner.row.clicks, 0)
}

// ---------------------------------------------------------------------------
// 6. dsh 0.2's disclosure markup — the reason Verbose was inert here
// ---------------------------------------------------------------------------

{
  // The ported engine shipped with 0.1.5's selector, which matched nothing in
  // this build: rows carry `data-turn-process`, not `data-expandable`.
  const oldRow = '[data-expandable][aria-expanded]'
  const s = transcript()
  eq('the old selector only ever saw the legacy rows', s.body.querySelectorAll(oldRow).length, 4)
  check(
    'the turn-process button is NOT matched by the old selector',
    s.turnRow.matches(oldRow) === false,
  )
  check('...but IS matched by the current one', s.turnRow.matches('[data-turn-process][aria-expanded]'))

  const fresh = transcript()
  toggleMatching(fresh.body, false, { thinking: false, tools: true, terminal: true })
  eq('enabling tool calls opens the turn-process group', fresh.turnRow.getAttribute('aria-expanded'), 'true')
  toggleMatching(fresh.body, true, { thinking: false, tools: true, terminal: true })
  eq('and collapses it again', fresh.turnRow.getAttribute('aria-expanded'), 'false')

  // A popover trigger also has aria-expanded; it must never be clicked.
  const popover = new Element({ 'aria-haspopup': 'dialog', 'aria-expanded': 'false' })
  check('a dialog trigger is not a disclosure row', popover.matches(ROW) === false)
}

// ---------------------------------------------------------------------------
// 7. Nested step groups ("Ran commands") are their own category
// ---------------------------------------------------------------------------

{
  const s = transcript()
  eq('a nested step group classifies as groups', categoryOf(s.groupRow), 'groups')

  toggleMatching(s.body, false, { thinking: true, tools: true, terminal: true, groups: false })
  eq('with Step groups off the nested row stays shut', s.groupRow.clicks, 0)
  eq('while the turn-level group still opens', s.turnRow.getAttribute('aria-expanded'), 'true')

  const on = transcript()
  toggleMatching(on.body, false, { thinking: true, tools: true, terminal: true, groups: true })
  eq('with Step groups on the nested row opens', on.groupRow.getAttribute('aria-expanded'), 'true')

  // Turning only Step groups off collapses just those rows.
  toggleMatching(on.body, true, { thinking: false, tools: false, terminal: false, groups: true })
  eq('collapsing Step groups closes the nested row', on.groupRow.getAttribute('aria-expanded'), 'false')
  eq('and leaves the turn-level group alone', on.turnRow.getAttribute('aria-expanded'), 'true')
}

// ---------------------------------------------------------------------------
// 8. Viewport scope: on-screen rows open, off-screen rows close
// ---------------------------------------------------------------------------

{
  const all = { thinking: true, tools: true, terminal: true, groups: true }
  const bands = (open, close) => ({ shouldOpen: (row) => open.has(row), shouldClose: (row) => close.has(row) })

  // 1. On screen, nothing near the bands yet: opens.
  const s = transcript()
  syncViewport(s.body, all, bands(new Set([s.turnRow]), new Set()))
  eq('a row clearly on screen opens', s.turnRow.getAttribute('aria-expanded'), 'true')
  eq('a row in the dead zone is left alone', s.groupRow.clicks, 0)

  // 2. The boomerang: after opening, the layout pushed it into "neither band".
  //    A pass here must do nothing at all, or the row flips forever.
  const before = s.turnRow.clicks
  eq('neither band: no click, so no boomerang', syncViewport(s.body, all, bands(new Set(), new Set())), 0)
  eq('the row keeps the state it had', s.turnRow.clicks, before)

  // 3. A row that scrolled far away folds — but only once scrolling settled.
  eq('a row far away does not fold mid-scroll', syncViewport(s.body, all, bands(new Set(), new Set([s.turnRow])), false), 0)
  eq('still open while scrolling', s.turnRow.getAttribute('aria-expanded'), 'true')
  syncViewport(s.body, all, bands(new Set(), new Set([s.turnRow])), true)
  eq('folds once the reader stops', s.turnRow.getAttribute('aria-expanded'), 'false')

  // 4. Scrolling back opens it again, from the same state.
  syncViewport(s.body, all, bands(new Set([s.turnRow]), new Set()))
  eq('scrolling back opens it again', s.turnRow.getAttribute('aria-expanded'), 'true')

  // 5. A disabled category is never touched, in either band.
  const off = transcript()
  syncViewport(off.body, { thinking: true, tools: true, terminal: true, groups: false }, bands(new Set([off.groupRow]), new Set()), true)
  eq('a disabled category stays closed even when on screen', off.groupRow.clicks, 0)
}

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failures.length} failed`)
for (const failure of failures) console.log(`  FAIL: ${failure}`)
process.exitCode = failures.length === 0 ? 0 : 1
