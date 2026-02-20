
# header
Cross Platform is Easy

# description
Last week I built a website with my custom UI framework. I made it cross platform in an afternoon using Tauri.

# created
2026-02-19T22:41:00-05:00

# modified
2026-02-19T22:41:00-05:00

Last week I shipped a bunch of progress on a web app I’ve been building using my own frontend framework **destamatic-ui**.

---

![test](https://youtu.be/D2d7aqB4eHY)

The app already worked well in the browser, and I’d been iterating on it for about a week. Then I finally wired it into **Tauri 2.0**, and the part that surprised me was how *non-eventful* it was (in a good way): I got from “web app” to “this can be a real app on basically everything” in an afternoon.

That includes **Linux, macOS, Windows, iOS, and Android.** All driven from the same web UI.

## Why this is a game changer (for me)

I've never built a mobile app. Or a desktop app for that matter. I can now easily build a mobile platform app at the same speed I've been building my webapps, without having to re-learn any skills or tooling.

## Live updates without complicated setup

In the video above, I demo editing a description on my Android device. When I hit save, the change shows up in the web browser client right away.

That “sync” isn’t some huge stack of custom event plumbing. It’s just a natural outcome of building on **destam’s Observer model** and pushing state changes through the system in a clean way.

Destam’s approach (delta-based state + observers) makes UI updates feel direct and predictable. You mutate state, and the parts of the UI watching it update. No re-render trees, no “why did this component re-run,” no trying to coax a framework into doing the obvious thing.

## Where destamatic-ui fits in

I’ve been building [destamatic-ui](/destamatic-ui) as the opinionated UI layer on top of destam/destam-dom.

It’s basically the set of choices I want when I’m trying to ship:

- JSX-based components
- direct DOM updates (no VDOM)
- a real component library (inputs, navigation, display, icons, etc.)
- a cascading theme system that’s actually reactive
- Stage routing + static generation tools

If you’re curious, the docs/live site are here: [destamatic-ui](/destamatic-ui).

Pairing this with Tauri feels especially good because I can keep the UI simple and fast, while still having a path to ship the same product as a desktop/mobile app.

## KWBuilds.ca: the “real app” proving ground

I’ve also been working on **KWBuilds.ca**, which is basically my testbed for the larger stack.

The goal with KWBuilds is simple: a community index of projects being built in Kitchener–Waterloo — startups, side projects, open source, hobbies, experiments — and a low-friction way to collaborate locally.

But under the hood, it’s also where I’m validating the parts that matter when you’re building real products: auth, syncing, persistence, modules, uploads, “this needs to scale without rewriting everything,” etc.

## destam-web-core: the bigger system I’m building toward

KWBuilds is also helping shape **destam-web-core**, which is where I’m trying to remove the repetitive, annoying parts of building full stack apps.

The short version:

**destam-web-core extracts the modular foundation of OpenGig.org into a reusable client/server runtime.**  
It handles client rendering, websocket-based sync, observer-driven state propagation, and server-side job execution so new projects don’t have to rebuild the same infrastructure every time.

Stuff I care about a lot in this layer:

- **A universal user system** (authenticated + unauthenticated clients are first-class)
- **Real-time websocket sync** as a default, not an addon
- **Observer-driven state propagation** so client + server can share the same mental model
- **A modules system** where everything is extensible, reusable, and overwritable
- **Config overrides** so deployments can adjust behavior without forking modules

The “modules” approach is the key. Instead of every app reinventing:
auth, posts, uploads, validation, moderation, background jobs, state sync…
the idea is: you compose modules, override what you need, and ship.

KWBuilds is intentionally pretty straightforward as a product — because I want to use it to build out **really basic modules** that other projects can reuse without dragging in app-specific assumptions.

## Where I’m at right now

I’m still early in this, but the direction feels solid:

- **destamatic-ui** gives me a UI framework that’s fast and direct.
- **destam-web-core** is making “full stack + realtime” feel like a baseline.
- **Tauri 2.0** makes it realistic to ship the exact same web app as a real desktop/mobile app without a rewrite.

If you’re building something and you’ve wanted that “one codebase” feeling without the usual mess, this combo is worth a look.

More on the UI side here: [destamatic-ui](/destamatic-ui).