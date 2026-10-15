---
title: Building Equator's AI Proposal Writer From the First Commit
description: Engineering firms win work by answering RFPs. I made the first commit on Equator's AI proposal writer, which drafts those answers from a firm's own past work, and was its largest contributor. This is the part I built.
date: 2026-10-12
---

From March 2023 to September 2026 I was a software developer at Equator Studios in Kitchener. Equator makes mapping and site analysis software for civil engineering firms. It also has an AI proposal writer, Equator LDI, and I made its first commit in September 2023.

## The problem it solves

A civil engineering firm wins most of its work by answering RFPs (requests for proposals). An RFP lists what the client wants and how each answer will be scored. To write a response, someone has to find the right past projects, the right staff CVs and the right paragraphs from old proposals, then fit them to this RFP's criteria.

```scene:match
caption: An RFP's criteria, and the pieces of a firm's past work that answer each one
example: Example criteria and files
terms:
  - text: past projects
    as: found
  - text: staff CVs
    as: found
  - text: old proposals
    as: found
left:
  label: The RFP asks for
  items:
    - Stormwater design experience
    - A qualified project lead
    - Similar municipal clients
right:
  label: From the firm's past work
  items:
    - text: "Project sheet: pond retrofit"
      kind: file
      answers: [Stormwater design experience, Similar municipal clients]
    - text: "CV: water resources lead"
      kind: cv
      answers: [A qualified project lead]
    - text: "Old proposal: drainage approach"
      kind: proposal
      answers: [Stormwater design experience]
    - text: "Project sheet: city road rebuild"
      kind: file
      answers: [Similar municipal clients]
```

Equator LDI takes the RFP and the firm's own past work, and drafts a response tailored to the RFP's requirements.

## My part

I created the repository and was the main engineer through its first year. Equator is a small company, and at most three developers worked on the app at the same time. I stayed the largest contributor, with 56% of the commits and 64% of the lines added. I authored and merged 70 of its production releases, and I onboarded two developers onto the codebase.

```scene:numbers
caption: My share of Equator LDI's commits and lines, and the releases I authored and merged
figures:
  - label: of the commits
    value: 56%
  - label: of the lines added
    value: 64%
  - label: production releases I authored and merged
    value: "70"
```

```scene:pipeline
caption: A simplified sketch of the parts this post describes
example: Example files, request, searches and numbers
lanes:
  - label: When a firm uploads its files
    steps:
      - kind: files
        items: [Project sheet.pdf, Staff CV.pdf, Old proposal.pdf]
      - kind: model
        name: OpenAI's API
        line: turns text into vectors
        shows: "[0.12, 0.83, -0.40, …]"
      - kind: database
        name: Qdrant
        line: a vector database
  - label: When someone asks for a proposal section
    steps:
      - kind: request
        name: Request
        text: Describe your team's stormwater experience on road projects, and who would lead it.
      - kind: searches
        items: [stormwater design, road projects, lead engineer CV]
        reach: Qdrant
      - kind: found
        items: ["drainage section, road proposal", "project sheet: city road work", "CV: water resources lead"]
      - kind: prompt
        name: Prompt
        line: tuned per task, default in code
      - kind: draft
        name: Draft
        text: Our team has designed stormwater management for municipal road reconstruction. Our water resources lead would run the work.
```

## Searching a firm's own documents

Before the app can write anything, it has to know what the firm has done. When a firm uploads its files, the app makes them searchable by meaning. It turns the text into embeddings with OpenAI's API and stores them in Qdrant, a vector database. An embedding is a list of numbers that stands for what a piece of text means, so text with similar meaning gets similar numbers.

```scene:cluster
caption: Similar meanings sit close together, and a search finds the snippets nearest to it
example: Example snippets and searches
id: meanings
terms:
  - text: embeddings
    as: thing
  - text: similar meaning
    as: found
regions:
  - name: Stormwater
    snippets: [culvert sizing, stormwater pond retrofit, drainage study for a subdivision]
  - name: Roads
    snippets: [pavement rehabilitation, intersection redesign, municipal road reconstruction]
  - name: People
    snippets: ["CV: water resources engineer", "CV: transportation lead", "CV: structural engineer"]
  - name: Bridges
    snippets: [bridge deck replacement, structural inspection report, culvert to bridge upgrade]
searches:
  - words: detention pond design
    at: [Stormwater]
  - words: road resurfacing
    at: [Roads]
  - words: who leads a bridge job
    at: [People, Bridges]
```

An earlier version stored the embeddings in ChromaDB. I moved them to Qdrant.

## Finding the right material

The simple form of retrieval-augmented generation (RAG) turns the request into one embedding and fetches the closest chunks of text. That works for a short question. It works badly for a proposal section, which asks for several things at once, in wording a firm's old documents rarely use.

So I built query expansion. A model reads the request and writes several focused searches, each aimed at one part of it. The app runs them in parallel, merges the results and drops the duplicates.

```scene:fanout
caption: One search for the whole request, or one search for each part of it
example: Example request, searches and snippets
map: meanings
terms:
  - text: one embedding
    as: search
  - text: query expansion
    as: search
  - text: several focused searches
    as: search
from:
  label: Request
  name: Describe your team's experience designing stormwater management for municipal road reconstruction, and name who would lead the work.
into:
  - name: stormwater design
    at: [Stormwater]
  - name: road reconstruction
    at: [Roads]
  - name: water resources CV
    at: [People]
one:
  name: the whole request
  toggle: One search
toggle: Several searches
```

## Tuning it for each firm and each task

I built tooling so the prompt behind each AI task could be tuned without a code release, with a default in the code as the fallback. I also built an experimental admin tool for fine-tuning a model on a firm's past proposals.

```scene:toggle
kind: prompts
caption: Each task runs with its tuned prompt while one is live, or the default from the code
example: Example tasks and prompts
first: A tuned prompt
second: The default in code
terms:
  - text: a default in the code
    as: thing
tasks:
  - name: Project experience
    prompt: Summarize the firm's past projects that fit this section.
    edit: Lead with municipal road work, newest first.
  - name: Staff bios
    prompt: Describe each lead's role and experience.
  - name: Executive summary
    prompt: Summarize the response in plain language.
    edit: Keep it to one short paragraph.
```

## Looking back

I enjoyed my time at Equator and my work on this product. The way I build software has changed a lot since that first commit, mostly because of AI coding agents, and it was good to look back at the problems I worked on in Equator LDI and the solutions I built for them.

## Sources

- [AI Proposal Writer](https://equatorstudios.com/ai-proposal-writer/), Equator Studios' product page.
- [Data and security](https://equatorstudios.com/data-and-security/), Equator Studios, on the app's use of OpenAI's API for file search.
- [Equator LDI](https://ai.equatorstudios.com), the app itself.
- The commit, line and release counts are my own, counted in August 2026 while I worked there.
