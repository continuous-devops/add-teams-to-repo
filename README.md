# add-teams-to-repo

This is a GitHub Action that allows you to add teams to a repository within a GitHub organization.

## Inputs

The action takes the following inputs:

- `organization`: The name of the GitHub organization. This is a required input.
- `repo_name`: The name of the GitHub repository to which the teams will be added. This is a required input.
- `teams`: The teams to be added to the repository. This is a required input.
- `pat`: A personal access token for authentication. This is optional, and can be used instead of an app for authentication.
- `api_url`: The source GitHub API URL. This is optional, with a default value of "https://api.github.com".
- `is_debug`: A flag to enable debug mode. This is optional, with a default value of "true".

## Usage

To use this action, you need to include it in your workflow file `(.github/workflows/workflow.yml)`, and provide the necessary inputs. Here is an example:
  
  ```yaml
  name: Add Teams to Repo

  on:
    push:
      branches:
        - main

  jobs:
    add_teams:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v2
        - name: Add teams to repo
          uses: your-org/add-teams-to-repo@v1
          with:
            organization: 'your-org'
            repo_name: 'your-repo'
            teams: 'team1,team2'
            pat: ${{ secrets.PAT }}
  ```

In this example, replace `'your-org'`, `'your-repo'`, `'team1 team2'`, and `${{ secrets.PAT }}` with your organization name, repository name, team names (comma-separated), and personal access token, respectively.

## Running the Action

This action runs using Node.js 20, and the main script is `dist/index.js`.

## Debugging

To enable debug mode, set the `is_debug` input to "true". This can help with troubleshooting if you encounter any issues.

## Local Development

For local development, you can use nodemon to automatically restart the application whenever file changes are detected. You can start the application with npm start.

## Testing

Tests are written using Jest. You can run the tests with npm test.

## Building

This project uses [ncc](https://github.com/vercel/ncc) to compile the Node.js source code into a single file that can be run as a GitHub Action.

Before building, make sure to install the project dependencies:

```bash
npm install
```

Then, you can build the project with the following command:

```bash
npm run build
```

This will create a `dist/index.js` file, which is the compiled version of the action. This file should be committed to the repository, as it is what GitHub will use to run the action.

Please note that any changes to the source code will require a new build.

## Publishing

This section assumes that you have a build script in your package.json file that runs ncc build index.js -o dist. If your build command is different, please adjust the instructions accordingly.

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
