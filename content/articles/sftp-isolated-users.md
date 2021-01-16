---
url: "sftp-isolated-users"
title: "SFTP server with isolated users"
date: 2020-03-31 12:15:34 +0200
tags:
  - "System Administration"
  - "SFTP"
  - "Security"
---

SFTP is an old protocol that still sees a lot of usage,
for a good reason, it is very secure.  
Let's take a look at how to configure SSHD to support multiple isolated SFTP users,
using Ansible.

<!--more-->

These are the goals that will be achieved in this article.

- Users cannot access or see other users files.
- Users cannot see what other users even exist.
- Users can only use SFTP, not SSH.
- All data is stored on a separate disk, not on the root disk.



## Ansible configuration

Declare a variable like this.

```yaml
sshd_sftp_users:
  - name: "user1"
    uid: "4201"
    gid: "4201"
    authorized_keys:
      - "user1/id_rsa.pub"

  - name: "user2"
    uid: "4202"
    gid: "4202"
    authorized_keys:
      - "user1/id_rsa.pub"
```

Create this file with the name `sshd_config_block`.

```plain
Match Group sftp-users
    ChrootDirectory /data/sftp-chroots/%u
    ForceCommand internal-sftp
    PasswordAuthentication no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no
    PermitTunnel no
```

Then run the following tasks.

```yaml
- name: "Add config block"
  blockinfile:
    path: "/etc/ssh/sshd_config"
    block: "{{ lookup('file', 'sshd_config_block') }}"
    insertafter: "EOF"
  notify:
    - "Restart sshd"

- name: "Create group sftp-users"
  group:
    name: "sftp-users"
    gid: "4000"

- name: "Create each user group"
  group:
    name: "{{ item.name }}"
    gid: "{{ item.gid }}"
  loop: "{{ sshd_sftp_users }}"

- name: "Create each user"
  user:
    name: "{{ item.name }}"
    uid: "{{ item.uid }}"
    group: "{{ item.name }}"
    create_home: true
    home: "/data/home/{{ item.name }}"
    skeleton: "/data/etc/skel"
    password_lock: true
    shell: "/bin/false"
  loop: "{{ sshd_sftp_users }}"

- name: "Add authorized keys for each user"
  authorized_key:
    user: "{{ item.0.name }}"
    key: "{{ lookup('file', 'keys/' + item.1) }}"
  loop: "{{ sshd_sftp_users|subelements('authorized_keys') }}"

- name: "Add each user with role user to group sftp-users"
  user:
    name: "{{ item.name }}"
    groups:
      - "sftp-users"
    append: "yes"
  loop: "{{ sshd_sftp_users }}"

- name: "Mount home dir in each chroot"
  mount:
    src: "/data/home/{{ item.name }}"
    path: "/data/sftp-chroots/{{ item.name }}/data/home/{{ item.name }}"
    fstype: "none"
    opts: "bind"
    state: "mounted"
  loop: "{{ sshd_sftp_users }}"

- name: "Create /etc in each chroot"
  file:
    path: "/data/sftp-chroots/{{ item.name }}/etc"
    state: "directory"
    owner: "root"
    group: "root"
    mode: "755"
  loop: "{{ sshd_sftp_users }}"

- name: "Create /etc/passwd in each chroot"
  shell: |
    getent passwd {{ item.name }} > /data/sftp-chroots/{{ item.name }}/etc/passwd
  loop: "{{ sshd_sftp_users }}"

- name: "Create /etc/group in each chroot"
  shell: |
    getent group {{ item.name }} > /data/sftp-chroots/{{ item.name }}/etc/group
  loop: "{{ sshd_sftp_users }}"
```



## Explanation

The storage disk is mounted at `/data`, this is where all user data will be stored.

SFTP users are created with a home dir at `/data/home/username`,
so any files they upload via SFTP will be stored on the data disk.

#### SSHD config

It is important that the `Match` block is at the end of the `/etc/ssh/sshd_config` file,
because all subsequent directives will apply to it, or to any subsequent `Match` blocks.

#### Chroots

In order to ensure users are isolated from each other,
a chroot directory is created at `/data/sftp-chroots/username` for each user,
and `ChrootDirectory` is set to `/data/sftp-chroots/%u` in `sshd_config`.

This chroot dir is populated with
the minimum necessary files to satisfy an SFTP session.

- `/data/home/username`  
  A mount point for the home dir.  
  The home dir is where SFTP sessions normally start, and save files to.  
  Without it, SFTP sessions get rather confused about what directory the user is in.
- `/etc/passwd` and `/etc/group`  
  Contains one entry each, which are copies of the current users' entries.  
  This is not strictly necessary, it's just cosmetic.  
  Without it, SFTP users would see numeric UID and GID when listing files,
  instead of their alphanumeric username.

Finally, the home dir `/data/home/username` is mounted in
the chroots' home dir mount point `/data/sftp-chroots/username/data/home/username`.
This will make it so that any data that is uploaded via SFTP is stored
in the actual home dir, and not in the chroot.

So when the user opens an SFTP session, they will only see their own chroot file system,
which only contains the home dir for their own user.

```plain
$ sftp -i path/to/ida_rsa user1@example.com
sftp> pwd
Remote working directory: /data/home/user1
sftp> ls -l /
drwxr-xr-x    3 root     root         4096 Mar 26 17:55 data
drwxr-xr-x    2 root     root         4096 Mar 26 17:55 etc
sftp> ls -l /data/home
drwxr-xr-x    5 user1    user1        4096 Mar 26 17:56 user1
```



## References

This article is heavily influenced by the following article,
but has been simplified and automated.  
https://sanitarium.net/unix_stuff/sftp_chroot.html
