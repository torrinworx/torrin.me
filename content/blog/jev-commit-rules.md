---
title: Claude Code Ignores My Rules, So a Tiny Model Checks Every Commit
description: Claude Code keeps sneaking metaphors into my comments, and markdown rules didn't stop it. So a small decision model called Jev now checks every commit against my rules.
date: 2026-09-26T20:00:00-04:00
---

I made a short about this. This is the longer version.

![Jev checking Claude Code's commits](https://youtu.be/DAcykJSP8XA)

Claude Code makes tons of mistakes. Whenever I'm using it, it always tries to sneak analogies and little metaphors into my comments and into the commit messages of my code base. It's really annoying.

## Rules in markdown don't stick

For the past year I've been setting up rules that Claude has to follow, in different markdown files, and constantly tweaking system prompts to get it to do what I want. Right now that's 11 CLAUDE.md files and 32 skills on my laptop, and 304 commits across my repos that edit a CLAUDE.md or AGENTS.md file.

Even when I define a rule in a skill, in a memory or in my global CLAUDE.md, Claude still forgets it and breaks it. And when the next model comes out, it all kind of goes out the window and isn't as effective anymore.

Here are three comments Claude wrote in my repos after I'd told it not to write like this:

- "in the accent on the page's paper."
- "Silence would pass every other check here, so this one listens."
- "so a listen lands on its drums, not its intro."

## Jev

Last week a new model came out called [Jev](https://typesafe.ai), made by TypeSafe. The cool thing about it is that it's just a pure decision model. It doesn't output any text at all. You send it some text and a question about that text, and it gives back an answer your program can use, with how sure it is.

It's really fast. In a test I ran on the 1,560 startups in [kwbuilds.ca](https://kwbuilds.ca), Jev's median answer took 213 ms. Claude Sonnet 5 took 1,262 ms on the same questions. Jev did all 1,560 for $0.19. Sonnet cost $1.64 for 150 of them.

## The setup

So I tasked Jev with guarding the commits to all the projects I'm working on. There are four rules right now:

| Rule | Checked by |
|---|---|
| No em dashes or dashes used as punctuation | regex |
| No semicolons in comments | regex |
| No metaphors, analogies or allegory | Jev |
| Speak plainly | Jev |

The first two are easy, so they're a regex. There isn't a regex for a metaphor or an analogy. Maybe there is, maybe it's really complicated. So for those I ask Jev a question:

> Does the text describe something as if it were something else: a metaphor, analogy or allegory?

After Claude Code makes a commit, a hook sends every new comment, every doc block and the commit message through the rules. Anything Jev scores over 0.7 goes back to Claude, and Claude fixes it in the next commit. The drums comment above scored 0.77, and Claude rewrote it:

- Before: "so a listen lands on its drums, not its intro."
- After: "so the recording has the drums in it and not the intro's fade."

The beauty of it is that I can create as many rules as I want.

## Where it slips

It isn't perfect. It flagged "an older experiment bakes byte-identical to before" at 0.83 as a metaphor, and that one is literal: the output really is the same bytes. So Claude doesn't just take the score. It judges the ones near the cutoff and records a verdict (fixed, false positive, missed or ok), and I use those verdicts to tune the cutoff.

It also doesn't block a commit yet. The score comes back after the commit lands, so the fix is a second commit. Blocking before the commit is the next step.

## What's next

I've also been playing with [Laya](https://huggingface.co/convaiinnovations/laya), an open source model built on the same idea. It runs on my ThinkPad, which is kind of cool. It's slower because it's running on my laptop, about 590 ms for four questions, but it's also free. I haven't set it up with the commit check yet. That's next.

It's a really annoying problem, and I think this is one of the best uses for this kind of model.
