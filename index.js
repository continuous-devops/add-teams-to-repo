const { Octokit } = require("@octokit/rest");
const core = require("@actions/core");
const github = require("@actions/github");
const { json } = require("stream/consumers");
const { create } = require("yallist");

const context = github.context;
// Get the user, organization, repo, and template from the issue event payload
const user = context.payload?.issue?.user?.login || process.env.USER;
const organization = context.payload?.organization?.login || process.env.ORGANIZATION;
const issuesRepoName = context.payload?.repository?.name || process.env.ISSUES_REPO_NAME;
const issuesNumber = context.payload?.issue?.number || process.env.ISSUES_NUMBER;

// Get the repository name to create and template from the workflow file
const repoName = core.getInput("repo_name") || process.env.REPO_NAME;
const teams = core.getInput("teams") || process.env.TEAMS;

// Get the authorization inputs from the workflow file
const githubApiUrl = core.getInput("api_url") || process.env.API_URL;
const githubPAT = core.getInput("pat") || process.env.PAT;
const isDebug = core.getInput("is_debug") || process.env.DEBUG;

core.info(`isDebug? ${isDebug}`);

// Create Octokit instances for source and target
const octokit = createOctokitInstance(githubPAT, githubApiUrl);

// Function to create Octokit instance
function createOctokitInstance(PAT, apiUrl) {
  // Prefer PAT over GitHub App for authentication
  return new Octokit({
    auth: PAT,
    baseUrl: apiUrl,
    log: core.isDebug() ? console : null,
  });
}

async function createComment(body) {
  return await octokit.issues.createComment({
    owner: organization,
    repo: issuesRepoName,
    issue_number: issuesNumber,
    body: body,
  });
}

async function addTeams(team) {
  core.debug(`Adding team ${team} to the repository ${repoName}`);
  return await octokit.request("PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}", {
    org: organization,
    team_slug: team,
    owner: organization,
    repo: repoName,
    permission: "admin",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

async function checkIsUserAdmin() {
  return await octokit.request("GET /repos/{owner}/{repo}/collaborators/{username}/permission", {
    owner: organization,
    repo: repoName,
    username: user,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

async function closeIssue() {
  return await octokit.issues.update({
    owner: organization,
    repo: issuesRepoName,
    issue_number: issuesNumber,
    state: "closed",
  });
}

//  Add teams to the repository function


async function addTeamsToRepo() {
  core.debug(`
  vars:
    user: ${user}
    organization: ${organization}
    issuesRepoName: ${issuesRepoName}
    issueNumber: ${issuesNumber}
    repoName: ${repoName}
    teams: ${teams}
    githubApiUrl: ${githubApiUrl}
    githubPAT: ${githubPAT}
  `.trim());
  try {
    await octokit.repos.get({
      owner: organization,
      repo: repoName,
    });
    core.info(`Repository ${repoName} exists`);
  } catch (error) {
    if (error.status === 404) {
      core.info(`Repository ${repoName} doesn't exist`);
      // Comment back to the issue that repository doesn't exist
      await createComment(`Repository ${repoName} doesn't exist.`);
      core.setFailed(`Repository ${repoName} doesn't exist.`);
      throw error;
    }
  }

  try {
    isUserAdmin = await checkIsUserAdmin();
    if (isUserAdmin.permission === "admin") {
      core.info(`User @${user} is already an admin to ${repoName}`);
      return;
    }
    core.info(`User @${user} is an admin of ${repoName}`);
  } catch (error) {
    core.info(`User @${user} is not an admin of ${repoName}`);
    // Comment back to the issue that user is not an admin
    await createComment(`User is not an admin, can NOT add teams to the repository ${repoName}: ${error.message}`);
    core.setFailed(`User is not an admin, can NOT add teams to the repository ${repoName}: ${error.message}`);
    throw error;
  }

  try {
    const teamList = teams.split(" ");
    for (let team of teamList) {
      core.info(`Adding team ${team} to the repository ${repoName}`);
      await addTeams(team.trim());
    }
    await createComment(`Teams added to the repository ${repoName}`);
  } catch (error) {
    core.info(`Failed to add teams to the repository ${repoName}: ${error.message}`);
    // Comment back to the issue that failed to add teams
    await createComment(`Failed to add teams to the repository ${repoName}: ${error.message}`);
    core.setFailed(`Failed to add teams to the repository ${repoName}: ${error.message}`);
    throw error;
  }
}

// Call the function to add teams to the repository
addTeamsToRepo();

