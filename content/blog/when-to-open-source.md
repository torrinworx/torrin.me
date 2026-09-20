---
title: When is the best time to Open Source?
description: When is the best time to take that private repo public? Does it matter if everything is working?
date: 2025-07-15
---

Open sourcing a project you've been working on for months is daunting. It means complete strangers are going to be able to use and critique your code, your choices, and ultimately your intelligence. Sounds scary and anxiety inducing, right?

Wrong. In reality, and I don't mean to knock your project, in the vast majority of cases no one will care.

Why am I saying this? Because it makes it important to open source your project immediately, if your intent is to gain an audience, a following, and grow a user base. Open source early and often. It doesn't matter what the quality of the code is, or even if everything is fully functional and working. The idea with open sourcing before anything is ready is that you expose your idea to the internet, to Google, to people just browsing around GitHub, Reddit, or dev.to.

People are too protective of their code. They think they are mastermind artists, and everything must be in its place. It must be production ready before others lay their hands on it.

The honest truth: no one cares, and no one will even know your code exists. When you go open source, the commit history of your git repo is etched in the stone that Linus Torvalds cut from the mountain himself. Unless you're a masochist, that is.

I did this with [aweft](https://github.com/torrinworx/aweft), my UI stack, in September 2026. It went public in five batches over two days: the working notes out of the repo and a vocabulary check in, a pass over every source file, test, recipe and README, the front door (the README, the licence, the contributing guide, the manifests), the history tidied in a fresh clone, and then five fresh agent builders handed nothing but the repo and asked to build a page from it. Their friction list fell from 37 entries to 29, their workarounds from 21 to 2, and none of them got stuck. That last batch is the one that mattered: the repo had to stand on its own for a stranger, and the way to find out was to hand it to one.
