# Submission checklist

What Codegeist asks for, and what is done.

| Requirement | Status |
| --- | --- |
| Category | Apps for Business Teams |
| Bonus prizes | Best Agents (`rovo:agent`), Best MCP (`rovo:mcp`), Best Teamwork Graph (`graph:connector`) |
| Explanation of the technology | [README](../README.md) and [DEVPOST.md](DEVPOST.md) |
| Demo video, under 5 minutes, public on YouTube | **To do.** See [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md). Run the Evaluation tab first and use its real numbers. |
| Installation link for judges | **To do**, see below |
| Marketplace bonus | Not entered. See below. |

## Installation link

An installation link needs a production deployment, then one switch in the developer console. Only the app owner can do the second part.

1. Build and deploy to production (publishes the app to the production environment; it installs nothing):
   ```bash
   npm run build
   forge deploy -e production --approve MAJOR_VERSION_RULE
   ```
   `MAJOR_VERSION_RULE` is needed because the Teamwork Graph scopes were added after the first deploy.
2. Open the [developer console](https://developer.atlassian.com/console/myapps), choose the app, then **Distribution**.
3. Edit the distribution controls, switch **Sharing** on, choose the products the link supports (Jira and Confluence), and copy the link.
4. Paste the link into the README (the TODO under the badges), into "Try it", and into the Devpost form.
5. Give the judges these steps with it: install on a site where you are admin, open **Aviso Previo Admin**, click **Load sample data**, and then follow [Try it](../README.md#try-it). Connecting the Teamwork Graph connector is optional (Apps, Connected apps, Aviso Previo, Connections).

Notes from the Atlassian docs:
- Anyone installing must be an admin of the site.
- A newly generated link disables the previous one; existing installs keep working.
- **An app that has been submitted for Marketplace listing, or that declares a license, cannot be shared by installation link.** That is why Marketplace and the link conflict. See below.

## Marketplace (optional bonus)

The bonus asks for a published listing or a link to the Marketplace review ticket. It is a real piece of work: a Marketplace partner account, a listing (name, tagline, description, screenshots, support and privacy policy URLs, pricing), and Atlassian's review.

The conflict: because a submitted app cannot be shared by installation link, entering Marketplace means either giving judges access through the listing, or keeping a separate unlicensed copy of the app for the link. That second app is a second deploy to maintain. Unless you want to take on both, the lower-risk path is to skip Marketplace and put your time into the video and the live checks.

If you do enter it, you will need: [assets/](../assets/) (logo, 144 and 512 icons, cover), the screenshots in [docs/img/](img/), a public privacy policy, a support contact, and the description from [DEVPOST.md](DEVPOST.md).
