# nutrition-staff

CMS/CRM admin and the single backend for the Dr. Omnia platform.

## Local setup

This app consumes the private `@kira-joo/*` toolkits from GitHub Packages. The
tracked `.npmrc` maps that scope to the registry but deliberately holds **no
credentials** — put your token in `~/.npmrc` instead:

```
//npm.pkg.github.com/:_authToken=<your token>
```

Then enable the repo's commit guard once per clone, so a credential can't be
committed by accident:

```bash
git config core.hooksPath .githooks
```