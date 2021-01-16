---
url: "samba-freebsd-zfs-nfsv4-acls"
title: "Samba 4 on FreeBSD with ZFS and NFSv4 ACLs"
date: 2017-07-11 11:28:44 +0200
tags:
  - "System Administration"
  - "FreeBSD"
  - "ZFS"
  - "Storage"
---

Configuring Samba has never been one of my favourite things.
This is just a quick recipe setting up Samba on FreeBSD
with a dedicated ZFS filesystem that uses ACLs.
It is set up for a single user,
where the user gets full control over all files.
It can be adapted to support more users by using groups,
and configuring permissions / ACLs for that.
It is written for FreeBSD 11 and Samba 4.6

[nfsv4_acls]: https://tools.ietf.org/html/rfc7530#section-6
[forums_samba_acl]: https://forums.freebsd.org/threads/17627/
[man_vfs_zfsacl]: https://fossies.org/linux/samba/docs/manpages/vfs_zfsacl.8
[dos_attributes]: https://en.wikipedia.org/wiki/File_attribute#DOS_and_Windows
[archive_bit]: https://en.wikipedia.org/wiki/Archive_bit
[storedosattributes]: https://www.samba.org/samba/docs/man/manpages-3/smb.conf.5.html#storedosattributes



## ZFS configuration

FreeBSD ZFS uses the [NFSv4 ACL][nfsv4_acls] standard
that is designed to be very similar to Windows/NT ACLs,
which is good news when setting up a Samba server.

There is no support for default ACEs (Access Control List Entries),
which is reflected in the `setfacl` man page under the `-d` flag:
`This option is not applicable to NFSv4 ACLs`.
However, there is support for inheritance,
which can achieve the same thing, with even finer grained control.

Even though there is no support for custom default ACEs,
FreeBSD does add its own default ACEs to all files,
based on whatever mode was requested by the current umask.
Any inherited ACEs are added before the default ACEs.

If you are planning on using ACE inheritance
or any other non-trivial ACLs at all,
I would say it is pretty much mandatory to
take a look at the ZFS properties `aclmode` and `aclinherit`
and make a decision about what values you want for them.

#### Aclmode

The default value is `discard`,
which means that running `chmod` on a file — that has a non-trivial ACL —
is going to **automatically remove** the custom ACEs,
and update the default ACEs to match the new mode.

Lets set `aclmode` to `restricted` to prevent any such accidents.

```plain
$ zfs set aclmode=restricted pool/filesystem
```

Now, running `chmod` on a file with a non-trivial ACL
is going to be denied with this output.

```plain
chmod: filename: Operation not permitted
```

#### Aclinherit

The default value is `restricted`,
which means that the `write_acl` and `write_owner` permissions
are removed from inherited ACEs.

The goal of this article is to give the user full control via inheritance,
so lets set `aclinherit` to `passthrough` to allow all permissions to be inherited.

```plain
$ zfs set aclinherit=passthrough pool/filesystem
```



## Setting permissions

The goal of this article is to support
a single user accessing the shared directory.

Lets have the user be the owner of the entire directory to be shared.

```plain
$ chown username:usergroup /pool/filesystem
```

Files created in FreeBSD always inherit their group from the parent directory.

Lets add an ACE that allows all permissions for a user by the name of `username`,
and that will be inherited.

```plain
$ setfacl -a 0 u:username:full_set:fd:allow /pool/filesystem
```

The argument `-a 0` defines that this ACE will be added
to the top of the ACL.
The string `full_set` in the access permissions section
translates to all permission bits.
The `f` and `d` bits in the inheritance section
defines that this ACE will be automatically inherited
on all files and directories.

Lets see what this new ACE looks like with `getfacl`.

```plain
$ getfacl /pool/filesystem
# file: /pool/filesystem
# owner: username
# group: usergroup
     user:username:rwxpDdaARWcCos:fd-----:allow
            owner@:rwxp--aARWcCos:-------:allow
            group@:r-x---a-R-c--s:-------:allow
         everyone@:r-x---a-R-c--s:-------:allow
```

Lets see what it looks like when creating a file in the directory.

```plain
$ touch /pool/filesystem/some_file
```

```plain
$ getfacl /pool/filesystem/some_file
# file: /pool/filesystem/some_file
# owner: username
# group: usergroup
     user:username:rwxpDdaARWcCos:------I:allow
            owner@:rw-p--aARWcCos:-------:allow
            group@:r-----a-R-c--s:-------:allow
         everyone@:r-----a-R-c--s:-------:allow
```

