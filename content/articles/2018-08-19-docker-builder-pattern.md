---
title: "Docker builder pattern"
slug: "docker-builder-pattern"
date: 2018-08-19 09:41:34 +0200
tags:
  - "Software Engineering"
  - "Docker"
  - "Linux"
---

When talking about Docker, the typical case is that the resulting build artifact of
the project is a Docker image that will be pushed to a Docker registry
and subsequently run on some production server.

That's not what this blog post is about.

Docker can be used very effectively in a project, to create isolated build environments,
even if the result of the project has nothing to do with Docker or containers.

Let's create a sample project that is a Python library called `superheroes`,
where the resulting build artifact is a cheese wheel that will be uploaded to PyPI.
(Using Python is just an example that I am familiar with,
the Docker patterns can be applied to any programming language).

This project is just some random library,
it has nothing to do with Docker or containers in and of itself,
but Docker can be used to create an isolated and reproducable environment
that is used to run the tests, build the package, and run the package uploading program.

The directory structure could look something like this.

```plain
.
├── Dockerfile
├── build.sh
├── README.md
├── requirements.txt
├── setup.cfg
├── setup.py
├── src
│   └── superheroes
│       └── __init__.py
├── tests
│   └── test_batman.py
└── tox.ini
```

This post will not go into all the details of how to write and test a Python package,
just keep in mind that the goal is to take what is in the `src/` directory,
and produce build artifacts into a `dist/` directory,
and upload those build artifacts to PyPI.

But what I do want to hilight are the `Dockerfile` and `build.sh` files.

Let's use a couple of different formatting and testing tools
to showcase the Docker usage.

- Tox runs the python tests.
- Shellcheck is used to validate the formatting of `build.sh`.
- Hadolint is used to validate the formatting of `Dockerfile`.
- Black is used to do automatic formatting of the Python source code.
- Beautysh is used to do automatic formatting of `build.sh`.

#### Dockerfile

Let's begin with the Dockerfile that is used to build the builder image.
The resulting builder image is used as a starting point for all build related commands,
so it contains requirements both for the tests and for the automatic code formatters.

```dockerfile
FROM python:3.6-slim

RUN mkdir /workdir
WORKDIR /workdir

RUN apt-get update \
        && apt-get install -y --no-install-recommends \
            shellcheck=0.4.4-4 \
        && apt-get clean \
        && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /workdir
RUN pip install -r requirements.txt

COPY ./src /workdir/src
COPY ./tests /workdir/tests
COPY ./build.sh /workdir
COPY ./setup.cfg /workdir
COPY ./setup.py /workdir
COPY ./tox.ini /workdir

ENV PYTHONUNBUFFERED=true
```

#### build.sh



```bash
#!/usr/bin/env bash

# Constants
builder_image="superheroes-builder"

# Globals
builder_cids=()

########################################################################################
# Helper functions
########################################################################################

# Build the builder image from Dockerfile.
function builder_build {
    docker build --rm -t "$builder_image" .
}

# Run a command in a builder container, and remember the container ID.
function builder_run {

    # Run the docker builder image, with all arguments bypassed,
    # and save the container ID in a file.
    docker run --cidfile .cidfile "$builder_image" "$@"

    # Remember the return code.
    local ret=$?

    # Append the container ID from the file to the global list.
    builder_cids+=($(cat .cidfile))

    # Remove the container ID file.
    rm .cidfile

    # Return the return code.
    return $ret
}

# Commit the latest builder container as an image.
function builder_commit {
    docker commit "${builder_cids[-1]}" "$builder_image"
}

# Copy files from the latest builder container.
function builder_copy_from {
    docker cp "${builder_cids[-1]}:$1" "$2"
}

# Remove all builder containers.
function builder_clean_containers {
    for cid in "${builder_cids[@]}"; do
        docker rm "$cid" > /dev/null
    done
}

# Remove all builder images.
function builder_clean_images {
    docker image remove "$builder_image"
}

########################################################################################
# Build commands
########################################################################################

# Set a signal handler that cleans all builder containers when this program exits.
trap builder_clean_containers EXIT

function build-builder-image {
    builder_build
}

function clean-builder-image {
    builder_clean_images
}

function run-tests {
    build-builder-image || exit

    builder_run tox || exit

    builder_run shellcheck build.sh || exit

    docker run --rm -i hadolint/hadolint < Dockerfile || exit
}

function format-code {
    build-builder-image || exit

    builder_run black . || exit
    builder_copy_from /workdir/src/superheroes ./src/ || exit
    builder_copy_from /workdir/tests ./ || exit
    builder_copy_from /workdir/setup.py ./ || exit

    builder_run beautysh -f build.sh || exit
    builder_copy_from /workdir/build.sh ./ || exit
}

function build-package {
    build-builder-image || exit

    builder_run python setup.py sdist bdist_wheel || exit
    builder_commit || exit
}

function upload-package {
    builder_run twine upload dist/* \
        --username "$SUPERHEROES_TWINE_USERNAME" \
        --password "$SUPERHEROES_TWINE_PASSWORD" || exit
}

"$@"
```

#### Running the tests

```plain
$ ./build.sh run-tests
```

First, it builds an updated vresion of the builder image, or exit on failure.

Exiting on failure is important because if building the builder image fails,
but there is an old builder image laying around, the old one will be used instead,
which might result in a false positive outcome of the test run.

Then, it runs the three test suites that we have chosen for this project,
Tox, Shellcheck, and Hadolint.
Again, exiting on failure for each step, so that any errors are immediately visible,
and not hidden further up in the output.

Finally, it runs the signal handler that was attached earlier,
that cleans up all builder containers that have been started.

#### Automatic code formatting

```plain
$ ./build.sh format-code
```

First, it builds an updated version of the builder image.

Then, it runs black which is the chosen code formatter for this project,
Note that the source code files are modified in place by black,
and since black is running in the builder container,
the updated files are also written inside the builder container,
so they are not immediately available anywhere on the host machine yet.

At this point the builder process is finished and the container status is `Exited`.
But the container is still perfectly intact and remains in Docker.
It can be seen by calling the `docker ps -a` command.
All the files that were modified are still available
in the file system of the exited container.

Then, it copies the updated source code files from the builder container,
which will overwrite the source code files in the working directory on the host machine.

The process is repeated for the next code formatting tool, beautysh.

Finally, it cleans up all builder containers via the signal handler.

#### Building the package

```plain
$ ./build.sh build-package
```

First, it builds an updated version of the builder image.

Then, it runs the python specific build script `setup.py sdist bdist_wheel`,
which will produce the two build artifacts in `dist/` (a .whl file and a .tar.gz file).
Note that the `dist/` folder is created inside the builder container,
so it is not immediately available anywhere on host machine.
The container is now exited, but remains intact in docker,
just like in the previous step.

Then, it commits the container as a new image.
This will take everything from the run, and save it as a new version of the image,
including the `dist/` folder that was just created.

Finally, it cleans up all builder containers via the signal handler.


#### Uploading the package

```shell
$ export SUPERHEROES_TWINE_USERNAME="my_username"
$ export SUPERHEROES_TWINE_PASSWORD="my_password"
$ ./build.sh upload-package
```

Assuming that this command is called after `build-package`,
the builder image will now contain the `dist/` folder with the build artifacts in it.
(Here it is up to the user to determine if the `build-package` step succeeded or not
before running this command).

So, instead of building an updated version of the builder image,
it assumes that there already is a builder image available from before,
and uses that to run the upload command.

The python specific program `twine` uploads the build artifacts
from the `dist/` folder to PyPI.

Finally, it cleans up all builder containers via the signal handler.
