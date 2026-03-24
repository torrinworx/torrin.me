# Coding Conventions

**Analysis Date:** 2026-03-24

## Naming Patterns

**Files:**
- Component modules use `PascalCase` filenames inside a matching directory, e.g. `components/inputs/Button/Button.jsx`, `components/inputs/TextField/TextField.jsx`, and `components/display/Stage/Stage.jsx`.
- Tests use lower-case filenames that mirror the component name, e.g. `components/inputs/Button/button.test.jsx`, `components/inputs/Toggle/toggle.test.jsx`, and `components/display/Stage/stage.test.jsx`.
- Example/demo files follow the same lower-case pattern, e.g. `components/inputs/Button/button.example.jsx` and `components/display/Stage/stage.example.jsx`.

**Functions:**
- Component factories and helpers use `camelCase` (`createContext` in `components/utils/Context/Context.jsx`, `useRipples` in `components/utils/Ripple/Ripple.jsx`, `handleClick` in `components/inputs/Toggle/Toggle.jsx`).
- Public component exports are default-exported as component names (`Button`, `Toggle`, `TextField`, `Checkbox`) and imported with matching casing.

**Types / objects:**
- Context-like singletons use `PascalCase` (`ThemeContext`, `InputContext`, `StageContext`).
- Theme keys use lower-case + underscores for variants and states (`button_contained_disabled`, `togglethumb_checked`) in `components/inputs/Button/Button.jsx` and `components/inputs/Toggle/Toggle.jsx`.

## Code Style

**Formatting:**
- Source files in `components/**` use semicolons, multiline trailing commas, and JSX returned directly from arrow functions.
- Tabs appear throughout most component/test files; config files such as `package.json` and `vitest.config.js` use two-space indentation.
- Keep theme blocks visually separated with blank lines, as in `components/inputs/Button/Button.jsx` and `components/inputs/TextField/TextField.jsx`.
- No project-local ESLint/Prettier config is detected in the repository root or `destamatic-ui/`.

**Linting:**
- Not detected. Preserve the local file style instead of assuming a formatter will normalize it.

## Import Organization

**Order:**
1. External packages (`destam`, `destam-dom`, `vitest`).
2. Internal relative imports from `components/**` and `util/**`.
3. Package entry imports from `@destamatic/ui` in tests and consumers.

**Path Aliases:**
- No project alias config is detected; package exports provide `@destamatic/ui` for consumers and tests, as seen in `destamatic-ui/package.json` and the test files under `components/**`.
- Internal modules prefer relative paths such as `../../utils/Theme/Theme.jsx` and `../Button/Button.jsx`.

## Component Patterns

**Theme-first module setup:**
- Component modules call `Theme.define(...)` at module scope before exporting the component, e.g. `components/inputs/Button/Button.jsx`, `components/inputs/Checkbox/Checkbox.jsx`, and `components/display/Stage/Stage.jsx`.
- Theme names encode base, variant, and state with underscores and are referenced through `theme={[...]}` arrays.

**Context wrapping:**
- Stateful components are commonly wrapped in `ThemeContext.use(...)` and/or `InputContext.use(...)`, e.g. `components/inputs/Button/Button.jsx` and `components/inputs/TextField/TextField.jsx`.
- Context factories are created with `createContext(def, transform)` in `components/utils/Context/Context.jsx` and consumed with `.use(...)`.

**Reactive prop normalization:**
- Plain values are converted to `Observer` instances at the component boundary (`Observer.mutable(...)` or `Observer.immutable(...)`) before use, as in `Button.jsx`, `Toggle.jsx`, `TextField.jsx`, and `Checkbox.jsx`.
- Props are passed through with `...props`, but component-specific behavior is wired through reactive props like `theme`, `disabled`, `focused`, `hover`, `loading`, and `value`.

**DOM binding style:**
- `ref` is usually an `Observer.mutable(null)` rather than a raw DOM variable, enabling DOM access from reactive logic in `TextField.jsx` and `Checkbox.jsx`.
- JSX is used directly as the render return; parenthesized JSX wrappers are avoided.

## Error Handling

**Patterns:**
- Guard clauses are preferred for disabled/immutable states before mutation (`Button.jsx`, `TextField.jsx`, `Checkbox.jsx`, `Toggle.jsx`).
- Invalid configuration throws explicit errors, e.g. `Stage.open` in `components/display/Stage/Stage.jsx` throws when `name` is neither string nor array.
- Non-fatal anomalies use `console.warn` or `console.error`, such as missing stage acts in `Stage.jsx` and promise rejection logging in `Button.jsx`.
- Preserve state consistency with `try/finally` when a DOM update must happen even after a callback error, as in `components/inputs/Checkbox/Checkbox.jsx`.

## Comments

**When to comment:**
- Comments are used to explain edge cases, API constraints, and behavior choices rather than obvious code.
- TODO/FIXME notes exist in `components/inputs/Toggle/Toggle.jsx` and `components/display/Stage/Stage.jsx`; treat them as active design constraints.

**JSDoc/TSDoc:**
- JSDoc is used selectively for subtle helper APIs, especially in `components/utils/Context/Context.jsx` and `components/inputs/Checkbox/Checkbox.jsx`.

## Function Design

**Size:**
- Keep render functions small enough to normalize props, define handlers, and return JSX without splitting into unrelated modules unless the behavior is shared.

**Parameters:**
- Prefer destructured props with defaults (`type = 'contained'`, `round = false`, `hrefNewTab = true`).
- Use rest props to forward unknown attributes to the underlying element.

**Return Values:**
- Components return JSX directly; helpers return observers, closures, or plain values as appropriate.

## Module Design

**Exports:**
- Components are default exports; utilities often combine default exports with named exports (`Stage`, `StageContext`, `stageRegistry` in `components/display/Stage/Stage.jsx`).

**Barrel Files:**
- `destamatic-ui/index.js` re-exports the public API; add new public modules there when they should be consumable from `@destamatic/ui`.

---

*Convention analysis: 2026-03-24*
