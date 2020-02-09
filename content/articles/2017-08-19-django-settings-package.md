---
title: "Django settings package"
slug: "django-settings-package"
date: 2017-08-19 10:47:22 +0200
tags:
  - "Software Engineering"
  - "Python"
  - "Django"
---

When starting a new Django project, you get a `settings.py` file
with some initial basic settings in it.
This is rarely complex enough for real world projects.
Lets take a look at how to improve the settings management in Django.

There is no claim that the examples here will fit perfectly
for your specific project.
However, this provides a framework for dealing with Django settings,
and it is based on several years of real world
experience in large Django projects.

With this method, there is no need to ever set `DJANGO_SETTINGS_MODULE`,
it stays exactly the same as when the project was created
with `django-admin startproject`.
Yet, it allows for dynamic control over any Django setting
via other environment variables.


## Convert settings into a package

An import statement in Python can point to
either a module or a package interchangeably.
This means that the settings module can be converted into a package,
without having to change anything else in the framework.
As long as there is an `__init__.py` file in the package
that does whatever the module would have done,
the code that is doing the import (Django) will not care.

Lets go from this:

```plain
.
├── manage.py
└── rainbows
     ├── __init__.py
     ├── urls.py
     ├── wsgi.py
     └── settings.py
```

To this:

```plain
.
├── manage.py
└── rainbows
     ├── __init__.py
     ├── urls.py
     ├── wsgi.py
     └── settings
          ├── __init__.py
          ├── base.py
          ├── allowed_hosts.py
          └── envs
               ├── __init__.py
               ├── dev.py
               ├── stage.py
               └── prod.py
```


#### settings/\_\_init\_\_.py

Avoid putting any actual settings in this file,
`__init__.py` files are reserved for package level imports only.
Lets set up a system that does some dynamic imports,
based on an environment variable.

```python
import os
import importlib


env = os.environ.get('DJANGO_SETTINGS_ENV')

module_paths = []

module_paths.append('rainbows.settings.base')

if env:
    module_paths.append('rainbows.settings.envs.{env}'.format(env=env))

module_paths.append('rainbows.settings.allowed_hosts')


for module_path in module_paths:
    module = importlib.import_module(module_path)
    globals().update(module.__dict__)
```

A list called `module_paths` is created,
and populated with multiple strings
that contain paths to python modules that are going to be imported.
One of the module path strings is constructed dynamically,
based on the value of the environment variable `DJANGO_SETTINGS_ENV`
stored in the `env` variable.

The actual imports happen on the last two lines.
The calls to `importlib.update_module()` and `globals().update()` produces
a result that is nearly identical to a `from somewhere import *` statement.
(Assuming that `module_path` contains the string `'somewhere'`).

This makes all module level variables in the various imported modules
(such as `INSTALLED_APPS` in `base.py`) appear at
the module level of the `__init__` module.
And any variable in the `__init__` module will automatically
be available at the `settings` package level,
which satisfies Django when it imports `rainbows.settings`.

[import]: https://docs.python.org/3/reference/simple_stmts.html#import

I say *nearly* identical, because when doing `import *` with
the [regular import statement][import], it actually ignores names that start
with an underscore. (See the section on *public names*).
But since Django settings files should never contain any variables
that start with an underscore, this will not be an issue.


#### settings/base.py

This file contains regular Django settings such as `INSTALLED_APPS`,
that should apply regardless of the current value of `DJANGO_SETTINGS_ENV`.


#### settings/envs/\_\_init\_\_.py

This file is empty.

#### settings/envs/dev.py

This file contains regular Django settings, such as `DEBUG`,
that should apply only for the dev environment.

```python
from ..base import *  # noqa


DEBUG = True

SECRET_KEY = '...'

INSTALLED_APPS += [
    'debug_toolbar'
]
```

The `from ..base import *` statement is actually
not necessary in order for the code to run.
However, it helps with autocompletion when coding in an IDE.

#### settings/envs/stage.py

This file contains regular Django settings,
that should apply only for the stage environment.

```python
from ..base import *  # noqa


DEBUG = False

SECRET_KEY = '...'
```

#### settings/envs/prod.py

This file contains regular Django settings,
that should apply only for the prod environment.

```python
from ..base import *  # noqa


DEBUG = False

SECRET_KEY = '...'
```

#### settings/allowed_hosts.py

Allowed hosts deserves its own module,
because it contains some dynamic code to determine the correct domains
based on the current environment.

```python
import os


env = os.environ.get('DJANGO_SETTINGS_ENV')

hosts = {
    'dev': [
        '*',
    ],
    'stage': [
        'staging.rainbows.tld',
    ],
    'prod': [
        'rainbows.tld',
    ],
}

if env:
    ALLOWED_HOSTS = hosts[env]
```



## Final words

To avoid confusion,
make sure that a setting only occurs at one level in the hierarchy,
and that it occurs in all modules at that level.
For example; the `DEBUG` setting in the above code is being set
at the environment level.
Lets make sure that it does not also occur in `base.py`
And lets make sure that it does occur in
all three env modules: `dev.py`, `stage.py`, and `prod.py`.

Use only environment variables as input for the settings package.
It is a standard way of interfacing between an OS and a program.
That means it will be portable across any platform you decide to deploy on.

With this method, it is simple to add more dimensions.
In this example there is only one input, `DJANGO_SETTINGS_ENV`.
But you could add more environment variables and sub packages
for anything you come up with.

Perhaps you want to spin up multiple instances of the same project,
under different domains with different url patterns for each domain.
You could add an environment variable `DJANGO_SETTINGS_SITE`,
and a `settings/sites` package,
and have different values for `ROOT_URLCONF` in the various site modules,
and adapt `allowed_hosts.py` to accomodate for the different sites.

Or perhaps you want to deploy multiple instances
of the project in different zones,
and want to point each instance to a different API gateway.
You could add an environment variable `DJANGO_SETTINGS_ZONE`,
and a `settings/zones` package,
and have a `API_GATEWAY` setting that varies for each zone module.
