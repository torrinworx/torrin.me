# Testing Patterns

**Analysis Date:** 2026-03-24

## Test Framework

**Runner:**
- Vitest 3.0.8 in `destamatic-ui/package.json`.
- Configured through `destamatic-ui/vitest.config.js` with `environment: 'jsdom'` and `setupFiles: ['util/document.js']`.

**Assertion Library:**
- Vitest `expect`.

**Run Commands:**
```bash
npm test              # root repo uses Node's test runner
cd destamatic-ui && npm test   # runs Vitest for the UI package
```

## Test File Organization

**Location:**
- Tests are co-located with the component they cover, under the same folder: `components/inputs/Button/button.test.jsx`, `components/inputs/TextField/textfield.test.jsx`, `components/display/Stage/stage.test.jsx`.
- File names are lower-case and mirror the component or module name.

**Structure:**
```
components/
  inputs/
    Button/
      Button.jsx
      button.test.jsx
```

## Test Structure

**Suite Organization:**
```jsx
describe('Button', () => {
	it('Should render a Button.', () => {
		const elem = document.createElement('body');
		mount(elem, <Button />);
		const tree = elem.tree();
		expect(tree.children[0].name).toBe('button');
	});
});
```

**Patterns:**
- Mount into a synthetic `body` element using `mount` from `destam-dom`.
- Inspect the rendered tree with `elem.tree()` instead of browser query APIs; this depends on the shim in `destamatic-ui/util/document.js`.
- Trigger behavior by calling handlers directly from `node.eventListeners.<event>`.
- Use small local helpers for fake events and async flushing (`createFakeEvent`, `flushMicrotasks`, `waitForAnimationFrames`).

## Mocking

**Framework:**
- Vitest `vi.fn`, `vi.spyOn`, and `vi.mock`.

**Patterns:**
```js
vi.mock('../../../ssg/is_node.js', () => ({
	default: () => isNode,
}));

const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
```

**What to Mock:**
- Internal environment switches (`components/display/Stage/stage.test.jsx` mocks `ssg/is_node.js`).
- Console methods when asserting warnings/errors.
- Event callbacks and user handlers with `vi.fn()`.

**What NOT to Mock:**
- The component tree, observer mutations, and DOM shim behavior; tests exercise these directly.

## Fixtures and Factories

**Test Data:**
```js
const createFakeEvent = () => ({
	currentTarget: { getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 }) },
	target: { getBoundingClientRect: () => ({ width: 50, height: 50, top: 0, left: 0 }) },
	preventDefault: vi.fn(),
});
```

**Location:**
- Factories live inline in each test file; there is no shared fixture directory.

## Coverage

**Requirements:**
- No coverage threshold is enforced in `destamatic-ui/package.json` or `vitest.config.js`.

**View Coverage:**
```bash
cd destamatic-ui && npx vitest run --coverage
```

## Test Types

**Unit Tests:**
- Most tests are component/unit tests for render shape and interaction in `components/inputs/Button/button.test.jsx`, `components/inputs/Toggle/toggle.test.jsx`, `components/inputs/TextField/textfield.test.jsx`, and `components/inputs/Checkbox/checkbox.test.jsx`.

**Integration Tests:**
- `components/display/Stage/stage.test.jsx` exercises context, routing, microtask timing, and URL synchronization together.
- `components/utils/Context/context.test.jsx` validates provider/consumer behavior and child tracking.

**E2E Tests:**
- Not used.

## Common Patterns

**Async Testing:**
```js
const flushMicrotasks = async (count = 1) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => queueMicrotask(resolve));
	}
};
```

**Error Testing:**
```js
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
expect(errorSpy).toHaveBeenCalled();
```

## What is Tested

- `Button`: rendering, labels, link behavior, keyboard/click handling, disabled/loading behavior in `components/inputs/Button/button.test.jsx`.
- `Toggle`: switch role, observer-backed state changes, callbacks, disabled behavior in `components/inputs/Toggle/toggle.test.jsx`.
- `TextField`: input rendering, placeholder labels, mutable vs immutable values, disabled behavior, password mode in `components/inputs/TextField/textfield.test.jsx`.
- `Checkbox`: toggle behavior, disabled guard, `onChange` callback in `components/inputs/Checkbox/checkbox.test.jsx`.
- `Stage`: initial act selection, `open()`, `onOpen`, URL props, child stage routing, fallback logging, and browser URL syncing in `components/display/Stage/stage.test.jsx`.
- `Context`: default resolution, transformed value propagation, and child provider tracking in `components/utils/Context/context.test.jsx`.

## Gaps

- Most modules under `components/display`, `components/head`, `components/navigation`, and `components/utils` have no test files.
- No test coverage is present for the theme engine in `components/utils/Theme/Theme.jsx`, the custom JSX handler in `components/utils/h/h.jsx`, or the context wrapper in `components/utils/ThemeContext/ThemeContext.jsx`.
- Rich text, icon sets, file drop, map/country pickers, and SSG helpers are not covered.
- There are no browser E2E tests; interaction coverage is limited to direct handler invocation in the DOM shim.

---

*Testing analysis: 2026-03-24*
