# Retrospective — read before acting, every session

Process lessons: the mistakes that made work take longer than it needed to. The technical facts
live in the other `_instructions/` files. The first block is inherited from the workspace this
template was copied from (a 3D-modding workflow, several finished projects); the lessons are
written generically because they recur in any software project. Add your own below.

---

## Inherited lessons

### 1. Survey the real thing before building against it
The most expensive mistake on record: work was built against numbers written in a notes file.
They were never the real values; everything downstream was built to fiction and redone twice.
**Rule:** before building on an input (an API's behaviour, a file format, the target's
limits), measure it on the real thing and write the result down as MEASURED.

### 2. Notes are claims, not facts — label provenance
A note named identifiers that resolved to nothing a session later (they were temporary names from
a different tool). **Rule:** record *what kind* of identifier something is and how it was
obtained. Prefer stable identifiers over volatile ones (indices, auto-generated names).

### 3. A heuristic that works on one axis is not a rule
"Bigger is safer" was right in one direction and wrong in another. **Rule:** before generalising
a fix, check it in every dimension it applies to.

### 4. Verify the measuring tool before trusting the measurement
A check reported "all good" because it sampled exactly on a grid line and hit a degenerate case.
**Rule:** run every new check once against a known-bad input (a control) and confirm it fails.

### 5. "It reported success" is not success
Tools, exporters and shells can return OK and change nothing. **Rule:** after every write, read
the result back and compare (hash, byte count, the changed value itself).

### 6. A saturated parameter looks exactly like a dead one
Tuning a value that "does nothing" for rounds - it was already at its limit. **Rule:** probe 0
(or the opposite extreme) first, then approach from below.

### 7. Grey-on-grey tests are unfalsifiable
**Rule:** on the second failed visual fix, use an unmistakable test (garish colour, huge size)
to prove the change reaches the screen at all.

### 8. One change at a time when the user tests
Several changes in one round make a regression impossible to attribute. **Rule:** one logical
change per test round, with a numbered test list for the user.

### 9. Do not regress what the user already approved
Rebuilding a part from scratch silently changed things the user had signed off. **Rule:** keep
approved output byte-identical where possible and prove it (diff/hash) after a rebuild.

### 10. Generated data must not depend on the previous build
A build step read state left over from the previous run, so every rebuild drifted a little.
**Rule:** builds are reproducible from source; anything they read is either source or pinned.

### 11. A tool the user runs elsewhere has its own bookkeeping
Renaming/editing files produced by another tool (or another session) outside of it broke that
tool's records. **Rule:** change such files only through their tool, or tell the user exactly
what was changed so the other side can be updated.

### 12. Ask before the outward step, not after
Deploying, publishing, restarting something the user is currently using, or pushing - always the
user's go first, unless they gave a standing permission (write it down in memory/STATE).

### 13. Budget tokens like money
Big multi-agent runs burned a week's budget in hours. **Rule:** cheapest route first (read the
few right files); agree on agent count and purpose before any large fan-out.

---

## Lessons from this workspace

<!-- Promoted here on "update the guides". Format as in CLAUDE.md (Symptom / Cause / Rule / Verified). -->
