---
title: A free AI that reads handwriting on my sketchpad
date: 2026-11-06
summary: You write a question on the sheet and an AI answers in crayon next to it. It runs on free tiers, so it had to be careful with every request.
tags: [backend, ai, systems]
draft: true
---

<!-- Draft written with Claude from the code and the work on it. Read it, change what doesn't sound like you, then set draft: false. -->

The sketchpad on this site is an endless sheet of paper. Write a question on it, by hand or typed, press
**ask**, and an AI reads the sheet and writes its answer in crayon right next to your question. It only
knows about me: my CV, my projects and this blog.

The rule I set myself: it has to be **free**. No bill if a lot of people use it, just "out of crayons" until
tomorrow. That one rule shaped most of the design.

## Reading the sheet

Typed notes are easy: they go as text. Handwriting is strokes, so the page has to work out what belongs
together before anything is sent:

- strokes close together are joined with a union-find, so the letters of a word become one group
- words on the same line are joined too, as long as the gap is no wider than about a letter is tall (people
  space words by the size they write, so a fixed gap split big writing apart)
- every new group is drawn into **one picture**, each in its own numbered box, and the model is asked to say
  which answer belongs to which box

Anything already answered isn't sent again, so asking twice costs nothing.

## What it knows

There's no database. The server reads Markdown files: my CV, an about page, each project's README and the
blog posts. The rules for how it behaves live in a Markdown file too.

Everything together is about 60,000 characters, and the free model I use can only read about 24,000 quickly.
So each question gets the core facts plus the sections that fit it best, ranked two ways:

- **by words**: sections sharing rarer words with the question score higher
- **by meaning**: every section has an embedding (made once, with a free model, and stored in the repo), so
  "the crypto contest at his old college" finds Negotium even though it shares no words with it

## The models

The server tries providers in order, under a 9-second deadline (the serverless function gets 10):

- a provider that rejects the key or runs out of allowance is skipped for 10 minutes, so it doesn't eat
  everyone's time
- replies must be strict JSON, and are checked before they reach the page
- small models sometimes swap answers between two questions, so answers are matched to questions by the text
  the model copies back, not only by the label it was given

If every provider is down, common typed questions still get an answer from a short hand-written FAQ.

## Being careful with free

- **A cache.** The same question, typed the same way, gets the stored answer instantly, until the notes
  change.
- **A shared rate limit**: 6 questions a minute and 60 a day per visitor, kept in Netlify Blobs so it holds
  across serverless instances (counting in memory, each instance had its own count).
- **A log** of what people ask, with nothing about who asked, so I can see what to add to its notes.

## Testing it, and the mistake I made

I wrote 30 questions with what each answer must and mustn't say: facts, made-up facts, off-topic requests,
private details, someone telling it to ignore its rules, and follow-ups like "what about the other one?". The
first run caught it inventing a link between a tool and a project, and that turned into a rule.

Then I ran the set a few too many times in one afternoon, and used up the whole day's free allowance. The
live site was "out of crayons" until midnight UTC, apart from the FAQ answers. It was a good test of the
fallback, and a better lesson: the test suite spends the same budget as the visitors, so now it can run just
the questions that changed.
