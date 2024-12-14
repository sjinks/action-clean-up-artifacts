import { endGroup, getInput, info, setFailed, startGroup } from '@actions/core';
import { context, getOctokit } from '@actions/github';

type Artifact = [number, string];

async function getArtifactList(
    octokit: ReturnType<typeof getOctokit>,
    owner: string,
    repo: string,
    run_id: number,
): Promise<Artifact[]> {
    const per_page = 100;
    let page = 1;

    const result: Artifact[] = [];

    for (;;) {
        // eslint-disable-next-line no-await-in-loop
        const response = await octokit.rest.actions.listWorkflowRunArtifacts({
            owner,
            repo,
            run_id,
            per_page,
            page,
        });

        const { artifacts } = response.data;
        if (!artifacts.length) {
            break;
        }

        artifacts.forEach((artifact) => result.push([artifact.id, artifact.name]));
        ++page;
    }

    return result;
}

async function run(): Promise<void> {
    try {
        const inputs = {
            token: getInput('token', { required: true }),
            run_id: +getInput('run_id', { required: true }),
            repo: getInput('repo'),
            pattern: getInput('pattern'),
        };

        let owner: string;
        let repo: string;
        if (inputs.repo) {
            [owner, repo] = inputs.repo.split('/', 2);
        } else {
            ({ owner, repo } = context.repo);
        }

        let pattern: RegExp;
        if (!inputs.pattern) {
            pattern = /^.+$/u;
        } else {
            pattern = new RegExp(inputs.pattern, 'u');
        }

        const octokit = getOctokit(inputs.token);
        const artifacts = (await getArtifactList(octokit, owner, repo, inputs.run_id)).filter((artifact) =>
            pattern.test(artifact[1]),
        );

        info(`Found ${artifacts.length} matching artifacts`);
        startGroup('Deleting artifacts');
        for (const [artifact_id, name] of artifacts) {
            // eslint-disable-next-line no-await-in-loop
            await octokit.rest.actions.deleteArtifact({
                owner,
                repo,
                artifact_id,
            });

            info(`Deleted artifact "${name}" (${artifact_id})`);
        }

        endGroup();
    } catch (error) {
        setFailed((error as Error).message);
    }
}

run().catch((error: unknown) => setFailed((error as Error).message));
