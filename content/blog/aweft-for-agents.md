---
title: I Wrote a Web Framework, and I Didn't Write It for People
description: Every framework assumes a human is reading the docs. An agent opens the repo cold every time, so I built aweft for that reader instead.
date: 2026-09-23T18:10:00-04:00
---

I made a short about this: [watch it here](https://www.youtube.com/shorts/Dcsu7z7do_0). This is the longer version.

Over the past year I've been building a lot with Claude Code. I built three sites, [maccobylab.com](https://maccobylab.com), [kwbuilds.ca](https://kwbuilds.ca) and this one, all running on the same stack. It's called [aweft](https://aweft.dev).

## The problem

Every framework I've ever used assumes a human is reading the documentation. You learn it once, you find the quirks, and you build up a picture in your head of how to use it properly.

An agent doesn't get to keep that picture. Every time I open Claude Code, it starts cold. It has to read the repo again and relearn everything I told it in the last chat. Reading the docs every time isn't the problem. The problem is that it makes the same mistakes over and over again.

So I kept asking myself the same question: what does a framework look like when it's built for agents?

## The boring answer

The answer I found is boring. It's the best practices software teams have used for the last three decades. It's everything the cranky senior developer on your team loves about his repo:

- A ton of tests.
- A strict linter you don't really get the point of.
- Templates to follow, documentation, examples.
- Logs that actually tell you what to fix, instead of telling you to go kick rocks.

None of that is new. What I couldn't find was a stack that does all of it in one place, consistently, every single time, with the same tools.

## What aweft does

aweft puts all of that in one place and gives the agent room to fail fast, somewhere safe.

- **One reactive system, end to end.** An observer-based signals system carries every piece of data from the database, through the backend, to the DOM your users see.
- **State you can inspect.** Every piece of state that passes through the stack can be logged and inspected. When something fails or breaks a schema, the agent building the system can see exactly what happened, in production or on your laptop.
- **A build system that holds the line.** Frontend and backend modules have to match the systems you set up, instead of whatever the agent makes up on the fly.
- **Standards in the build.** WCAG accessibility and ASVS security checks are part of the build, so the tests fail when an agent breaks something.

It's 23 packages behind one gate, with more than 250 design notes, one per decision.

## Why

Humans have spent decades figuring out how to build really good software. aweft gives agents the tools and the guardrails to do the same.

It's MIT licensed. Check it out on [GitHub](https://github.com/torrinworx/aweft) or at [aweft.dev](https://aweft.dev), and build something great.
