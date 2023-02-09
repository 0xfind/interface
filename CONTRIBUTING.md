# Contributing to 0xfind Interface

If you're interested in contributing ideas or code to FindPrice, you're in the
right place!

## Development

Check out the [README](README.md#usage) for instructions on running the app in
development.

## Finding something to work on

Start with issues labelled
[`good first issue`](https://github.com/0xfind/interface/issues).

## Getting your pull request reviewed, approved, and merged

Create a pull request (PR) that targets the `main` branch.

When your PR has met the [#approval guidelines](approval-guidelines) and is
ready for review, `@mention` and ask for a
review.

### Git workflow

We opt for a **rebase policy** where the repository history is kept flat and
clean. When a feature branch's development is complete, rebase/squash all the
work down to the minimum number of meaningful commits.

While the work is still in progress and a feature branch needs to be brought up
to date with the upstream target branch, use rebase – as opposed to pull or
merge – to avoid polluting the commit history with spurious merges.
[Learn more](https://www.atlassian.com/git/articles/git-team-workflows-merge-or-rebase)
about the differences between merge and rebase Git workflows.

#### Rebase procedure

You can rebase your feature branch with the following procedure, where
`feature-branch` is the name of your branch. Further explanation of rebase and
its options can be found
[here](https://docs.gitlab.com/ee/topics/git/git_rebase.html).

1. `git checkout feature-branch`
2. `git fetch origin main`
3. `git rebase origin/main`
4. `git push --force-with-lease`
