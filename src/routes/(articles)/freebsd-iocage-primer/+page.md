---
url: "freebsd-iocage-primer"
title: "FreeBSD Iocage Primer"
date: "2017-06-20"
description: >
  Installing and using iocage to manage jails on FreeBSD.
tags:
  - "System Administration"
  - "FreeBSD"
  - "Jails"
---

Jails is a very stable and mature feature in FreeBSD.
However, the standard interface for jails
is slightly too cumbersome for my taste.
The Iocage project provides a higher level interface for administrating jails.

Currently, the project is in a bit of flux,
the [original (now legacy) version](https://github.com/iocage/iocage_legacy)
was written in shell script.
The [new version](https://github.com/iocage/iocage) is written in python.
The new version is not available as a binary package,
it's only available from ports,
under the name `sysutils/py3-iocage`, and requires Python 3.6.


## Tutorial

Assuming that the host is on the network `10.0.0.0/8`,
and that the host network interface is called `igb0`
(another typical name would be `em0`).

This tutorial will use the "shared IP" method
for assigning IP addresses to the jails.
IP addresses created on the jails will be created
as additional IP addresses on the hosts network interface.

There is another option, which is called `VIMAGE`.
This allows creating bridge interfaces on the host,
and vnet interfaces in the jails.
The main benefit of this is that the jails
do not see the interfaces of the host, they only see the vnet interfaces.
However this is experimental, and requires compiling the kernel with `VIMAGE`.

#### Installation

Lets add the following to `/etc/make.conf`:

```
DEFAULT_VERSIONS+=python3=3.6
```

And then install the package.

```plain
$ cd /usr/ports/sysutils/py3-iocage/
$ sudo make install
```

Assuming no errors, iocage can now be activated.

Lets activate it on the pool `tank`.
This will create a filesystem structure under `tank/iocage`,
which will contain all data for releases, jails, templates, etc.

```plain
$ sudo iocage activate tank
ZFS pool 'tank' successfully activated.
```

A big benefit that iocage has over standard FreeBSD jails,
is that all the necessary data for a jail,
including all of its properties (such as IP address),
are stored under this filesystem.
Where as with standard jails you would have to backup both the jail,
as well as its config files located elsewhere in the root filesystem.

#### Fetch a release

Before creating a jail, a release must be downloaded.

Lets download `11.0-RELEASE`.

```plain
$ sudo iocage fetch -r 11.0-RELEASE
```

#### Create a template from the release

Templates are not mandatory to use,
but it is one way to have your personal global settings
applied to subsequent jails.

Lets create a jail called `template`.

```plain
$ sudo iocage create tag=template -r 11.0-RELEASE
b650df9e-f7e8-48b8-b18b-1992cd005473 (template) successfully created!
```

```plain
$ sudo iocage set ip4_addr="igb0|10.0.1.100/24" template
Property: ip4_addr has been updated to igb0|10.0.1.100/24
```

```plain
$ sudo iocage set host_hostname="template" template
Property: host_hostname has been updated to template
```

```plain
$ sudo iocage start template
* Starting b650df9e-f7e8-48b8-b18b-1992cd005473 (template)
  + Started OK
  + Starting services OK
```

The `list` command should show something like this.

```plain
$ sudo iocage list
+-----+----------+-------+----------+--------------+------------+
| JID |   UUID   | STATE |   TAG    |   RELEASE    |    IP4     |
+=====+==========+=======+==========+==============+============+
| 1   | b650df9e | up    | template | 11.0-RELEASE | 10.0.1.100 |
+-----+----------+-------+----------+--------------+------------+
```

#### Configure the template

Lets open a shell inside the jail `template`.

```plain
$ sudo iocage console template
```

Lets confirm that this is the right machine.

```plain
$ hostname
template
```

Configure any universal settings, for example:

- Create users.
- Make sure the uid/gid in the jail matches the uid/gid on the host.  
  This is useful if using `nullfs` to mount file systems
  from the host in the jail.
- Add SSH keys to users.
- Configure shell for users.
- Enable `sshd`.
- Configure `sudo` or `doas`.

#### Make the jail into a template

Lets stop the jail, and set `template=yes` on it.

```plain
$ sudo iocage stop template
* Stopping b650df9e-f7e8-48b8-b18b-1992cd005473 (template)
  + Stopping services OK
  + Removing jail process OK
```

```plain
$ sudo iocage set template=yes template
b650df9e-f7e8-48b8-b18b-1992cd005473 (template) converted to a template.
```

The `list` command should now not show the jail `template`.

Instead, the `list -t` command should show the template.

```plain
$ sudo iocage list -t
+-----+----------+-------+----------+--------------+------------+
| JID |   UUID   | STATE |   TAG    |   RELEASE    |    IP4     |
+=====+==========+=======+==========+==============+============+
| -   | b650df9e | down  | template | 11.0-RELEASE | 10.0.1.100 |
+-----+----------+-------+----------+--------------+------------+
```

#### Create a jail from the template

Lets create a jail called `www` based on the previously created template.

```plain
$ sudo iocage create tag=www -t template
2ae9abbc-4070-4af1-8056-432e81ee1f84 (www) successfully created!

$ sudo iocage set ip4_addr="igb0|10.0.1.2/24" www
```

The `list` command should now show something like this:

```plain
$ sudo iocage list
+-----+----------+-------+-----+--------------+----------+
| JID |   UUID   | STATE | TAG |   RELEASE    |   IP4    |
+=====+==========+=======+=====+==============+==========+
| -   | 2ae9abbc | down  | www | 11.0-RELEASE | 10.0.1.2 |
+-----+----------+-------+-----+--------------+----------+
```

Notice that `JID` is empty,
that is because a jail only receives an ID once its started.
At this point all that really exists is a ZFS filesystem,
with all the files and directories for the jail's root filesystem in it.

Lets see what that looks like.

```plain
$ zfs list
NAME                                                          USED  AVAIL  REFER  MOUNTPOINT
tank/iocage/jails/2ae9abbc-4070-4af1-8056-432e81ee1f84        202M  3.51T   100K  /iocage/jails/2ae9abbc-4070-4af1-8056-432e81ee1f84
tank/iocage/jails/2ae9abbc-4070-4af1-8056-432e81ee1f84/root   202M  3.51T   811M  /iocage/jails/2ae9abbc-4070-4af1-8056-432e81ee1f84/root
```

Lets start the jail.

```plain
$ sudo iocage start www
* Starting 2ae9abbc-4070-4af1-8056-432e81ee1f84 (www)
  + Started OK
  + Starting services OK
```

Once the `start` command has finished,
the `list` command will show that `STATE` is `up`,
and `JID` has been set to a procedurally generated Jail ID.

```plain
$ sudo iocage list
+-----+----------+-------+-----+--------------+----------+
| JID |   UUID   | STATE | TAG |   RELEASE    |   IP4    |
+=====+==========+=======+=====+==============+==========+
| 2   | 2ae9abbc | up    | www | 11.0-RELEASE | 10.0.1.2 |
+-----+----------+-------+-----+--------------+----------+
```

And its IP address will be visible under `ifconfig`,
as an additional address next to the host machine's address.

```plain
$ ifconfig igb0
igb0: flags=8943<UP,BROADCAST,RUNNING,PROMISC,SIMPLEX,MULTICAST> metric 0 mtu 1500
    options=6403bb<RXCSUM,TXCSUM,VLAN_MTU,VLAN_HWTAGGING,JUMBO_MTU,VLAN_HWCSUM,TSO4,TSO6,VLAN_HWTSO,RXCSUM_IPV6,TXCSUM_IPV6>
    ether 0c:c4:7a:86:64:da
    inet 10.0.0.11 netmask 0xff000000 broadcast 10.255.255.255
    inet 10.0.1.2 netmask 0xffffff00 broadcast 10.0.1.255
    nd6 options=29<PERFORMNUD,IFDISABLED,AUTO_LINKLOCAL>
    media: Ethernet autoselect (1000baseT <full-duplex>)
    status: active
```

## An alternative to templates

Even though iocage templates work perfectly fine,
the concept of templates does have some limitations.
Since jails are created from templates only once,
any updates to a template will not be reflected in the concrete jails.
This means that you most likely want to run some
configuration management tool on your concrete jails,
at least if you have more than a handful of them to manage.
If that is the case, it begs the question: why use templates at all?
All of the universal settings can be handled by the configuration management tool,
a template would be unnecessary at that point.

[jailconn]: https://github.com/ansible/ansible/blob/devel/lib/ansible/plugins/connection/jail.py
[iocageconn]: https://github.com/ansible/ansible/blob/devel/lib/ansible/plugins/connection/iocage.py

Ansible actually has support for [iocage connections][iocageconn]
(which is based on the [jail connection][jailconn]).
This is as far as I can see not documented at all,
but I have tested it and it works perfectly fine.
It does not support `become`, but that is sort of an anti pattern anyway,
no big deal.
In order to use it, all you do is set
the var `ansible_connection` to `iocage`.
For example in your `group_vars` for a group called `jails`.

For this use case, lets create jails like this instead.

```plain
$ sudo iocage create tag=www -r 11.0-RELEASE
```

This creates the jail directly from a release,
instead of creating it from a template.
There is no need to create a template at all,
all the universal settings can be moved into ansible tasks instead,
and `www` can be added as a host in the ansible inventory.

The iocage connection in ansible connects to the jail via the `tag` value,
so there is not even a need to add an IP address to it.
However, the connection works by using `jexec`,
which means that ansible must be run on the host machine
where the jails exist,
and it must be run as root.