Notice the three default ACEs at the bottom,
and the one inherited ACE at the top.
The `I` bit in the inheritance section indicates that
the ACE was inherited.

Lets see what it looks like when creating a directory in the directory.

```plain
$ mkdir /pool/filesystem/some_dir
```

```plain
$ getfacl /pool/filesystem/some_dir
# file: /pool/filesystem/some_dir
# owner: username
# group: usergroup
     user:username:rwxpDdaARWcCos:fd----I:allow
            owner@:rwxp--aARWcCos:-------:allow
            group@:r-x---a-R-c--s:-------:allow
         everyone@:r-x---a-R-c--s:-------:allow
```

The `I` bit in the inheritance section indicates
that the ACE was inherited,
and the `f` and `d` bits — that were inherited with this ACE —
defines that its children will also inherit the ACE.



## Samba configuration

#### Enable the vfs_zfsacl module

Add the zfsacl vfs module and configure it.

```plain
vfs objects = zfsacl

nfs4:mode = special
nfs4:acedup = merge
nfs4:chown = no
```

I cannot explain exactly how these settings work,
it is something I just copy paste from [others][forums_samba_acl].
But [here][man_vfs_zfsacl] is some manpage I was able to find at least.

#### Store DOS attributes in extended attributes

There are four basic [DOS attributes][dos_attributes] in Windows.
Apparently the [archive bit][archive_bit] is especially important to preserve,
as this is appears to be a very ubiquitous feature in Windows,
and programs may choke if this attribute is not working.

This Samba setting stores DOS attributes
as an extended attribute called `DOSATTRIB`.

```plain
store dos attributes = yes
```

#### Disable DOS attribute mapping

Lets also disable these DOS attribute map settings,
otherwise Samba may fall back to
storing DOS attributes in the `r`, `w`, and `x` bits.
The [documentation][storedosattributes] is not clear on exactly when
this falling back would actually occur,
but I am guessing it would only happen
if the operating / file system does not support extended attributes.

```plain
map hidden = no
map system = no
map archive = no
map readonly = no
```

#### Other settings

Note that `nt acl support` is enabled by default in Samba.

Do not enable `inherit acls`, or `inherit permissions`, or `inherit owner`,
as that would be conflicting with
the inheritance of ACEs added in the earlier call to setfacl.

Some people seem to be throwing in `ea support` and `map acl inherit`,
this is not something I have needed.

It could be interesting to try to get
Shadow Copies working with the `vfs_shadow_copy2` module.

#### Complete example

Finally, here is a complete example.

```plain
[global]
    workgroup = WORKGROUP
    server string = server_name
    netbios name = server_name

    security = user
    encrypt passwords = true
    passdb backend = tdbsam

[share_name]
    path = /pool/filesystem
    valid users = username

    browsable = yes
    writable = yes
    printable = no
    read only = no
    guest ok = no
    public = no

    vfs objects = zfsacl

    nfs4:mode = special
    nfs4:acedup = merge
    nfs4:chown = no

    store dos attributes = yes

    map hidden = no
    map system = no
    map archive = no
    map readonly = no
```



## Running Samba

#### Do not bind on broadcast in jails

The nmb daemon in Samba tries by default to bind on the broadcast address.
When running in a jail — with a shared IP — this is not permitted,
and produces log messages like these.

```plain
[2017/07/07 10:31:01.843593,  0] ../source3/lib/util_sock.c:396(open_socket_in)
  bind failed on port 137 socket_addr = 10.255.255.255.
  Error = Can't assign requested address
[2017/07/07 10:31:01.843719,  0] ../source3/nmbd/nmbd_subnetdb.c:127(make_subnet)
  nmbd_subnetdb:make_subnet()
    Failed to open nmb bcast socket on interface 10.255.255.255 for port 137.  Error was Can't assign requested address
[2017/07/07 10:31:01.843752,  0] ../lib/util/become_daemon.c:111(exit_daemon)
  STATUS=daemon failed to start: NMBD failed when creating subnet lists, error code 13
```

Either disable broadcast binding in nmbd, by adding this Samba setting.

```plain
nmbd bind explicit broadcast = no
```

Or disable nmbd entirely, by adding this to `rc.conf`.

```plain
nmbd_enable="NO"
```

Disabling nmbd entirely has the added benefit of
reducing network chatter on the LAN.
Nmbd handles NetBIOS, which is only useful for discovery of shares.
If you are planning to map network drives manually by IP,
and do not need discovery, this is the cleanest solution.
Search the web for "netbios broadcast storm" for some interesting reading.
