---
title: I Run a Startup Directory Alone, and Claude Code Writes the Code
description: Builderloo lists 851 Waterloo Region startups. I run it by myself, and Claude Code writes almost all of it. Here's how that works, and a few times it went wrong.
date: 2026-10-13
draft: false
---

[Builderloo](https://builderloo.ca) is a directory of Waterloo Region tech: startups, jobs, events and news. Today it lists 851 startups, 121 open roles and 84 events. I run it by myself, and Claude Code writes almost all of the code.

People tend to assume that means I type "build me a startup directory" and wait. It doesn't. I spend most of my time deciding what to build and checking what comes back. Here's what that looks like, and a few times it went wrong.

## What runs on its own

A scheduler on the server reads 4 startup hubs, 18 news sources, 5 event calendars, and the careers pages and blogs of every listed company. Anything that might not be Waterloo tech waits for me to look at it. The whole thing runs on [aweft](/blog/aweft-for-agents), my own framework, on one 1 GB droplet.

```scene:pipeline
caption: How a startup, a story or an event gets onto Builderloo
lanes:
  - steps:
      - kind: data
        name: Sources
        line: hubs, news, calendars, careers pages
      - kind: build
        name: Scheduler
        line: runs each pipeline on the server
      - kind: model
        name: Checks
        line: does it belong to Waterloo Region tech?
      - kind: database
        name: Directory
        line: Postgres, and my edits are kept
      - kind: pages
        name: builderloo.ca
        line: pages, feeds, the forum and an MCP server
note: Anything the checks can't decide waits for me.
```

## Nothing gets built until I say yes

Every change starts as a conversation. Claude asks why I want the thing and what has to be true when it's done. If a question can be settled by measuring something for a few minutes, it measures. Then it writes a work order short enough that I can read it once and say yes or no.

After I say yes, a build agent builds exactly that and nothing else. It writes tests, then breaks its own code one line at a time to make sure the tests notice. Two more agents review the work, each starting with no memory of how it was built. One only gets the docs and has to use the thing. The other one's whole job is to break it. I read what they found, and only then does anything get committed.

Each session ends with a short log of what happened, and anything left over goes on my to-do list.

```scene:pipeline
caption: From an idea to a commit, the way most Builderloo changes go
lanes:
  - steps:
      - kind: request
        name: An idea
        text: Render every public page on the server, and keep it until its data changes.
      - kind: draft
        name: Work order
        text: What gets built. My calls and my answers. Not in scope. Done when.
      - kind: build
        name: /build
        line: tests and mutants
      - kind: model
        name: Two reviews
        line: with fresh context
      - kind: upload
        name: Commit
        line: after my yes
        badge: me
```

## The reviewers find real bugs

Work order 456 moved every public page to the server, cached until its data changes. Two builders split it, and the two reviewers checked their work.

```scene:fanout
caption: The agents on work order 456
from:
  name: Work order 456
into:
  - name: First builder (Opus)
    line: the server render and the cache
  - name: Second builder (Opus)
    line: the job and event pages
  - name: Docs-only reviewer (Sonnet)
    line: sees only the public site
  - name: Adversarial reviewer (Opus)
    line: tries to break it
```

One reviewer noticed that nothing limited how many pages could render at once. It sent 400 different URLs, and the server went from 765 MB of memory to 1.76 GB in 6 seconds. That's more memory than the droplet has. On another change, a reviewer found that a forged From header on the admin inbox could pick who my reply went to.

The agents get things wrong too, and often. When I moved Builderloo onto aweft, three builders split the port, and every one of their reports was partly wrong in a way that mattered. One missed a race that only showed up on an empty database. So nothing changes until a finding reproduces.

## Measure first

The scrapers used to run on Firecrawl, which drives a headless browser inside a Docker setup of about 12 GB. In May I tried something much simpler: a plain HTTP request and an HTML parser. Across the 493 listed startups, it got the content for 98.8% of sites. The browser and the 12 GB went away, and the scrapers now run anywhere, including that 1 GB droplet.

```scene:numbers
caption: The scraper bake-off over the 493 listed startups
figures:
  - label: of sites a plain HTTP request could read
    value: 98.8%
```

## The events company rejected as an outdoor brand

On September 30 I noticed Wygo wasn't in the directory. Wygo is a local events platform. A pass back in June had rejected it as an "outdoor lifestyle brand", going off a homepage with almost no text on it.

If that pass got Wygo wrong, it probably got others wrong. So I had Claude re-check every reject from it: 467 startups, one Sonnet agent each, about 16 minutes start to finish. 88 had a real local tie, and 32 were tied only by a listing on a startup hub. The other 347 stayed out. OpenText and RideCo were in the 120 that came back. I approved them, and the directory went from 699 startups to 819.

```scene:fanout
caption: The re-review of the June rejects
from:
  name: 467 June rejects
  line: one Sonnet agent each
into:
  - name: 88 back in
    line: a local tie
  - name: 32 back in
    line: a hub listing only
  - name: 347 stay out
    line: mostly dead sites or not tech
```

## The newsletter I tried to automate

The Weekly goes out on Monday mornings. In June I wrote it with Claude and edited every line. That took hours a week, and I stopped after 3 issues.

In September I moved it to a job on the server. Code wrote the sections, Claude wrote a line or two per item, and a small model checked the tone. It was meant to take me a few minutes a week. It read like nobody wrote it. My note on the drafts was "The 'voice' is really wrong", and they kept repeating last week's items.

On October 12 I moved it back into Claude Code, where I read each draft before it goes out. Code still writes every heading and link. The issue on September 28 went to 2 people. The one on October 12 went to 20.

```scene:numbers
caption: The issue on September 28, then the issue on October 12
figures:
  - label: people The Weekly went to
    from: "2"
    to: "20"
```

## What's still mine

The agents decide how something gets built. Anything that changes what the site does is my call, and the work order says which is which. A few of those calls:

```scene:toggle
kind: prompts
caption: Four of my calls, with what was there and what I chose
first: What I chose
second: What was there
tasks:
  - name: Scraped contact details
    prompt: Any signed-in user sees them.
    edit: Admins only.
  - name: The landing pages
    prompt: Held out of the sitemap.
    edit: All in the sitemap.
  - name: Startups tied only by a hub listing
    prompt: Held in review.
    edit: Listed.
  - name: Drafting The Weekly
    prompt: The Monday job on the server.
    edit: The newsletter skill in Claude Code.
```

If you want to try the directory from Claude, the steps are on [builderloo.ca/mcp](https://builderloo.ca/mcp).
